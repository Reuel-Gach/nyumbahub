"use server";

import { db } from "../../db";
import { users } from "../../db/schema/users";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

export async function getUserRole() {
  const clerkUser = await currentUser();
  
  // If they aren't logged in at all, they are a guest
  if (!clerkUser) return "guest"; 

  try {
    const existingUser = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.clerkId, clerkUser.id))
      .limit(1);

    return existingUser[0]?.role || "tenant";
  } catch (error) {
    console.error("Failed to fetch user role:", error);
    return "tenant"; 
  }
}