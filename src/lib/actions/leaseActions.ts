"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { properties } from "@/db/schema/properties";

// 1. TENANT ACTION: Request standard 30-day move-out
export async function requestMoveOut(leaseId: string, moveOutDate: Date) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (!dbUser) throw new Error("User profile not found");

    const [lease] = await db.select().from(leases).where(
      and(
        eq(leases.id, leaseId),
        eq(leases.tenantId, dbUser.id),
        eq(leases.status, "active")
      )
    );

    if (!lease) {
      throw new Error("Active lease not found or you do not have permission.");
    }

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0); 

    if (new Date(moveOutDate) < thirtyDaysFromNow) {
      throw new Error("Kenyan law requires a minimum of 30 days notice.");
    }

    await db.update(leases)
      .set({
        status: "move_out_pending",
        terminationInitiator: "tenant",
        terminationNoticeDate: new Date(),
        moveOutDate: new Date(moveOutDate),
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId));

    revalidatePath("/tenant/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Move out request error:", error);
    return { success: false, error: error.message || "Failed to process request" };
  }
}

// 2. LANDLORD ACTION: Send mutual early termination offer to tenant
export async function offerEarlyTermination(leaseId: string) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (!dbUser) throw new Error("User profile not found");

    // Verify lease belongs to this landlord
    const [lease] = await db.select().from(leases).where(
      and(eq(leases.id, leaseId), eq(leases.landlordId, dbUser.id))
    );

    if (!lease) throw new Error("Lease not found or unauthorized.");

    await db.update(leases)
      .set({ 
        status: "early_termination_offered",
        updatedAt: new Date() 
      })
      .where(eq(leases.id, leaseId));

    revalidatePath("/mgmt/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Offer early termination error:", error);
    return { success: false, error: "Failed to send offer" };
  }
}

// 3. TENANT ACTION: Accept or decline the landlord's early termination offer
export async function respondToEarlyTermination(leaseId: string, accept: boolean) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (!dbUser) throw new Error("User profile not found");

    // Verify lease belongs to this tenant and is pending their response
    const [lease] = await db.select().from(leases).where(
      and(
        eq(leases.id, leaseId),
        eq(leases.tenantId, dbUser.id),
        eq(leases.status, "early_termination_offered")
      )
    );

    if (!lease) throw new Error("Offer not found or unauthorized.");

    if (!accept) {
      // If declined, return the lease to "active"
      await db.update(leases)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(leases.id, leaseId));
    } else {
      // If accepted, officially end the lease and take property off-market
      await db.update(leases)
        .set({ status: "ended", endDate: new Date(), updatedAt: new Date() })
        .where(eq(leases.id, leaseId));

      await db.update(properties)
        .set({ isAvailable: false, updatedAt: new Date() })
        .where(eq(properties.id, lease.propertyId));
    }

    revalidatePath("/tenant/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Respond to early termination error:", error);
    return { success: false, error: "Failed to process response" };
  }
}