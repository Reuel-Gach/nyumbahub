import React from "react";
import Link from "next/link";
import { getLandlordProperties } from "../../../../lib/actions/properties";
import PropertyActions from "../../../../components/PropertyActions";

export default async function DashboardPage() {
  // Fetch the properties specific to the logged-in landlord
  const myProperties = await getLandlordProperties();

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      
      {/* Dashboard Header & Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Portfolio</h1>
          <p className="text-slate-500 mt-1">Manage your property listings and availability.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm text-center">
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Units</span>
            <span className="block text-xl font-bold text-blue-600">{myProperties.length}</span>
          </div>
          <Link 
            href="/mgmt/properties/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-semibold transition-colors shadow-sm whitespace-nowrap"
          >
            + New Listing
          </Link>
        </div>
      </div>

      {/* Properties List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {myProperties.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {myProperties.map((property) => (
              <div key={property.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                
                {/* Property Info */}
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-800">{property.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${property.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {property.isAvailable ? "Active" : "Off-Market"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {property.location}
                  </p>
                </div>

                {/* Financials & Interactive Actions Island */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <span className="block text-lg font-bold text-slate-800">Ksh {property.pricePerMonth.toLocaleString()}</span>
                    <span className="block text-xs text-slate-500">per month</span>
                  </div>
                  
                  {/* The interactive island component */}
                  <PropertyActions propertyId={property.id} />
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
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