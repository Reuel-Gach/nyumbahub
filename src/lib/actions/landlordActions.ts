"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { properties } from "@/db/schema/properties";

// 1. Issue a 30-Day Eviction Notice
export async function issueEviction(leaseId: string, reason: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (!dbUser) throw new Error("User profile not found");

    // Verify the landlord actually owns this lease
    const [lease] = await db.select().from(leases).where(
      and(eq(leases.id, leaseId), eq(leases.landlordId, dbUser.id))
    );

    if (!lease) throw new Error("Lease not found or unauthorized.");

    // Calculate legal 30-day notice period
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    await db.update(leases)
      .set({
        status: "eviction_notice",
        terminationInitiator: "landlord",
        terminationReason: reason,
        terminationNoticeDate: new Date(),
        moveOutDate: thirtyDaysFromNow,
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId));

    revalidatePath("/mgmt/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Eviction error:", error);
    return { success: false, error: error.message || "Failed to process eviction" };
  }
}

// 2. Finalize a Move-Out (Closes the lease and pulls property off-market)
export async function finalizeLease(leaseId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    
    // 1. Fetch the lease first so we know WHICH property to take off-market
    const [lease] = await db.select().from(leases).where(
      and(eq(leases.id, leaseId), eq(leases.landlordId, dbUser.id))
    );

    if (!lease) throw new Error("Lease not found or unauthorized");

    // 2. Officially end the lease
    await db.update(leases)
      .set({
        status: "ended",
        endDate: new Date(), 
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId));

    // 3. 🔥 FIX: Explicitly pull the property off the market
    await db.update(properties)
      .set({
        isAvailable: false,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, lease.propertyId));

    revalidatePath("/mgmt/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Finalize lease error:", error);
    return { success: false, error: "Failed to finalize lease" };
  }
}