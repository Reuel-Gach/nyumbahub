"use client";

import React, { useState } from "react";
import { updateTourStatus } from "@/lib/actions/tours";
import MoveInForm from "./MoveInForm"; // NEW IMPORT

// Notice we added propertyId, tenantName, etc. to the props so we can pass them down!
export default function TourActionButtons({ 
  tourId, 
  currentStatus, 
  propertyId, 
  tenantName, 
  tenantEmail, 
  rentAmount 
}: any) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleStatusChange(status: "approved" | "declined" | "completed") {
    setIsLoading(true);
    try {
      await updateTourStatus(tourId, status);
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setIsLoading(false);
    }
  }

  // If completed, the tenant is officially in!
  if (currentStatus === "completed") {
    return (
      <span className="bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"></path></svg>
        Lease Active
      </span>
    );
  }

  // --- NEW: If Approved, show the Move In Form! ---
  if (currentStatus === "approved") {
    return (
      <div className="flex flex-col items-end">
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full mb-2">
          Tour Approved
        </span>
        <MoveInForm 
          tourId={tourId}
          propertyId={propertyId}
          tenantName={tenantName}
          tenantEmail={tenantEmail}
          defaultRent={rentAmount || 0}
        />
      </div>
    );
  }

  if (currentStatus === "declined") {
    return (
      <span className="bg-red-100 text-red-800 text-xs font-bold px-3 py-1.5 rounded-full">
        Declined
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={() => handleStatusChange("declined")}
        disabled={isLoading}
        className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
      >
        Decline
      </button>
      <button 
        onClick={() => handleStatusChange("approved")}
        disabled={isLoading}
        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
      >
        {isLoading ? "..." : "Approve"}
      </button>
    </div>
  );
}