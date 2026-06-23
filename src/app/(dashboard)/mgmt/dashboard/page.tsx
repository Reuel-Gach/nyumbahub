import React from "react";
import Link from "next/link";
import { getLandlordProperties } from "../../../../lib/actions/properties";
import PropertyActions from "../../../../components/PropertyActions";
import StatusDropdown from "../../../../components/StatusDropdown"; // NEW IMPORT

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // 1. Fetch the data
  const myProperties = await getLandlordProperties();

  // 2. Calculate the Analytics Metrics (UPDATED FOR NEW SCHEMA)
  const totalUnits = myProperties.length;
  const activeUnits = myProperties.filter(property => property.status === "active_listing").length;
  const offMarketUnits = totalUnits - activeUnits;
  
  // Calculate total potential monthly revenue
  const potentialRevenue = myProperties.reduce((sum, property) => {
    return sum + (property.pricePerMonth || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Landlord Analytics</h1>
          <p className="text-slate-500 mt-1">Overview of your portfolio performance and revenue.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/mgmt/tours"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-lg font-semibold transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            View Tour Requests
          </Link>

          <Link
            href="/mgmt/properties/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            New Listing
          </Link>
        </div>
      </div>

      {/* --- ANALYTICS METRICS ROW --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Potential Revenue</span>
          <span className="text-3xl font-black text-blue-600">Ksh {potentialRevenue.toLocaleString()}</span>
          <span className="text-xs text-slate-400 mt-1">per month</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Units</span>
          <span className="text-3xl font-black text-slate-800">{totalUnits}</span>
          <span className="text-xs text-slate-400 mt-1">in your portfolio</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-emerald-500"></div>
          <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-1">Active / Listed</span>
          <span className="text-3xl font-black text-slate-800">{activeUnits}</span>
          <span className="text-xs text-slate-400 mt-1">currently on the market</span>
        </div>

        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 w-2 h-full bg-amber-400"></div>
          <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider mb-1">Off-Market</span>
          <span className="text-3xl font-black text-slate-800">{offMarketUnits}</span>
          <span className="text-xs text-slate-400 mt-1">unlisted or occupied</span>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Manage Properties</h2>
        </div>

        {myProperties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myProperties.map((property) => (
              <div key={property.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                
                {/* Property Info */}
                <div className="flex-grow flex items-center gap-4">
                  {property.imageUrl && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 hidden sm:block">
                      <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-slate-800 line-clamp-1">{property.title}</h3>
                      
                      {/* NEW: Replaced the static badge with our interactive Dropdown! */}
                      <StatusDropdown 
                        propertyId={property.id} 
                        currentStatus={property.status as "active_listing" | "vacant" | "occupied"} 
                      />
                      
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {property.location}
                    </p>
                  </div>
                </div>

                {/* Financials & Interactive Actions Island */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:gap-8">
                  <div className="text-left sm:text-right">
                    <span className="block text-lg font-black text-slate-800">Ksh {property.pricePerMonth.toLocaleString()}</span>
                    <span className="block text-xs text-slate-500 font-medium">per month</span>
                  </div>
                  <PropertyActions propertyId={property.id} />
                </div>

              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No properties listed yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto">You haven't added any properties to your portfolio. Start earning by listing your first unit.</p>
            <Link
              href="/mgmt/properties/new"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold transition-colors"
            >
              List a Property
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}