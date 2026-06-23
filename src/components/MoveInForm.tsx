"use client";

import React, { useState } from "react";
import { moveTenantIn } from "@/lib/actions/leases";

interface MoveInProps {
  tourId: string;
  propertyId: string;
  tenantName: string;
  tenantEmail: string;
  defaultRent: number; // We pull this from the property to make it easy for the landlord
}

export default function MoveInForm({ tourId, propertyId, tenantName, tenantEmail, defaultRent }: MoveInProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <div className="mt-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl shadow-inner w-full max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-emerald-900">Draft Lease Details</h4>
        <button onClick={() => setIsOpen(false)} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg">&times;</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input type="hidden" name="tourId" value={tourId} />
        <input type="hidden" name="propertyId" value={propertyId} />
        <input type="hidden" name="tenantName" value={tenantName} />
        <input type="hidden" name="tenantEmail" value={tenantEmail} />

        <div>
          <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Agreed Monthly Rent (Ksh)</label>
          <input 
            type="number" 
            name="rentAmount" 
            defaultValue={defaultRent}
            required 
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-emerald-800 uppercase mb-1">Move-in / Lease Start Date</label>
          <input 
            type="date" 
            name="startDate" 
            required 
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
        >
          {isLoading ? "Processing..." : "Finalize Lease & Mark Occupied"}
        </button>
      </form>
    </div>
  );
}