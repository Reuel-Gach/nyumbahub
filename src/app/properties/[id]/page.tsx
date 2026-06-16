import React from "react";
import Link from "next/link";
import { db } from "@/db";
import { properties } from "@/db/schema/properties";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import TourBookingForm from "@/components/TourBookingForm"; // <-- NEW: Import the booking widget

export default async function PropertyDetailsPage({ params }: { params: { id: string } }) {
  // Fetch Property AND Landlord details in a single optimized query
  const result = await db
    .select({
      id: properties.id,
      title: properties.title,
      description: properties.description,
      pricePerMonth: properties.pricePerMonth,
      location: properties.location,
      isAvailable: properties.isAvailable,
      createdAt: properties.createdAt,
      imageUrl: properties.imageUrl,     // <-- NEW: Fetch the image
      landlordId: properties.landlordId, // <-- NEW: Fetch the landlord ID for the form
      landlordName: users.fullName,
      landlordEmail: users.email,
    })
    .from(properties)
    .leftJoin(users, eq(properties.landlordId, users.id))
    .where(eq(properties.id, params.id))
    .limit(1);

  const property = result[0];

  // 404 Guard
  if (!property) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-red-200 max-w-md w-full">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Property Not Found</h1>
          <p className="text-slate-600 mb-4">The listing you are looking for does not exist or has been removed.</p>
          <Link href="/" className="text-blue-600 hover:underline font-medium">Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Back Navigation */}
        <Link href="/" className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-6 transition-colors">
          <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back to Listings
        </Link>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* NEW: Dynamic Image Rendering */}
            <div className="w-full h-72 md:h-96 bg-slate-200 rounded-2xl border border-slate-300 flex items-center justify-center overflow-hidden relative">
              {property.imageUrl ? (
                <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-extrabold text-slate-900">{property.title}</h1>
                {property.isAvailable ? (
                  <span className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">Available Now</span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-sm font-bold px-3 py-1 rounded-full whitespace-nowrap">Off-Market</span>
                )}
              </div>
              
              <div className="flex items-center text-slate-500 mb-6">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="text-lg">{property.location}</span>
              </div>

              <hr className="border-slate-100 mb-6" />

              <h2 className="text-xl font-bold text-slate-800 mb-3">Description</h2>
              <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                {property.description || "No description provided."}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            
            {/* Pricing & Landlord Card */}
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200 sticky top-24">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Rent</p>
              <div className="flex items-end text-blue-600 mb-6">
                <span className="text-4xl font-extrabold tracking-tight">Ksh {property.pricePerMonth.toLocaleString()}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Listed By</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg uppercase">
                    {property.landlordName ? property.landlordName.charAt(0) : "?"}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">{property.landlordName || "Unknown Landlord"}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Verified Landlord
                    </p>
                  </div>
                </div>
              </div>
              
              {/* NEW: Only show the booking form if the property is actually available! */}
              {property.isAvailable ? (
                <TourBookingForm propertyId={property.id} landlordId={property.landlordId} />
              ) : (
                <div className="w-full flex flex-col items-center justify-center gap-2 font-bold py-6 px-4 rounded-xl shadow-sm bg-slate-50 border border-slate-200 text-slate-500 text-center">
                  <svg className="w-8 h-8 text-amber-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  Currently Unavailable
                  <span className="text-xs font-normal mt-1">This property is currently off-market and not accepting tours.</span>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}