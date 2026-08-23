import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { properties } from "@/db/schema/properties";
import { leases } from "@/db/schema/leases";
import { maintenanceTickets } from "@/db/schema/maintenance_tickets";
import { eq, desc } from "drizzle-orm";
import TicketStatusDropdown from "@/components/TicketStatusDropdown";
import Link from "next/link";

export const dynamic = 'force-dynamic';

// Explicitly define the ticket type to satisfy TypeScript
type TicketItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: Date;
  propertyTitle: string;
  tenantName: string | null;
  leaseId: string;
};

export default async function LandlordMaintenanceHub() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) return null;

  // Fetch ALL tickets for properties where this user is the landlord on an active/past lease
  const allTickets = await db
    .select({
      id: maintenanceTickets.id,
      title: maintenanceTickets.title,
      description: maintenanceTickets.description,
      status: maintenanceTickets.status,
      priority: maintenanceTickets.priority,
      createdAt: maintenanceTickets.createdAt,
      propertyTitle: properties.title,
      tenantName: users.fullName,
      leaseId: leases.id,
    })
    .from(maintenanceTickets)
    .innerJoin(properties, eq(maintenanceTickets.propertyId, properties.id))
    .innerJoin(users, eq(maintenanceTickets.tenantId, users.id))
    .innerJoin(leases, eq(properties.id, leases.propertyId))
    .where(eq(leases.landlordId, dbUser.id))
    .orderBy(desc(maintenanceTickets.createdAt));

  // Remove duplicates and explicitly cast as TicketItem[]
  const uniqueTickets: TicketItem[] = Array.from(
    new Map(allTickets.map(item => [item.id, item])).values()
  );

  const openCount = uniqueTickets.filter(t => t.status === 'open').length;
  const inProgressCount = uniqueTickets.filter(t => t.status === 'in_progress').length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Maintenance Hub</h1>
        <p className="text-slate-500 mt-1">Manage repair requests across your entire portfolio.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl">
          <p className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-1">Needs Attention (Open)</p>
          <p className="text-3xl font-black text-amber-900">{openCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl">
          <p className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-3xl font-black text-blue-900">{inProgressCount}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-xl">
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Requests</p>
          <p className="text-3xl font-black text-slate-800">{uniqueTickets.length}</p>
        </div>
      </div>

      {/* Ticket Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">All Tickets</h2>
        </div>

        {uniqueTickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {uniqueTickets.map(ticket => (
              <div key={ticket.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-slate-800 text-lg">{ticket.title}</h3>
                      {ticket.priority === 'emergency' && (
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full">Emergency</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                      <span>🏠 {ticket.propertyTitle}</span>
                      <span>•</span>
                      <span>👤 {ticket.tenantName || "Resident"}</span>
                      <span>•</span>
                      <span>📅 {new Date(ticket.createdAt).toLocaleDateString('en-GB')}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-3 bg-white p-3 rounded-lg border border-slate-200">
                      {ticket.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    <TicketStatusDropdown ticketId={ticket.id} currentStatus={ticket.status} />
                    <Link href={`/mgmt/leases/${ticket.leaseId}`} className="text-xs font-bold text-blue-600 hover:text-blue-800">
                      View Lease &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-slate-500">
            <div className="text-4xl mb-3">🛠️</div>
            <p className="font-medium">No maintenance requests yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}