"use server";

import { db } from "../../db";
import { payments } from "../../db/schema/payments";
import { leases } from "../../db/schema/leases";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// --- 1. WRITE ACTION: Log a new payment ---
export async function logPayment(formData: FormData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const leaseId = formData.get("leaseId") as string;
    const amountPaidStr = formData.get("amountPaid") as string;
    const paymentMethod = formData.get("paymentMethod") as "m-pesa" | "bank_transfer" | "cash";
    const referenceNumber = formData.get("referenceNumber") as string;
    const notes = formData.get("notes") as string;

    if (!leaseId) throw new Error("Missing Lease ID. Cannot assign payment.");

    const amountPaid = parseInt(amountPaidStr);
    if (isNaN(amountPaid) || amountPaid <= 0) {
       throw new Error("Invalid payment amount. Must be greater than 0.");
    }

    await db.insert(payments).values({
      leaseId,
      amountPaid,
      paymentMethod: paymentMethod || "m-pesa",
      referenceNumber: referenceNumber || null,
      notes: notes || null,
      status: "completed", // We mark it completed since it's a manual entry for now
    });

    // Refresh UI routes that depend on financial data
    revalidatePath("/mgmt/dashboard");
    revalidatePath("/mgmt/finances"); 

    return { success: true };
  } catch (error: any) {
    console.error("Failed to log payment:", error);
    throw new Error(error.message || "Failed to save payment to database.");
  }
}

// --- 2. READ ACTION: Get Landlord Ledger (All Payments) ---
export async function getLandlordLedger() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return [];

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id));
      
    const landlordId = existingUsers[0]?.id;
    if (!landlordId) return [];

    // The Magic: We JOIN 3 tables to get a rich financial ledger
    const ledger = await db
      .select({
        paymentId: payments.id,
        amount: payments.amountPaid,
        date: payments.paymentDate,
        method: payments.paymentMethod,
        reference: payments.referenceNumber,
        status: payments.status,
        propertyTitle: properties.title,
        expectedRent: leases.rentAmount,
        tenantName: users.fullName,
      })
      .from(payments)
      .innerJoin(leases, eq(payments.leaseId, leases.id))
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(users, eq(leases.tenantId, users.id))
      .where(eq(leases.landlordId, landlordId))
      .orderBy(desc(payments.paymentDate));

    return ledger;
  } catch (error) {
    console.error("Failed to fetch landlord ledger:", error);
    return [];
  }
}

// --- 3. UPDATE ACTION: Edit an existing payment ---
export async function updatePayment(formData: FormData) {
  try {
    const paymentId = formData.get("paymentId") as string;
    const amountPaidStr = formData.get("amountPaid") as string;
    const paymentMethod = formData.get("paymentMethod") as "m-pesa" | "bank_transfer" | "cash";
    const referenceNumber = formData.get("referenceNumber") as string;

    if (!paymentId) throw new Error("Missing Payment ID");

    const amountPaid = parseInt(amountPaidStr);
    if (isNaN(amountPaid) || amountPaid <= 0) {
       throw new Error("Invalid payment amount. Must be greater than 0.");
    }

    await db.update(payments).set({
      amountPaid,
      paymentMethod,
      referenceNumber: referenceNumber || null,
    }).where(eq(payments.id, paymentId));

    revalidatePath("/mgmt/finances");
    revalidatePath("/mgmt/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update payment:", error);
    throw new Error(error.message || "Failed to update payment in database.");
  }
}

// --- 4. DELETE ACTION: Remove a payment ---
export async function deletePayment(paymentId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    await db.delete(payments).where(eq(payments.id, paymentId));

    revalidatePath("/mgmt/finances");
    revalidatePath("/mgmt/dashboard");

    return { success: true };
  } catch (error) {
    console.error("Failed to delete payment:", error);
    throw new Error("Failed to delete payment");
  }
}