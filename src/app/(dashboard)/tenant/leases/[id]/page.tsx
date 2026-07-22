import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { properties } from "@/db/schema/properties";
import { users } from "@/db/schema/users";
import { maintenanceTickets } from "@/db/schema/maintenance_tickets"; // 🔥 Imported schema
import { eq, and, desc } from "drizzle-orm"; // 🔥 Added and, desc
import { currentUser } from "@clerk/nextjs/server";

// Tenant-Specific Action Components
import MpesaPaymentButton from "@/components/MpesaPaymentButton";
import MoveOutButton from "@/components/MoveOutButton";
import EarlyTerminationResponse from "@/components/EarlyTerminationResponse";
import MaintenanceRequestForm from "@/components/MaintenanceRequestForm";

export default async function TenantLeasePage({ params }: { params: { id: string } }) {
  const clerkUser = await currentUser();
  if (!clerkUser) return notFound();

  // 1. Fetch lease data
  const [lease] = await db
    .select({
      id: leases.id,
      tenantId: leases.tenantId,
      status: leases.status,
      startDate: leases.startDate,
      endDate: leases.endDate,
      leaseDuration: leases.leaseDuration,
      rentAmount: leases.rentAmount,
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .where(eq(leases.id, params.id));

  if (!lease) return notFound();

  // 2. Strict Tenant Authentication
  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser || dbUser.id !== lease.tenantId) {
    return <div className="p-10 text-center font-bold text-rose-600">Unauthorized access. This area is for the registered resident only.</div>;
  }

  // 🔥 3. Fetch Maintenance Ticket History
  const tickets = await db
    .select()
    .from(maintenanceTickets)
    .where(
      and(
        eq(maintenanceTickets.propertyId, lease.propertyId),
        eq(maintenanceTickets.tenantId, dbUser.id)
      )
    )
    .orderBy(desc(maintenanceTickets.createdAt));

  // 4. KPI Math Engine
  const today = new Date();
  const startDate = new Date(lease.startDate);
  const endDate = lease.endDate ? new Date(lease.endDate) : null;
  const monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
  const totalRentPaid = Math.max(0, monthsElapsed * lease.rentAmount);
  
  let nextPayment = new Date(today.getFullYear(), today.getMonth(), startDate.getDate());
  if (nextPayment < today) nextPayment.setMonth(nextPayment.getMonth() + 1);
  
  let daysRemaining: number | null = null;
  let renewalDeadline: Date | null = null;
  let leaseProgress = 0;

  if (endDate) {
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    leaseProgress = Math.max(0, Math.min(100, ((totalDays - daysRemaining) / totalDays) * 100));
    renewalDeadline = new Date(endDate);
    renewalDeadline.setDate(renewalDeadline.getDate() - 60);
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2 font-medium">
          &larr; Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lease.propertyTitle}</h1>
            <p className="text-slate-500">{lease.propertyLocation}</p>
          </div>
          <span className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border bg-emerald-50 text-emerald-700 border-emerald-200">
            {lease.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Financial Overview */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xl">💳</span> Financial Overview
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly Rent</p>
                <p className="font-black text-2xl text-slate-900">Ksh {lease.rentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Status</p>
                <p className="font-black text-2xl text-emerald-600">Cleared</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Next Payment Date</p>
                <p className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  📅 {nextPayment.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric'})}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Rent Paid To Date</p>
                <p className="font-bold text-lg text-slate-600">Ksh {totalRentPaid.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Contract & Lease Terms */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xl">📜</span> Contract & Lease Terms
            </h3>

            <div className={`mb-6 p-4 rounded-lg border ${endDate ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{endDate ? '📝' : '🤝'}</span>
                <div>
                  <h4 className={`font-bold text-lg ${endDate ? 'text-blue-900' : 'text-emerald-900'}`}>
                    {endDate ? 'Fixed-Term Lease Agreement' : 'Month-to-Month Agreement'}
                  </h4>
                  <p className={`text-sm mt-1 ${endDate ? 'text-blue-700' : 'text-emerald-700'}`}>
                    {endDate 
                      ? `You are currently on a fixed contract ending on ${endDate.toLocaleDateString('en-GB')}.` 
                      : 'You are on a flexible, open-ended agreement. Standard 30-day notice applies for vacating.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Lease Start</p>
                <p className="font-bold text-slate-800">{startDate.toLocaleDateString('en-GB')}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Duration</p>
                <p className="font-bold text-blue-700 bg-blue-50 inline-block px-2 py-0.5 rounded border border-blue-100">{lease.leaseDuration || "Month-to-Month"}</p>
              </div>
              
              {endDate && (
                <>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time Remaining</p>
                    <p className={`font-bold ${daysRemaining! < 60 ? "text-rose-600" : "text-emerald-600"}`}>
                      {daysRemaining! > 0 ? `${daysRemaining} Days` : "Expired"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Recommended Renewal</p>
                    <p className="font-bold text-slate-800">{renewalDeadline?.toLocaleDateString('en-GB')}</p>
                  </div>
                </>
              )}
            </div>

            {endDate && daysRemaining! > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>Lease Progress</span>
                  <span>{leaseProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-1000 ${daysRemaining! < 60 ? 'bg-amber-400' : 'bg-blue-500'}`} 
                    style={{ width: `${leaseProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Maintenance Request Section */}
          <div id="maintenance" className="scroll-mt-8 space-y-6">
            <MaintenanceRequestForm propertyId={lease.propertyId} />
            
            {/* 🔥 NEW: Ticket History Display */}
            {tickets.length > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="text-xl">📋</span> Request History
                </h3>
                <div className="space-y-4">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2 mb-2">
                        <div>
                          <h4 className="font-bold text-slate-800">{ticket.title}</h4>
                          <p className="text-xs font-medium text-slate-500 mt-0.5">
                            Submitted on {new Date(ticket.createdAt).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {ticket.priority === 'emergency' && <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-100 px-2 py-0.5 rounded-full">Emergency</span>}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap
                            ${ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 
                              ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 
                              'bg-amber-100 text-amber-700'}`}
                          >
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mt-2">{ticket.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          {lease.status === "early_termination_offered" && <EarlyTerminationResponse leaseId={lease.id} />}
          <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm sticky top-6">
            <h3 className="font-bold text-blue-900 mb-4 uppercase text-xs tracking-wider border-b border-blue-50 pb-2">Quick Actions</h3>
            <div className="space-y-3">
              <MpesaPaymentButton leaseId={lease.id} amount={lease.rentAmount} propertyTitle={lease.propertyTitle} />
              {lease.status === "active" && <MoveOutButton leaseId={lease.id} />}
              
              <a 
                href="#maintenance" 
                className="w-full py-3 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-bold transition-colors flex justify-center items-center gap-2"
              >
                🔧 Request Maintenance
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}