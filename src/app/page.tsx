import React from "react";
import Link from "next/link";
import { getAvailableProperties } from "../lib/actions/properties";
import SearchBar from "../components/SearchBar";

export const dynamic = 'force-dynamic';

export default async function RootPage({ 
  searchParams 
}: { 
  // 🔥 UPDATED: Added category to the URL parameters
  searchParams: { query?: string; maxPrice?: string; category?: string } 
}) {
  
  const query = searchParams.query || undefined;
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined;
  const category = searchParams.category || undefined; // 🔥 Extract category from URL

  // 🔥 Pass category to the database query
  const propertyList = await getAvailableProperties({ query, maxPrice, category });

  // 🔥 Helper function for the new dynamic badge colors
  const getCategoryStyles = (cat: string) => {
    switch (cat) {
      case "Commercial":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Land":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "Residential":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Modernized, Compact Value Proposition */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Find Your Next Home
          </h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl">
            Browse the latest verified, high-quality listings from landlords across the region.
          </p>
        </div>

        {/* Search & Filter Bar pushed upward for high engagement */}
        <SearchBar />

        {/* Property Grid Section */}
        {propertyList && propertyList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {propertyList.map((property) => (
              <div 
                key={property.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all flex flex-col group"
              >
                {property.imageUrl && (
                  <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                    <img 
                      src={property.imageUrl} 
                      alt={property.title} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" 
                    />
                  </div>
                )}
                
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    {/* 🔥 NEW: Category & SubType Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoryStyles(property.category)}`}>
                        {property.subType || "Property"}
                      </span>
                      <span className="text-xs font-medium text-slate-500">
                        {property.category || "Residential"}
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h2 className="text-lg font-bold text-slate-800 line-clamp-1">
                        {property.title}
                      </h2>
                      {property.status === 'active_listing' && (
                        <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                          Active Listing
                        </span>
                      )}
                    </div>
                    
                    <p className="text-slate-400 text-xs font-medium mb-3 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {property.location}
                    </p>
                    
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4">
                      {property.description || "No description provided."}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <div>
                      <span className="text-xl font-black text-blue-600">
                        Ksh {property.pricePerMonth.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 font-normal">/mo</span>
                    </div>
                    
                    <Link 
                      href={`/properties/${property.id}`} 
                      className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-base font-semibold text-slate-800 mb-1">
              No listings match your parameters
            </h3>
            <p className="text-slate-400 text-sm">
              Try altering your keywords, category, or broadening your price limits.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}