"use client";

import React, { useState } from "react";
import { updateTourStatus } from "@/lib/actions/tours";

export default function TourActionButtons({ tourId, currentStatus }: { tourId: string, currentStatus: string }) {
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

  if (currentStatus === "approved") {
    return (
      <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
        Approved
      </span>
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