"use client";

import React, { useState } from "react";
import { updatePropertyStatus } from "@/lib/actions/properties";

interface Props {
  propertyId: string;
  isAvailable: boolean; // Expecting True/False from the database
}

export default function StatusDropdown({ propertyId, isAvailable }: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(isAvailable);

  async function handleToggle() {
    setLoading(true);
    const newStatus = !status;
    setStatus(newStatus); // Optimistic UI update for instant feedback
    
    try {
      await updatePropertyStatus(propertyId, newStatus);
    } catch (error) {
      alert("Failed to update status");
      setStatus(!newStatus); // Revert if the database update fails
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-3 py-1.5 text-xs font-bold rounded-full transition-colors border shadow-sm flex items-center gap-1.5
        ${status 
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" 
          : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
        } 
        ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {loading ? (
        "Updating..."
      ) : status ? (
        <>🟢 Active</>
      ) : (
        <>⚪ Off-Market</>
      )}
    </button>
  );
}