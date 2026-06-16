"use server";

import { db } from "../../db";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { desc, eq, and, ilike, lte, or } from "drizzle-orm";

// --- 1. READ ACTION (For the Homepage with Search) ---
export async function getAvailableProperties(filters?: { query?: string; maxPrice?: number }) {
  try {
    let conditions = undefined;

    // If the user passed search filters, build the SQL conditions
    if (filters) {
      const { query, maxPrice } = filters;
      const queryConditions = [];

      if (query) {
        // Search for the query in either the Title OR the Location
        queryConditions.push(
          or(
            ilike(properties.title, `%${query}%`),
            ilike(properties.location, `%${query}%`)
          )
        );
      }

      if (maxPrice) {
        // Find properties where the price is Less Than or Equal (lte) to the maxPrice
        queryConditions.push(lte(properties.pricePerMonth, maxPrice));
      }

      // Combine all conditions safely
      if (queryConditions.length > 0) {
        conditions = and(...queryConditions);
      }
    }

    const data = await db
      .select()
      .from(properties)
      .where(conditions) // If conditions is undefined, it just returns everything!
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
  const imageUrl = formData.get("imageUrl") as string; // Capture the image if a new one was uploaded

  // Build the update object dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    title,
    location,
    pricePerMonth: price,
    description,
  };

  // Only update the image column if a new image URL was successfully passed
  if (imageUrl) {
    updateData.imageUrl = imageUrl;
  }

  await db.update(properties)
    .set(updateData)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.landlordId, landlordId)
      )
    );

  revalidatePath("/mgmt/dashboard");
  revalidatePath("/");
}

// --- 6. READ SINGLE ACTION (For the Edit Page) ---
export async function getPropertyById(propertyId: string) {
  try {
    const data = await db
      .select()
      .from(properties)
      .where(eq(properties.id, propertyId));
    
    return data[0] || null;
  } catch (error) {
    console.error("Failed to fetch single property:", error);
    return null;
  }
}