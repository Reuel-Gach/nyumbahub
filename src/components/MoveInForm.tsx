"use client";

import React, { useState, useEffect } from "react";
import { moveTenantIn } from "@/lib/actions/leases";

interface MoveInProps {
  tourId: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  defaultRent: number;
  category?: string; 
}

export default function MoveInForm({ tourId, propertyId, tenantName, tenantEmail, defaultRent, category = "Residential" }: MoveInProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedOption, setSelectedOption] = useState(""); 
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [customYears, setCustomYears] = useState(""); // 🔥 NEW: Track custom years input

  const isMissingId = !propertyId || propertyId === "undefined";

  const getLeaseOptions = (cat: string) => {
    let options = [];
    if (cat === "Commercial") {
      options = [
        { value: "5 Years 1 Month", label: "5 Years & 1 Month (Exempt from Cap 301)" },
        { value: "6 Years", label: "6 Years Standard Commercial" },
        { value: "10 Years", label: "10 Years Long-term" }
      ];
    } else if (cat === "Land") {
      options = [
        { value: "1 Year", label: "1 Year (Short-term/Agricultural)" },
        { value: "5 Years", label: "5 Years Standard" },
        { value: "10 Years", label: "10 Years" },
        { value: "45 Years", label: "45 Years (Development/Commercial)" },
        { value: "99 Years", label: "99 Years (Long Lease)" }
      ];
    } else {
      options = [
        { value: "1 Year", label: "1 Year Standard" },
        { value: "2 Years", label: "2 Years Standard" },
        { value: "Month-to-Month", label: "Month-to-Month Open" }
      ];
    }
    
    // 🔥 NEW: Add both Custom options
    options.push({ value: "Custom Years", label: "Custom Years..." });
    options.push({ value: "Custom Date", label: "Custom End Date..." });
    return options;
  };

  const leaseOptions = getLeaseOptions(category);

  useEffect(() => {
    if (!selectedOption && leaseOptions.length > 0) {
      setSelectedOption(leaseOptions[0].value);
    }
  }, [category, leaseOptions, selectedOption]);

  // 🔥 UPDATED: Now calculates based on custom years as well
  const calculateEndDate = (start: string, duration: string, customYrs: string) => {
    if (duration === "Month-to-Month" || duration === "Custom Date") return null;
    
    const date = new Date(start);
    if (isNaN(date.getTime())) return null;

    if (duration === "Custom Years") {
      const yrs = parseInt(customYrs);
      if (isNaN(yrs) || yrs <= 0) return null;
      date.setFullYear(date.getFullYear() + yrs);
    }
    else if (duration.includes("1 Year")) date.setFullYear(date.getFullYear() + 1);
    else if (duration.includes("2 Years")) date.setFullYear(date.getFullYear() + 2);
    else if (duration === "5 Years") date.setFullYear(date.getFullYear() + 5);
    else if (duration === "5 Years 1 Month") {
      date.setFullYear(date.getFullYear() + 5);
      date.setMonth(date.getMonth() + 1);
    }
    else if (duration === "6 Years") date.setFullYear(date.getFullYear() + 6);
    else if (duration === "10 Years") date.setFullYear(date.getFullYear() + 10);
    else if (duration === "45 Years") date.setFullYear(date.getFullYear() + 45);
    else if (duration === "99 Years") date.setFullYear(date.getFullYear() + 99);

    return date.toISOString().split('T')[0];
  };

  const calculatedEndDate = calculateEndDate(startDate, selectedOption, customYears);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isMissingId) return;
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await moveTenantIn(formData);
      setIsOpen(false);
    } catch (error) {
      alert("Failed to move tenant in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // RESTORED: The original beautiful Emerald trigger button
  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors shadow-sm border border-emerald-200 flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
        Move Tenant In
      </button>
    );
  }

  return (
    <div className="mt-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-inner w-full max-w-sm text-left">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-emerald-900">Draft Lease Details</h4>
        <button type="button" onClick={() => setIsOpen(false)} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg">&times;</button>
      </div>

      {isMissingId && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 text-xs font-bold rounded border border-red-200">
          🚨 Developer Warning: propertyId is missing! Update getLandlordTours() in actions/tours.ts to select it.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="tourId" value={tourId || ""} />
        <input type="hidden" name="propertyId" value={propertyId || ""} />
        <input type="hidden" name="tenantName" value={tenantName || ""} />
        <input type="hidden" name="tenantEmail" value={tenantEmail || ""} />
        
        {/* Sends the auto-calculated calendar date to the DB */}
        {calculatedEndDate && selectedOption !== "Custom Date" && (
          <input type="hidden" name="endDate" value={calculatedEndDate} />
        )}

        {/* Sends the formatted string (e.g. "7 Years") to the DB */}
        {selectedOption === "Custom Years" && (
          <input type="hidden" name="leaseDuration" value={`${customYears} Years`} />
        )}
        {selectedOption === "Custom Date" && (
          <input type="hidden" name="leaseDuration" value="Custom Fixed Date" />
        )}

        <div>
          <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Agreed Monthly Rent (Ksh)</label>
          <input 
            type="number" 
            name="rentAmount" 
            defaultValue={defaultRent} 
            required 
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold text-emerald-900" 
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Lease Start Date</label>
          <input 
            type="date" 
            name="startDate" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required 
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-emerald-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Lease Duration</label>
          <select 
            name={selectedOption === "Custom Years" || selectedOption === "Custom Date" ? "ignoredDuration" : "leaseDuration"} 
            value={selectedOption}
            onChange={(e) => {
              setSelectedOption(e.target.value);
              setCustomYears(""); // Reset input when changing options
            }}
            required 
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-emerald-900"
          >
            {leaseOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* 🔥 NEW: Number Input for Custom Years */}
          {selectedOption === "Custom Years" && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="block text-[10px] font-bold text-emerald-600 uppercase mb-1">Number of Years</label>
              <input 
                type="number" 
                min="1"
                placeholder="e.g. 3"
                value={customYears}
                onChange={(e) => setCustomYears(e.target.value)}
                required 
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-emerald-900"
              />
            </div>
          )}

          {/* Previews the auto-calculated date */}
          {calculatedEndDate && selectedOption !== "Custom Date" && selectedOption !== "Month-to-Month" && (
            <div className="mt-2 p-2 bg-emerald-100 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
              <span className="text-base">📅</span>
              <span>Expires exactly on: <strong>{new Date(calculatedEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
            </div>
          )}
        </div>

        {/* Calendar Picker for Custom Exact Date */}
        {selectedOption === "Custom Date" && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Exact End Date</label>
            <input 
              type="date" 
              name="endDate" 
              required 
              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-emerald-900" 
            />
          </div>
        )}

        <button 
          type="submit" 
          disabled={isLoading || isMissingId} 
          className={`w-full py-2 text-white text-sm font-bold rounded-lg transition-colors shadow-sm mt-2 ${isLoading || isMissingId ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
        >
          {isLoading ? "Processing..." : "Finalize Lease"}
        </button>
      </form>
    </div>
  );
}