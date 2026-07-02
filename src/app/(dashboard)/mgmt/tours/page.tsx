import React from "react";
import Link from "next/link";
import { getLandlordTours } from "@/lib/actions/tours";
import TourActionButtons from "@/components/TourActionButtons";

export const dynamic = 'force-dynamic';

export default async function ToursPage() {
  const tours = await getLandlordTours();

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
                <div>
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
                
                <div className="flex-shrink-0">
                  {/* FULLY UPDATED: We are now passing the missing propertyId and tenant details! */}
                  <TourActionButtons 
                    tourId={tour.id} 
                    currentStatus={tour.status} 
                    propertyId={tour.propertyId}
                    tenantName={tour.tenantName}
                    tenantEmail={tour.tenantEmail}
                    rentAmount={tour.pricePerMonth || 0}
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