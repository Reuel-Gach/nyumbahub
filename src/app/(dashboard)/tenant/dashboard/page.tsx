import React from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { tourRequests } from "@/db/schema/tours";
import { properties } from "@/db/schema/properties";
import { eq, desc } from "drizzle-orm";
import TourChatButton from "@/components/TourChatButton";

export const dynamic = 'force-dynamic';

export default async function TenantDashboardPage() {
  // 1. Securely identify the user
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Please log in to view your dashboard.
      </div>
    );
  }

  // 2. Find their Database ID
  const [dbUser] = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
  
  if (!dbUser) {
    return (
      <div className="p-8 text-center text-slate-500">
        Setting up your account profile... please refresh.
      </div>
    );
  }

  // 3. Fetch all their Tour Requests (joined with property details)
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
        
        {/* Bridge to Landlord Mode */}
        <Link
          href="/mgmt/properties/new"
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
          Own a property? List it here
        </Link>
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
                
                {/* Left Side: Property & Date Info */}
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{tour.propertyTitle}</h3>
                  <p className="text-sm text-slate-500 mt-1">📍 {tour.propertyLocation}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                      Date: <span className="font-bold">{new Date(tour.tourDate).toLocaleDateString('en-GB')}</span>
                    </p>
                    
                    {/* NEW: Our fully encapsulated Chat Button! */}
                    <TourChatButton 
                      tour={tour} 
                      currentUserId={dbUser.id} 
                    />
                  </div>
                </div>
                
                {/* Right Side: Status Badge */}
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