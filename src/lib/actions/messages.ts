"use server";

import { db } from "../../db";
import { tourMessages } from "../../db/schema/messages"; // Update path if you put the schema in tours.ts
import { users } from "../../db/schema/users";
import { currentUser } from "@clerk/nextjs/server";
import { eq, asc, and, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// --- 1. SEND A MESSAGE ---
export async function sendTourMessage(tourId: string, content: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  // Find the user in our database
  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) throw new Error("User not found in database");

  // Insert the message
  await db.insert(tourMessages).values({
    tourId,
    senderId: dbUser.id,
    content,
  });

  // Instantly refresh the dashboard page to show the new message bubble
  revalidatePath("/mgmt/dashboard");
}

// --- 2. FETCH CHAT HISTORY ---
export async function getTourMessages(tourId: string) {
  try {
    const messages = await db
      .select({
        id: tourMessages.id,
        content: tourMessages.content,
        createdAt: tourMessages.createdAt,
        senderId: tourMessages.senderId,
        senderName: users.fullName,
      })
      .from(tourMessages)
      .innerJoin(users, eq(tourMessages.senderId, users.id))
      .where(eq(tourMessages.tourId, tourId))
      .orderBy(asc(tourMessages.createdAt)); // Oldest at top, newest at bottom
      
    return messages;
  } catch (error) {
    console.error("Failed to fetch tour messages:", error);
    return [];
  }
}
// --- 3. GET UNREAD MESSAGE COUNT ---
export async function getUnreadCountForTour(tourId: string, currentUserId: string) {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(tourMessages)
      .where(
        and(
          eq(tourMessages.tourId, tourId),
          ne(tourMessages.senderId, currentUserId), // Only count messages sent by the OTHER person
          eq(tourMessages.isRead, false)
        )
      );
    return Number(result[0]?.count || 0);
  } catch (error) {
    console.error("Failed to get unread count:", error);
    return 0;
  }
}

// --- 4. MARK MESSAGES AS READ ---
export async function markTourMessagesAsRead(tourId: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) return;

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) return;

  await db.update(tourMessages)
    .set({ isRead: true })
    .where(
      and(
        eq(tourMessages.tourId, tourId),
        ne(tourMessages.senderId, dbUser.id) // Only mark the OTHER person's messages as read
      )
    );

  revalidatePath("/mgmt/dashboard");
  revalidatePath("/tours");
}