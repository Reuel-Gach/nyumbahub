import React from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { tourRequests } from "@/db/schema/tours";
import { properties } from "@/db/schema/properties";
import { leases } from "@/db/schema/leases"; // <-- NEW IMPORT
import { eq, desc, and } from "drizzle-orm";
import TourChatButton from "@/components/TourChatButton";
import MpesaPaymentButton from "@/components/MpesaPaymentButton"; // <-- NEW IMPORT

export const dynamic = 'force-dynamic';

export default async function TenantDashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return <div className="p-8 text-center text-slate-500">Please log in to view your dashboard.</div>;
  }

  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  if (!dbUser) {
    return <div className="p-8 text-center text-slate-500">Setting up your account profile... please refresh.</div>;
  }

  // 1. Fetch Tour Requests
  const myTours = await db
    .select({
      id: tourRequests.id,
      tourDate: tourRequests.tourDate,
      status: tourRequests.status,
      message: tourRequests.message,
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
    })
    .from(tourRequests)
    .innerJoin(properties, eq(tourRequests.propertyId, properties.id))
    .where(eq(tourRequests.tenantId, dbUser.id))
    .orderBy(desc(tourRequests.createdAt));

  // 2. NEW: Fetch Active Leases for Rent Payment
  const myLeases = await db
    .select({
      id: leases.id,
      status: leases.status,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      rentAmount: properties.pricePerMonth, // Assuming rent is tied to property price
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .where(
      and(
        eq(leases.tenantId, dbUser.id),
        eq(leases.status, "active") // Only show payments for active leases
      )
    );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome, {dbUser.fullName?.split(" ")[0] || "Resident"}!
          </h1>
          <p className="text-slate-500 mt-1">Manage your home, rent payments, and tour requests.</p>
        </div>
        
        <Link href="/mgmt/properties/new" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Own a property? List it here
        </Link>
      </div>

      {/* NEW SECTION: ACTIVE LEASES & RENT PAYMENTS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-900">🏡 My Home & Rent</h2>
        </div>
        
        {myLeases.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myLeases.map((lease) => (
              <div key={lease.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">{lease.propertyTitle}</h3>
                  <p className="text-sm text-slate-500 mt-1">📍 {lease.propertyLocation}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    Monthly Rent: <span className="font-bold text-slate-900">Ksh {lease.rentAmount.toLocaleString()}</span>
                  </p>
                </div>
                
                <div className="w-full sm:w-auto mt-4 sm:mt-0">
                  <MpesaPaymentButton 
                    leaseId={lease.id} 
                    amount={lease.rentAmount} 
                    propertyTitle={lease.propertyTitle} 
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-slate-500 font-medium">You do not have any active leases yet.</p>
          </div>
        )}
      </div>

      {/* MY TOUR REQUESTS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">📅 My Tour Requests</h2>
        </div>
        
        {myTours.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myTours.map((tour) => (
              <div key={tour.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{tour.propertyTitle}</h3>
                  <p className="text-sm text-slate-500 mt-1">📍 {tour.propertyLocation}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                      Date: <span className="font-bold">{new Date(tour.tourDate).toLocaleDateString('en-GB')}</span>
                    </p>
                    <TourChatButton tour={tour} currentUserId={dbUser.id} />
                  </div>
                </div>
                
                <div className="w-full sm:w-auto text-left sm:text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                  <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide
                    ${tour.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                      tour.status === 'declined' ? 'bg-red-100 text-red-800' : 
                      tour.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                      'bg-amber-100 text-amber-800'}`}
                  >
                    {tour.status}
                  </span>
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <div className="text-4xl mb-3">🗝️</div>
            <p className="text-slate-500 font-medium mb-4">You haven't requested any property tours yet.</p>
            <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors">
              Browse Available Properties
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}