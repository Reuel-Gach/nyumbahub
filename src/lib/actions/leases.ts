"use server";

import { db } from "../../db";
import { leases } from "../../db/schema/leases";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { tourRequests } from "../../db/schema/tours";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

// --- 1. WRITE ACTION: Finalize Lease ---
export async function moveTenantIn(formData: FormData) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) throw new Error("Unauthorized");

    const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    const landlord = existingUsers[0];
    if (!landlord) throw new Error("Landlord profile not found");

    const tourId = formData.get("tourId") as string;
    const propertyId = formData.get("propertyId") as string;
    const tenantName = formData.get("tenantName") as string;
    const tenantEmail = formData.get("tenantEmail") as string;
    const rentAmountStr = formData.get("rentAmount") as string;
    const startDateString = formData.get("startDate") as string;
    
    if (!tourId || tourId.trim() === "") throw new Error("Missing Tour ID");
    if (!propertyId || propertyId.trim() === "") throw new Error("Missing Property ID");

    const rentAmount = parseInt(rentAmountStr) || 0;
    const startDate = startDateString ? new Date(startDateString) : new Date();

    let tenantId;
    const foundTenants = await db.select().from(users).where(eq(users.email, tenantEmail));
    
    if (foundTenants.length > 0) {
      tenantId = foundTenants[0].id;
    } else {
      const insertedTenant = await db.insert(users).values({
        clerkId: `pending_${crypto.randomUUID()}`, 
        email: tenantEmail || `pending_${crypto.randomUUID()}@placeholder.com`,
        fullName: tenantName || "Unknown Tenant",
        role: "tenant",
      }).returning();
      tenantId = insertedTenant[0].id;
    }

    await db.insert(leases).values({
      propertyId,
      tenantId,
      landlordId: landlord.id,
      rentAmount,
      billingCycle: "monthly",
      startDate,
      status: "active"
    });

    await db.update(properties)
      .set({ isAvailable: false }) 
      .where(eq(properties.id, propertyId));

    await db.update(tourRequests)
      .set({ status: "completed" })
      .where(eq(tourRequests.id, tourId));

    revalidatePath("/mgmt/dashboard");
    revalidatePath("/mgmt/tours");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to move tenant in:", error);
    throw new Error(error.message || "Failed to finalize lease.");
  }
}

// --- 2. READ ACTION: Get Active Leases for Payments ---
export async function getActiveLeases() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return [];

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id));
      
    const landlordId = existingUsers[0]?.id;
    if (!landlordId) return [];

    const activeLeases = await db
      .select({
        id: leases.id,
        rentAmount: leases.rentAmount,
        propertyTitle: properties.title,
        tenantName: users.fullName,
      })
      .from(leases)
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(users, eq(leases.tenantId, users.id))
      .where(
        and(
          eq(leases.landlordId, landlordId),
          eq(leases.status, "active")
        )
      );

    return activeLeases;
  } catch (error) {
    console.error("Failed to fetch active leases:", error);
    return [];
  }
}