"use server";

import { db } from "../../db";
import { properties } from "../../db/schema/properties";
import { users } from "../../db/schema/users";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { desc, eq, and, ilike, lte, or } from "drizzle-orm";

// --- 1. READ ACTION (For the Homepage with Search) ---
export async function getAvailableProperties(filters?: { query?: string; maxPrice?: number; category?: string }) {
  try {
    const baseCondition = eq(properties.isAvailable, true);
    let finalConditions = baseCondition;

    if (filters) {
      const { query, maxPrice, category } = filters;
      const queryConditions = [];

      if (query) {
        queryConditions.push(
          or(
            ilike(properties.title, `%${query}%`),
            ilike(properties.location, `%${query}%`)
          )
        );
      }

      if (maxPrice) {
        queryConditions.push(lte(properties.pricePerMonth, maxPrice));
      }

      if (category) {
        queryConditions.push(eq(properties.category, category));
      }

      if (queryConditions.length > 0) {
        finalConditions = and(baseCondition, ...queryConditions);
      }
    }

    const data = await db
      .select()
      .from(properties)
      .where(finalConditions) 
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

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id));
    
  let databaseUser = existingUsers[0];

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
  } else if (databaseUser.role !== "landlord") {
    await db.update(users)
      .set({ role: "landlord" })
      .where(eq(users.id, databaseUser.id));
      
    databaseUser.role = "landlord";
  }

  const title = formData.get("title") as string;
  const location = formData.get("location") as string;
  const price = parseInt(formData.get("pricePerMonth") as string);
  const description = formData.get("description") as string;
  
  // 🔥 NEW: Extract Category and SubType
  const category = formData.get("category") as string || "Residential";
  const subType = formData.get("subType") as string || "Apartment";
  
  const imageUrl = formData.get("imageUrl") as string;

  let galleryUrls: string[] = [];
  const galleryData = formData.getAll("gallery");
  
  if (galleryData.length > 0) {
    if (galleryData.length === 1 && typeof galleryData[0] === "string" && galleryData[0].startsWith("[")) {
      try {
        galleryUrls = JSON.parse(galleryData[0]);
      } catch (e) {
        galleryUrls = [galleryData[0]];
      }
    } else {
      galleryUrls = galleryData.map(val => val.toString());
    }
  }

  await db.insert(properties).values({
    landlordId: databaseUser.id, 
    title,
    category, // 🔥 Save Category
    subType,  // 🔥 Save SubType
    location,
    pricePerMonth: price,
    description,
    imageUrl, 
    gallery: galleryUrls,
  });

  revalidatePath("/mgmt/properties/new");
  revalidatePath("/mgmt/dashboard");
  revalidatePath("/"); 
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
  
  // 🔥 NEW: Extract Category and SubType for updates
  const category = formData.get("category") as string;
  const subType = formData.get("subType") as string;
  
  const imageUrl = formData.get("imageUrl") as string; 

  let galleryUrls: string[] = [];
  const galleryData = formData.getAll("gallery");
  
  if (galleryData.length > 0) {
    if (galleryData.length === 1 && typeof galleryData[0] === "string" && galleryData[0].startsWith("[")) {
      try {
        galleryUrls = JSON.parse(galleryData[0]);
      } catch (e) {
        galleryUrls = [galleryData[0]];
      }
    } else {
      galleryUrls = galleryData.map(val => val.toString());
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    title,
    location,
    pricePerMonth: price,
    description,
  };

  // 🔥 Safely append new fields to the update payload
  if (category) updateData.category = category;
  if (subType) updateData.subType = subType;
  if (imageUrl) updateData.imageUrl = imageUrl;
  if (galleryUrls.length > 0) updateData.gallery = galleryUrls;

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

// --- 7. TOGGLE STATUS ACTION (For the Availability Toggle) ---
export async function updatePropertyStatus(
  propertyId: string, 
  isAvailable: boolean 
) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id));
    
  const landlordId = existingUsers[0]?.id;
  if (!landlordId) throw new Error("User not found");

  await db.update(properties)
    .set({ isAvailable: isAvailable }) 
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.landlordId, landlordId)
      )
    );

  revalidatePath("/mgmt/dashboard");
  revalidatePath("/");
}