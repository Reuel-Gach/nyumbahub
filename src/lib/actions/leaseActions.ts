"use server";

import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { users } from "@/db/schema/users";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function requestMoveOut(leaseId: string, moveOutDate: Date) {
  try {
    // 1. Authenticate the user
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (!dbUser) throw new Error("User profile not found");

    // 2. Verify the lease belongs to this tenant and is active
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

    // 3. Enforce the 30-day legal notice rule on the server side
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    thirtyDaysFromNow.setHours(0, 0, 0, 0); // Normalize to midnight

    if (new Date(moveOutDate) < thirtyDaysFromNow) {
      throw new Error("Kenyan law requires a minimum of 30 days notice.");
    }

    // 4. Update the database
    await db.update(leases)
      .set({
        status: "move_out_pending",
        terminationInitiator: "tenant",
        terminationNoticeDate: new Date(),
        moveOutDate: new Date(moveOutDate),
        updatedAt: new Date(),
      })
      .where(eq(leases.id, leaseId));

    // 5. Refresh the dashboard so the UI updates instantly
    revalidatePath("/tenant/dashboard");
    
    return { success: true };
  } catch (error: any) {
    console.error("Move out request error:", error);
    return { success: false, error: error.message || "Failed to process request" };
  }
}