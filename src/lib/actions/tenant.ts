"use server";

import { db } from "../../db";
import { leases } from "../../db/schema/leases";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { tourRequests } from "../../db/schema/tours";
import { payments } from "../../db/schema/payments";
import { eq, desc, ilike } from "drizzle-orm"; // NEW: imported ilike
import { currentUser } from "@clerk/nextjs/server";

export async function getTenantDashboardData() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    // 1. Get the current user's DB profile
    const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    const tenantUser = existingUsers[0];
    
    if (!tenantUser) return null;

    // Get a guaranteed email string to check against (ignoring case)
    const userEmail = tenantUser.email || clerkUser.emailAddresses[0]?.emailAddress || "";

    // 2. Fetch Active Lease (if they have one)
    const activeLeases = await db
      .select({
        id: leases.id,
        rentAmount: leases.rentAmount,
        startDate: leases.startDate,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
        propertyImage: properties.imageUrl,
        landlordName: users.fullName,
        landlordEmail: users.email,
      })
      .from(leases)
      .innerJoin(properties, eq(leases.propertyId, properties.id))
      .innerJoin(users, eq(leases.landlordId, users.id))
      .where(eq(leases.tenantId, tenantUser.id));

    const currentLease = activeLeases.length > 0 ? activeLeases[0] : null;

    // 3. Fetch Payment History (if they have a lease)
    let myPayments = [];
    if (currentLease) {
      myPayments = await db
        .select()
        .from(payments)
        .where(eq(payments.leaseId, currentLease.id))
        .orderBy(desc(payments.paymentDate));
    }

    // 4. Fetch Tour Requests
    const myTours = await db
      .select({
        id: tourRequests.id,
        status: tourRequests.status,
        tourDate: tourRequests.tourDate,
        propertyTitle: properties.title,
        propertyLocation: properties.location,
      })
      .from(tourRequests)
      .innerJoin(properties, eq(tourRequests.propertyId, properties.id))
      // THE FIX: Use ilike for Case-Insensitive matching!
      .where(ilike(tourRequests.tenantEmail, userEmail)) 
      .orderBy(desc(tourRequests.createdAt));

    return {
      user: tenantUser,
      lease: currentLease,
      payments: myPayments,
      tours: myTours,
    };

  } catch (error) {
    console.error("Failed to fetch tenant data:", error);
    return null;
  }
}