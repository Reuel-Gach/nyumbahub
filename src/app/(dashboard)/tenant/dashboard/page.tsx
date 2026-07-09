import React from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { tourRequests } from "@/db/schema/tours";
import { properties } from "@/db/schema/properties";
import { leases } from "@/db/schema/leases";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import TourChatButton from "@/components/TourChatButton";

export const dynamic = 'force-dynamic';

export default async function TenantDashboardPage() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return <div className="p-8 text-center text-slate-500">Please log in to view your dashboard.</div>;
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

  const searchConditions = [
    eq(users.clerkId, clerkUser.id),
    eq(users.clerkId, `pending_${clerkUser.id}`)
  ];
  if (primaryEmail) {
    searchConditions.push(eq(users.email, primaryEmail));
  }

  let [dbUser] = await db.select().from(users).where(or(...searchConditions));

  if (dbUser && dbUser.clerkId !== clerkUser.id) {
    const [updatedUser] = await db.update(users)
      .set({ clerkId: clerkUser.id })
      .where(eq(users.id, dbUser.id))
      .returning();
    dbUser = updatedUser;
  }

  if (!dbUser) {
    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Resident";
    const [newUser] = await db.insert(users).values({
      clerkId: clerkUser.id,
      email: primaryEmail || "no-email@clerk.com",
      fullName: name,
      role: "tenant", 
    }).returning();
    dbUser = newUser;
  }

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

  const myLeases = await db
    .select({
      id: leases.id,
      status: leases.status,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      rentAmount: properties.pricePerMonth,
      terminationReason: leases.terminationReason,
      moveOutDate: leases.moveOutDate,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .where(
      and(
        eq(leases.tenantId, dbUser.id),
        inArray(leases.status, ["active", "move_out_pending", "eviction_notice", "early_termination_offered"]) 
      )
    );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
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

      {/* ACTIVE LEASES & RENT PAYMENTS */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-emerald-900">🏡 My Home & Rent</h2>
        </div>
        
        {myLeases.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myLeases.map((lease) => (
              <div key={lease.id} className="p-6 hover:bg-slate-50 transition-colors">
                
                {/* Top Row: Details & Status */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  
                  {/* 🔥 UPDATED LINK WRAPPER */}
                  <Link href={`/tenant/leases/${lease.id}`} className="block group flex-grow">
                    <h3 className="font-bold text-slate-800 text-xl group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      {lease.propertyTitle}
                      <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        Manage & Pay &rarr;
                      </span>
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">📍 {lease.propertyLocation}</p>
                    <p className="mt-2 text-sm font-medium text-slate-600">
                      Monthly Rent: <span className="font-bold text-slate-900">Ksh {lease.rentAmount.toLocaleString()}</span>
                    </p>
                  </Link>
                  
                  <div className="w-full sm:w-auto mt-4 sm:mt-0 flex flex-col sm:flex-row items-center gap-3">
                    {/* Visual Status Indicators ONLY */}
                    {lease.status === "active" ? (
                      <span className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-bold flex items-center gap-2">
                        Active Tenancy
                      </span>
                    ) : lease.status === "early_termination_offered" ? (
                      <span className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold flex items-center gap-2">
                        Offer Pending
                      </span>
                    ) : lease.status === "move_out_pending" ? (
                      <span className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold flex items-center gap-2">
                        Move-Out Pending
                      </span>
                    ) : lease.status === "eviction_notice" ? (
                      <span className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-sm font-bold flex items-center gap-2">
                        ⚠️ Notice to Vacate
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Legal / Warning Banners (Read-only on this page) */}
                {lease.status === "eviction_notice" && (
                  <div className="mt-5 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 w-full">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">⚠️</span>
                      <div>
                        <h4 className="font-bold text-base">Legal Notice to Vacate</h4>
                        <p className="text-sm mt-1">Your landlord has issued a 30-day notice to terminate your tenancy.</p>
                        <div className="mt-3 bg-white/60 p-3 rounded-lg border border-rose-100">
                          <p className="text-sm"><strong>Reason:</strong> {lease.terminationReason || "No reason provided."}</p>
                          <p className="text-sm mt-1 text-rose-900">
                            <strong>Move-out Deadline:</strong> {lease.moveOutDate ? new Date(lease.moveOutDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Pending"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {lease.status === "move_out_pending" && lease.moveOutDate && (
                  <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 w-full">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📅</span>
                      <div>
                        <h4 className="font-bold text-sm">Move-Out Scheduled</h4>
                        <p className="text-sm mt-0.5">Your tenancy is scheduled to end on <strong>{new Date(lease.moveOutDate).toLocaleDateString('en-GB')}</strong>.</p>
                      </div>
                    </div>
                  </div>
                )}

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