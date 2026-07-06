import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema/payments"; // <-- NEW IMPORT

export async function POST(req: Request) {
  try {
    // NEW: We now require 'leaseId' from the frontend!
    const { phoneNumber, amount, accountReference, leaseId } = await req.json();

    if (!phoneNumber || !amount || !leaseId) {
      return NextResponse.json({ error: "Phone number, amount, and leaseId are required" }, { status: 400 });
    }

    let formattedPhone = phoneNumber.replace(/\s+/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    const consumerKey = process.env.DARAJA_CONSUMER_KEY!;
    const consumerSecret = process.env.DARAJA_CONSUMER_SECRET!;
    const shortCode = process.env.DARAJA_SHORTCODE || "174379";
    const passkey = process.env.DARAJA_PASSKEY!;
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/mpesa/callback`;

    // 1. Generate Access Token
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const tokenResponse = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${credentials}` },
        cache: "no-store",
      }
    );
    
    if (!tokenResponse.ok) throw new Error("Failed to get Daraja Access Token");
    const { access_token: accessToken } = await tokenResponse.json();

    // 2. Generate Password and Timestamp
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    // 3. Send the STK Push Request
    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount), // Daraja requires whole numbers
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: accountReference || "NyumbaHub Rent",
      TransactionDesc: "Rent Payment via NyumbaHub",
    };

    const stkResponse = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      }
    );

    const stkData = await stkResponse.json();

    if (stkData.ResponseCode !== "0") {
      return NextResponse.json({ error: stkData.errorMessage || "Failed to trigger STK Push" }, { status: 400 });
    }

    // 4. 🔥 DATABASE INSERTION: Log the pending transaction
    await db.insert(payments).values({
      leaseId: leaseId,
      amountPaid: Math.round(amount),
      phoneNumber: formattedPhone,
      paymentMethod: "m-pesa",
      checkoutRequestId: stkData.CheckoutRequestID,
      status: "pending", // Start as pending until the callback arrives
    });

    return NextResponse.json({ 
      success: true, 
      checkoutRequestId: stkData.CheckoutRequestID,
      message: "STK Push triggered successfully. Please check your phone." 
    });

  } catch (error: any) {
    console.error("STK Push Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}