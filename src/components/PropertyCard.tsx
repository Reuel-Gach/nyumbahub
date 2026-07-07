import React from "react";
import Link from "next/link";

export default function PropertyCard({ property }: { property: any }) {
  // Calculate total images: 1 (cover) + length of gallery array
  const galleryCount = property.gallery?.length || 0;
  const totalImages = 1 + galleryCount;

  // 🔥 NEW: Dynamic colors based on the property category
  const getCategoryStyles = (category: string) => {
    switch (category) {
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
    <Link href={`/properties/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
        
        {/* Image Section */}
        <div className="relative h-56 w-full bg-slate-200">
          <img 
            src={property.imageUrl} 
            alt={property.title} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          
          {/* Badge: Displays Image Count */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
            <span>📸</span>
            <span>{totalImages} {totalImages === 1 ? "Photo" : "Photos"}</span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          
          {/* 🔥 NEW: Category & SubType Tags */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${getCategoryStyles(property.category)}`}>
              {property.subType || "Property"}
            </span>
            <span className="text-xs font-medium text-slate-400">
              {property.category || "Residential"}
            </span>
          </div>

          <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{property.title}</h3>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
            📍 {property.location}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
            <span className="text-blue-600 font-black">
              Ksh {property.pricePerMonth.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-400">/ month</span>
          </div>
        </div>
      </div>
    </Link>
  );
}