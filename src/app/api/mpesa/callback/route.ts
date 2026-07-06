import { NextResponse } from "next/server";
import { db } from "@/db";
import { payments } from "@/db/schema/payments";
import { eq } from "drizzle-orm"; // <-- REQUIRED FOR DRIZZLE QUERIES

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    const callbackData = data.Body.stkCallback;
    const checkoutRequestId = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode; 
    const resultDesc = callbackData.ResultDesc;

    console.log("M-Pesa Callback Received:", { checkoutRequestId, resultCode, resultDesc });

    if (resultCode === 0) {
      // 1. Payment was successful! Extract the M-Pesa receipt number.
      const callbackMetadata = callbackData.CallbackMetadata.Item;
      const mpesaReceiptObj = callbackMetadata.find((item: any) => item.Name === "MpesaReceiptNumber");
      const mpesaReceipt = mpesaReceiptObj?.Value;

      // 2. 🔥 DATABASE UPDATE: Mark as completed
      await db.update(payments)
        .set({ 
          status: "completed", 
          referenceNumber: mpesaReceipt,
          updatedAt: new Date()
        })
        .where(eq(payments.checkoutRequestId, checkoutRequestId));
       
    } else {
      // 1. Payment failed (user cancelled, wrong PIN, timeout)
      // 2. 🔥 DATABASE UPDATE: Mark as failed
      await db.update(payments)
        .set({ 
          status: "failed",
          notes: resultDesc, // Save Safaricom's exact error message for debugging
          updatedAt: new Date()
        })
        .where(eq(payments.checkoutRequestId, checkoutRequestId));
    }

    // Safaricom ALWAYS expects a 200 OK response, otherwise they will aggressively retry the webhook.
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });

  } catch (error) {
    console.error("Error processing M-Pesa Callback:", error);
    // Still return 200 to Safaricom to prevent infinite retry loops
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" });
  }
}