import React from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { eq, and, inArray } from "drizzle-orm";

import EvictionModal from "../../../../components/EvictionModal";
import { db } from "../../../../db"; 
import { users } from "../../../../db/schema/users";
import { leases } from "../../../../db/schema/leases"; 
import { properties } from "../../../../db/schema/properties"; 
import { getLandlordProperties } from "../../../../lib/actions/properties";
import { getTenantDashboardData } from "../../../../lib/actions/tenant"; 
import PropertyActions from "../../../../components/PropertyActions";
import StatusDropdown from "../../../../components/StatusDropdown";
import TenantDashboardView from "../../../../components/TenantDashboardView"; 

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // 1. Sync User with DB safely
  let existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  let dbUser = existingUsers[0];

  if (!dbUser) {
    const email = clerkUser.emailAddresses[0]?.emailAddress || `no-email-${Date.now()}@placeholder.com`;
    const fullName = clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : "Resident";
    
    const newlyInserted = await db.insert(users).values({
      clerkId: clerkUser.id,
      email: email,
      fullName: fullName,
      role: "tenant"
    }).returning();
    
    dbUser = newlyInserted[0];
  }

  // 2. Fetch properties early for our "Self-Healing" check
  const myProperties = await getLandlordProperties();

  // 3. AUTO-UPGRADE (Self-Healing)
  if (myProperties.length > 0 && dbUser.role !== "landlord") {
    await db.update(users).set({ role: "landlord" }).where(eq(users.id, dbUser.id));
    dbUser.role = "landlord";
  }

  // 4. ROLE-BASED REDIRECT
  if (dbUser.role !== "landlord") {
    const tenantData = await getTenantDashboardData();
    return <TenantDashboardView tenantData={tenantData} />;
  }

  // ==========================================
  // 5. LANDLORD VIEW 
  // ==========================================
  
  const activeTenants = await db
    .select({
      id: leases.id,
      status: leases.status,
      rentAmount: leases.rentAmount,
      propertyTitle: properties.title,
      tenantName: users.fullName,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .where(
      and(
        eq(leases.landlordId, dbUser.id),
        inArray(leases.status, ["active", "move_out_pending", "eviction_notice"])
      )
    );
  
  const totalUnits = myProperties.length;
  const activeUnits = myProperties.filter(p => p.isAvailable).length;
  const offMarketUnits = totalUnits - activeUnits;
  const potentialRevenue = myProperties.reduce((sum, p) => sum + (p.pricePerMonth || 0), 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Landlord Analytics</h1>
          <p className="text-slate-500 mt-1">Overview of your portfolio performance.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/mgmt/finances" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2.5 rounded-lg font-bold text-sm border border-emerald-200 transition-colors shadow-sm flex items-center gap-2">
            💳 Finances
          </Link>
          <Link href="/mgmt/tours" className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold text-sm border border-slate-200 transition-colors shadow-sm flex items-center gap-2">
            📅 Tours
          </Link>
          <Link href="/mgmt/properties/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm flex items-center gap-2">
            ➕ New Listing
          </Link>
        </div>
      </div>

      {/* Analytics Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Potential Revenue</span>
          <p className="text-3xl font-black text-blue-600">Ksh {potentialRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Units</span>
          <p className="text-3xl font-black text-slate-800">{totalUnits}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-1">Active / Listed</span>
          <p className="text-3xl font-black text-slate-800">{activeUnits}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-amber-400"></div>
          <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-1">Off-Market</span>
          <p className="text-3xl font-black text-slate-800">{offMarketUnits}</p>
        </div>
      </div>

      {/* Tenant & Lease Management Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-rose-50 border-b border-rose-100 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-rose-900">👥 Active Tenants & Leases</h2>
        </div>
        
        {activeTenants.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activeTenants.map((lease) => (
              <div key={lease.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                
                {/* Wrapped Tenant/Property info in Link to Detailed Lease Page */}
                <Link href={`/mgmt/leases/${lease.id}`} className="flex-grow group">
                  <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {lease.tenantName || "Unknown Tenant"}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">🏠 {lease.propertyTitle}</p>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    Rent: Ksh {lease.rentAmount.toLocaleString()} / mo
                  </p>
                </Link>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {/* Status Indicator */}
                  {lease.status === "move_out_pending" && (
                     <span className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold uppercase tracking-wide">
                       Requested Move-Out
                     </span>
                  )}
                  {lease.status === "eviction_notice" && (
                     <span className="px-3 py-1.5 bg-rose-100 text-rose-800 rounded-lg text-xs font-bold uppercase tracking-wide">
                       Eviction Pending
                     </span>
                  )}
                  
                  {/* The Eviction / Finalize Modal */}
                  <EvictionModal 
                    leaseId={lease.id} 
                    tenantName={lease.tenantName || "Tenant"} 
                    currentStatus={lease.status} 
                  />
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <p className="text-slate-500 font-medium">You currently have no active tenants.</p>
          </div>
        )}
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Manage Properties</h2>
        </div>
        
        {myProperties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myProperties.map((p) => (
              <div key={p.id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex-grow flex items-center gap-4">
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.title} className="w-16 h-16 rounded-lg object-cover border border-slate-200 hidden sm:block" />
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{p.title}</h3>
                      <StatusDropdown propertyId={p.id} isAvailable={p.isAvailable} />
                    </div>
                    <p className="text-sm text-slate-500">📍 {p.location}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
                  <div className="text-left sm:text-right">
                    <span className="block text-lg font-black text-slate-800">Ksh {p.pricePerMonth.toLocaleString()}</span>
                    <span className="block text-xs text-slate-500 font-medium">per month</span>
                  </div>
                  <PropertyActions propertyId={p.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No properties listed yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">Start earning by listing your first unit.</p>
            <Link href="/mgmt/properties/new" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors">
              List a Property
            </Link>
          </div>
        )}
      </div>
      
    </div>
  );
}