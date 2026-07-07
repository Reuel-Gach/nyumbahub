"use client";

import React, { useState } from "react";
import { respondToEarlyTermination } from "@/lib/actions/leaseActions";

export default function EarlyTerminationResponse({ leaseId }: { leaseId: string }) {
  const [loading, setLoading] = useState(false);

  const handleResponse = async (accept: boolean) => {
    if (accept && !confirm("Are you sure? This will end your lease immediately and you will be expected to vacate.")) return;
    
    setLoading(true);
    await respondToEarlyTermination(leaseId, accept);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="mt-5 p-5 bg-blue-50 border border-blue-200 rounded-xl w-full flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span className="text-sm font-bold text-blue-800">Processing response...</span>
      </div>
    );
  }

  return (
    <div className="mt-5 p-5 bg-blue-50 border border-blue-200 rounded-xl w-full">
      <div className="flex items-start gap-3">
        <span className="text-2xl mt-0.5">🤝</span>
        <div className="w-full">
          <h4 className="font-bold text-blue-900 text-base">Mutual Early Termination Offer</h4>
          <p className="text-sm mt-1 text-blue-800">Your landlord has offered to end your lease early, waiving the standard 30-day notice period. Do you accept this immediate move-out?</p>
          
          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={() => handleResponse(true)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Accept & End Lease
            </button>
            <button 
              onClick={() => handleResponse(false)}
              className="px-5 py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Decline Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}