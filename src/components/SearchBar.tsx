"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from the URL so it remembers what you searched for
  const [query, setQuery] = useState(searchParams.get("query") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  
  // 🔥 NEW: Category state
  const [category, setCategory] = useState(searchParams.get("category") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build the new URL parameters
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (category) params.set("category", category); // 🔥 NEW: Add to URL

    // Push the new URL to the browser, which triggers Next.js to fetch new data!
    router.push(`/?${params.toString()}`);
  };

  const handleClear = () => {
    setQuery("");
    setMaxPrice("");
    setCategory(""); // 🔥 NEW: Clear category
    router.push("/");
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 mb-8">
      
      {/* KEYWORD SEARCH */}
      <div className="flex-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Location or Keyword</label>
        <input 
          type="text" 
          placeholder="e.g., Ruiru, 2-Bedroom..." 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
        />
      </div>

      {/* 🔥 NEW: CATEGORY DROPDOWN */}
      <div className="md:w-48">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
        >
          <option value="">All Properties</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Land">Land</option>
        </select>
      </div>

      {/* MAX PRICE */}
      <div className="md:w-40">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Max Price (Ksh)</label>
        <input 
          type="number" 
          placeholder="e.g., 20000" 
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
        />
      </div>

      {/* BUTTONS */}
      <div className="flex items-end gap-2">
        {(query || maxPrice || category) && (
          <button 
            type="button" 
            onClick={handleClear}
            className="px-4 py-2 text-slate-500 hover:text-slate-700 font-medium transition-colors"
          >
            Clear
          </button>
        )}
        <button 
          type="submit"
          className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Search
        </button>
      </div>

    </form>
  );
}