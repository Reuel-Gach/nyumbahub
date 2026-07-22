import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { properties } from "@/db/schema/properties";
import { users } from "@/db/schema/users";
import { eq, and, sql } from "drizzle-orm"; // 🔥 Added sql and and
import { currentUser } from "@clerk/nextjs/server";
import EvictionModal from "@/components/EvictionModal";

export default async function LandlordLeasePage({ params }: { params: { id: string } }) {
  const clerkUser = await currentUser();
  if (!clerkUser) return notFound();

  // 1. Fetch the specific lease
  const result = await db
    .select({
      id: leases.id,
      landlordId: leases.landlordId,
      status: leases.status,
      startDate: leases.startDate,
      endDate: leases.endDate,
      leaseDuration: leases.leaseDuration,
      rentAmount: leases.rentAmount,
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      tenantName: users.fullName,
      tenantEmail: users.email,
      // 🔥 In the future, add: purchasePrice: properties.purchasePrice
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .where(eq(leases.id, params.id))
    .limit(1);

  const lease = result[0];
  if (!lease) return notFound();

  // 2. Strict Landlord Authentication
  const loggedInUser = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1);
  if (loggedInUser[0]?.id !== lease.landlordId) {
    return <div className="p-10 text-center font-bold text-rose-600">Unauthorized access. This area is for the property owner only.</div>;
  }

  // ==========================================
  // 🔥 PRODUCTION ANALYTICS ENGINE
  // ==========================================
  
  const today = new Date();
  const startDate = new Date(lease.startDate);
  const endDate = lease.endDate ? new Date(lease.endDate) : null;
  const monthsElapsed = (today.getFullYear() - startDate.getFullYear()) * 12 + (today.getMonth() - startDate.getMonth());
  const totalRentPaid = Math.max(0, monthsElapsed * lease.rentAmount);
  
  // 3A. Dynamic Market Average (Querying your DB for comps in the same location)
  const marketData = await db
    .select({ 
      avgRent: sql<number>`CAST(AVG(${properties.pricePerMonth}) AS INT)` 
    })
    .from(properties)
    .where(eq(properties.location, lease.propertyLocation));
  
  // Use the DB average, fallback to the lease rent if it's the only property in that location
  const localMarketAverage = marketData[0]?.avgRent || lease.rentAmount; 
  const rentPremiumPercent = localMarketAverage > 0 
    ? ((lease.rentAmount - localMarketAverage) / localMarketAverage) * 100 
    : 0;

  // 3B. Valuation & Return Metrics
  // TODO: Replace with lease.purchasePrice once added to the database schema
  const estimatedValue = lease.rentAmount * 12 * 12; // Temporary 12x GRM fallback
  
  // TODO: Replace 0.85 (15% OpEx) by summing up actual maintenance costs from a future Expenses table
  const annualNOI = lease.rentAmount * 12 * 0.85; 
  
  const capRate = estimatedValue > 0 ? (annualNOI / estimatedValue) * 100 : 0;
  
  // TODO: Replace with actual mortgage down payment data from the DB
  const downPayment = estimatedValue * 0.20; 
  const cashOnCash = downPayment > 0 ? (annualNOI / downPayment) * 100 : 0; 

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <Link href="/mgmt/dashboard" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2 font-medium">
          &larr; Back to Landlord Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{lease.propertyTitle}</h1>
            <p className="text-slate-500 flex items-center gap-1 mt-1">📍 {lease.propertyLocation}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase border inline-block
            ${lease.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}
          >
            {lease.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN INFO COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Financial Performance */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">📈</span> Unit Financial Performance
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">Monthly Gross</p>
                  <p className="text-2xl font-black text-emerald-900">Ksh {lease.rentAmount.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Est. Annual NOI</p>
                  <p className="text-2xl font-black text-slate-800">Ksh {annualNOI.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Collected To Date</p>
                  <p className="text-2xl font-black text-slate-800">Ksh {totalRentPaid.toLocaleString()}</p>
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2 mb-4">Investment Metrics</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">Cap Rate</p>
                  <p className="font-bold text-xl text-slate-900">{capRate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">Cash on Cash</p>
                  <p className="font-bold text-xl text-slate-900">{cashOnCash.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-0.5">Market Premium</p>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold text-xl ${rentPremiumPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {rentPremiumPercent > 0 ? '+' : ''}{rentPremiumPercent.toFixed(1)}%
                    </p>
                    {rentPremiumPercent >= 0 ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">ABOVE AVG</span>
                    ) : (
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">BELOW AVG</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Area Avg: Ksh {localMarketAverage.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Maintenance Tickets (Mocked for now) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="text-lg">🔧</span> Open Maintenance Tickets
              </h3>
            </div>
            <div className="p-10 text-center text-slate-500">
              No active maintenance requests for this unit.
            </div>
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-700 pb-2 flex items-center gap-2">
              Active Contract
            </h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Tenant</span>
                <span className="font-bold">{lease.tenantName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Duration</span>
                <span className="font-bold">{lease.leaseDuration || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Expiry</span>
                <span className="font-bold text-emerald-400">{endDate ? endDate.toLocaleDateString('en-GB') : "Month-to-Month"}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider border-b border-slate-100 pb-2">Management Tools</h3>
            <div className="space-y-3 flex flex-col">
              <button className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-sm font-bold transition-colors border border-slate-200 flex justify-between items-center">
                Log Rent Payment <span className="text-slate-400">&rarr;</span>
              </button>
              <button className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-bold transition-colors border border-blue-200 flex justify-between items-center">
                Offer Early Termination <span className="text-blue-400">&rarr;</span>
              </button>
              <div className="mt-2 w-full">
                <EvictionModal leaseId={lease.id} tenantName={lease.tenantName || "Tenant"} currentStatus={lease.status} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}