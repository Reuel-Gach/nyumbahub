"use client";

import React, { useState } from "react";
import { updatePropertyStatus } from "@/lib/actions/properties"; // Ensure this action exists

export default function PropertyAvailabilityToggle({ propertyId, isAvailable }: { propertyId: string, isAvailable: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    await updatePropertyStatus(propertyId, !isAvailable);
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${
        isAvailable 
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" 
          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
      }`}
    >
      {loading ? "Updating..." : (isAvailable ? "Active" : "Off-Market")}
    </button>
  );
}