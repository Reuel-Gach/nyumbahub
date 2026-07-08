"use server";

import { db } from "../../db";
import { tourRequests } from "../../db/schema/tours";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export async function submitTourRequest(formData: FormData) {
  try {
    const propertyId = formData.get("propertyId") as string;
    const landlordId = formData.get("landlordId") as string;
    
    const tenantName = formData.get("tenantName") as string;
    const tenantEmail = formData.get("tenantEmail") as string;
    const tenantPhone = formData.get("tenantPhone") as string;
    const message = formData.get("message") as string;
    const tourDateString = formData.get("tourDate") as string;

    if (!propertyId || !landlordId || !tenantName || !tenantEmail || !tenantPhone || !tourDateString) {
      throw new Error("Missing required fields");
    }

    const tourDate = new Date(tourDateString);

    // WE MUST IDENTIFY THE TENANT AND SAVE THEIR ID
    let tenantId = null;
    const clerkUser = await currentUser();

    if (clerkUser) {
      // 1. Try to find the tenant by their Clerk ID
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkUser.id));
      
      if (existingUser) {
        tenantId = existingUser.id;
      }
    }

    // 2. Fallback: If they aren't logged in, or their DB account doesn't exist yet, 
    // let's match them by the email they typed in the form
    if (!tenantId) {
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, tenantEmail));

      if (existingByEmail) {
        tenantId = existingByEmail.id;
      } else {
        // Create a basic tenant profile for them so their dashboard works later
        const [newUser] = await db.insert(users).values({
          clerkId: clerkUser ? clerkUser.id : `pending_${Date.now()}`,
          email: tenantEmail,
          fullName: tenantName,
          role: "tenant",
        }).returning();
        
        tenantId = newUser.id;
      }
    }

    // Insert the tour WITH the tenantId
    await db.insert(tourRequests).values({
      propertyId,
      landlordId,
      tenantId, 
      tenantName,
      tenantEmail,
      tenantPhone,
      message,
      tourDate,
      status: "pending", 
    });

    revalidatePath("/mgmt/dashboard");
    revalidatePath("/dashboard"); // Ensure tenant dashboard updates
    revalidatePath("/");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to submit tour request:", error);
    throw new Error("Failed to submit request to database.");
  }
}

// --- READ ACTION (For the Dashboard) ---
export async function getLandlordTours() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return [];

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkUser.id));
      
    const landlordId = existingUsers[0]?.id;
    if (!landlordId) return [];

    const data = await db
      .select({
        id: tourRequests.id,
        propertyId: tourRequests.propertyId, 
        tenantName: tourRequests.tenantName,
        tenantEmail: tourRequests.tenantEmail,
        tenantPhone: tourRequests.tenantPhone,
        tourDate: tourRequests.tourDate,
        message: tourRequests.message,
        status: tourRequests.status,
        propertyTitle: properties.title,
        pricePerMonth: properties.pricePerMonth, 
        category: properties.category, // 🔥 NEW: Fetches the category for dynamic lease periods!
      })
      .from(tourRequests)
      .leftJoin(properties, eq(tourRequests.propertyId, properties.id))
      .where(eq(tourRequests.landlordId, landlordId))
      .orderBy(desc(tourRequests.createdAt));
    
    return data;
  } catch (error) {
    console.error("Failed to fetch landlord tours:", error);
    return [];
  }
}

// --- UPDATE ACTION (Approve/Decline) ---
export async function updateTourStatus(tourId: string, newStatus: "approved" | "declined" | "completed") {
  try {
    await db.update(tourRequests)
      .set({ status: newStatus })
      .where(eq(tourRequests.id, tourId));

    revalidatePath("/mgmt/dashboard");
    revalidatePath("/mgmt/tours"); 
    revalidatePath("/dashboard"); // Also refresh the tenant's view
  } catch (error) {
    console.error("Failed to update tour status:", error);
    throw new Error("Failed to update status");
  }
}