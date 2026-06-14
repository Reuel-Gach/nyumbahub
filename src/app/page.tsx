import React from "react";
import Link from "next/link";
import { getAvailableProperties } from "../lib/actions/properties";

// Force Next.js to skip the cache and fetch live data from Neon
export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const propertyList = await getAvailableProperties();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-blue-600 sm:text-5xl">NyumbaHub</h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Discover your next home. Browse the latest verified listings from landlords across the region.
          </p>
        </div>

        {propertyList && propertyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propertyList.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                
                {/* NEW: Display the image from our new pipeline */}
                {property.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden">
                    <img src={property.imageUrl} alt={property.title} className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div className="p-6 flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{property.title}</h2>
                    {property.isAvailable && (
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">Active</span>
                    )}
                  </div>
                  <p className="text-slate-500 text-sm mb-4">{property.location}</p>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-6">{property.description || "No description provided."}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 px-6 pb-6 flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">Ksh {property.pricePerMonth.toLocaleString()}</span>
                  <Link href={`/properties/${property.id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-medium text-slate-900">No properties found</h3>
          </div>
        )}
      </div>
    </div>
  );
}