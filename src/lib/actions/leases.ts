"use server";

import { db } from "../../db";
import { leases } from "../../db/schema/leases";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { tourRequests } from "../../db/schema/tours";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

export async function moveTenantIn(formData: FormData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    // 1. Get the current logged-in landlord
    const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    const landlord = existingUsers[0];
    if (!landlord) throw new Error("Landlord profile not found");

    // 2. Extract form data
    const tourId = formData.get("tourId") as string;
    const propertyId = formData.get("propertyId") as string;
    const tenantName = formData.get("tenantName") as string;
    const tenantEmail = formData.get("tenantEmail") as string;
    const rentAmount = parseInt(formData.get("rentAmount") as string);
    const startDateString = formData.get("startDate") as string;
    
    const startDate = new Date(startDateString);

    // 3. Find or Create the Tenant User 
    // (If they booked as a guest, we make a placeholder account so the lease has a valid tenantId)
    let tenantId;
    const foundTenants = await db.select().from(users).where(eq(users.email, tenantEmail));
    
    if (foundTenants.length > 0) {
      tenantId = foundTenants[0].id;
    } else {
      // Create a pending user account
      const insertedTenant = await db.insert(users).values({
        clerkId: `pending_${crypto.randomUUID()}`, // Placeholder until they actually sign up
        email: tenantEmail,
        fullName: tenantName,
        role: "tenant",
      }).returning();
      tenantId = insertedTenant[0].id;
    }

    // 4. Create the Lease
    await db.insert(leases).values({
      propertyId,
      tenantId,
      landlordId: landlord.id,
      rentAmount,
      billingCycle: "monthly",
      startDate,
      status: "active"
    });

    // 5. Update the Property Status to "Occupied"
    await db.update(properties)
      .set({ status: "occupied" })
      .where(eq(properties.id, propertyId));

    // 6. Mark the Tour Request as "Completed"
    await db.update(tourRequests)
      .set({ status: "completed" })
      .where(eq(tourRequests.id, tourId));

    // 7. Refresh the UI
    revalidatePath("/mgmt/dashboard");
    revalidatePath("/mgmt/tours");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to move tenant in:", error);
    throw new Error(error.message || "Failed to finalize lease.");
  }
}