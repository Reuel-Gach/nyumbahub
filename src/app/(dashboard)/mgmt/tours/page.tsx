import React from "react";
import Link from "next/link";
import { getLandlordTours } from "@/lib/actions/tours";
import TourActionButtons from "@/components/TourActionButtons";
import TourChatButton from "@/components/TourChatButton"; // NEW IMPORTS
import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export default async function ToursPage() {
  const tours = await getLandlordTours();

  // 1. Fetch the Landlord's Database ID for the Chat Modal
  const clerkUser = await currentUser();
  let currentUserId = "";
  
  if (clerkUser) {
    const existingUsers = await db.select().from(users).where(eq(users.clerkId, clerkUser.id));
    if (existingUsers.length > 0) {
      currentUserId = existingUsers[0].id;
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <Link href="/mgmt/dashboard" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-1 mb-2">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">Tour Requests</h1>
        <p className="text-slate-500">Manage all your upcoming property viewing requests.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {tours.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tours.map((tour) => (
              <div key={tour.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                
                {/* Left Side: Tour Details */}
                <div className="w-full sm:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-slate-800">{tour.tenantName}</h3>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full font-semibold">
                      {tour.propertyTitle}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                    <p>📧 {tour.tenantEmail}</p>
                    <p>📞 {tour.tenantPhone}</p>
                    <p>📅 Date: {new Date(tour.tourDate).toLocaleDateString()}</p>
                  </div>
                  {tour.message && (
                    <p className="mt-3 text-sm italic text-slate-500 border-l-2 border-slate-200 pl-3">
                      "{tour.message}"
                    </p>
                  )}
                </div>
                
                {/* Right Side: Actions (Accept/Decline + Chat) */}
                <div className="flex-shrink-0 flex flex-col items-end gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Status Buttons */}
                  <TourActionButtons 
                    tourId={tour.id} 
                    currentStatus={tour.status} 
                    propertyId={tour.propertyId}
                    tenantName={tour.tenantName}
                    tenantEmail={tour.tenantEmail}
                    rentAmount={tour.pricePerMonth || 0}
                  />

                  {/* NEW: The Chat Button */}
                  <TourChatButton 
                    tour={tour} 
                    currentUserId={currentUserId} 
                  />

                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-slate-500">No tour requests found yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}