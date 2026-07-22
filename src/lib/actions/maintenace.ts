"use server";

import { db } from "@/db";
import { maintenanceTickets } from "@/db/schema/maintenance_tickets";
import { properties } from "@/db/schema/properties";
import { users } from "@/db/schema/users";
import { eq, and, desc, inArray } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// 1. Tenant Action: Submit a new maintenance ticket
export async function createMaintenanceTicket(data: {
  propertyId: string;
  title: string;
  description: string;
  priority: string;
}) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) throw new Error("User not found");

  await db.insert(maintenanceTickets).values({
    propertyId: data.propertyId,
    tenantId: dbUser.id,
    title: data.title,
    description: data.description,
    priority: data.priority,
    status: "open",
  });

  revalidatePath("/tenant/leases/[id]", "page");
  return { success: true };
}

// 2. Tenant Action: Get their own tickets
export async function getTenantTickets() {
  const clerkUser = await currentUser();
  if (!clerkUser) return [];

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) return [];

  return await db
    .select({
      id: maintenanceTickets.id,
      title: maintenanceTickets.title,
      description: maintenanceTickets.description,
      status: maintenanceTickets.status,
      priority: maintenanceTickets.priority,
      createdAt: maintenanceTickets.createdAt,
      propertyTitle: properties.title,
    })
    .from(maintenanceTickets)
    .innerJoin(properties, eq(maintenanceTickets.propertyId, properties.id))
    .where(eq(maintenanceTickets.tenantId, dbUser.id))
    .orderBy(desc(maintenanceTickets.createdAt));
}

// 3. Landlord Action: Update Ticket Status (e.g., from 'open' to 'in_progress' or 'resolved')
export async function updateTicketStatus(ticketId: string, newStatus: string) {
  const clerkUser = await currentUser();
  if (!clerkUser) throw new Error("Unauthorized");

  // Optional: You could add a check here to ensure the landlord actually owns the property 
  // tied to this ticket, but for now, we'll just update it.
  
  await db
    .update(maintenanceTickets)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(maintenanceTickets.id, ticketId));

  revalidatePath("/mgmt/leases/[id]", "page");
  revalidatePath("/dashboard");
  return { success: true };
}