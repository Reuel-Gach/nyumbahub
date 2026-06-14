"use server";

import { db } from "../../db";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { desc, eq, and } from "drizzle-orm";

// --- 1. READ ACTION (For the Homepage) ---
export async function getAvailableProperties() {
  try {
    const data = await db
      .select()
      .from(properties)
      .orderBy(desc(properties.createdAt));
    
    return data;
  } catch (error) {
    console.error("Database connection error:", error);
    return [];
  }
}

// --- 2. WRITE ACTION (For the Form) ---
export async function createProperty(formData: FormData) {
  const clerkUser = await currentUser();
  
  if (!clerkUser) {
    throw new Error("Unauthorized: You must be logged in to post a property.");
  }

  // Step 1: Check if this Clerk user already exists in our Neon database
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id));
    
  let databaseUser = existingUsers[0];

  // Step 2: If they don't exist in Neon yet, sync them over!
  if (!databaseUser) {
    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || "no-email@provided.com";
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    const insertedUsers = await db.insert(users).values({
      clerkId: clerkUser.id,
      email: primaryEmail,
      fullName: fullName !== "" ? fullName : "Unknown Landlord",
      role: "landlord",
    }).returning(); 

    if (!insertedUsers || insertedUsers.length === 0) {
      throw new Error("CRITICAL: Failed to generate user in Neon Database.");
    }

    databaseUser = insertedUsers[0]; 
  }

  // Step 3: Extract data from the form
  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const price = parseInt(formData.get("pricePerMonth") as string);
  const description = formData.get("description") as string;
  const imageUrl = formData.get("imageUrl") as string;

  // Step 4: Insert the property using the guaranteed Neon database UUID
  await db.insert(properties).values({
    landlordId: databaseUser.id, 
    title,
    location,
    pricePerMonth: price,
    description,
    imageUrl, 
  });

  // Step 5: Bust the cache for the new form, dashboard, and the root homepage!
  revalidatePath("/mgmt/properties/new");
  revalidatePath("/mgmt/dashboard");
  revalidatePath("/"); // Force re-render for localhost:3000 immediately
}

// --- 3. READ ACTION (For the Landlord Dashboard) ---
export async function getLandlordProperties() {
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
      .select()
      .from(properties)
      .where(eq(properties.landlordId, landlordId))
      .orderBy(desc(properties.createdAt));
    
    return data;
  } catch (error) {
    console.error("Failed to fetch landlord properties:", error);
    return [];
  }
}

// --- 4. DELETE ACTION ---
export async function deleteProperty(propertyId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id));
    
  const landlordId = existingUsers[0]?.id;
  if (!landlordId) throw new Error("User not found");

  await db.delete(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.landlordId, landlordId)
      )
    );

  // Refresh both layouts securely
  revalidatePath("/mgmt/dashboard");
  revalidatePath("/");
}

// --- 5. UPDATE ACTION ---
export async function updateProperty(
  propertyId: string, 
  formData: FormData
) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id));
    
  const landlordId = existingUsers[0]?.id;
  if (!landlordId) throw new Error("User not found");

  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const price = parseInt(formData.get("pricePerMonth") as string);
  const description = formData.get("description") as string;

  await db.update(properties)
    .set({
      title,
      location,
      pricePerMonth: price,
      description,
    })
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.landlordId, landlordId)
      )
    );

  revalidatePath("/mgmt/dashboard");
  revalidatePath("/");
}