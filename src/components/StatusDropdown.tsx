"use client";

import React, { useState } from "react";
import { updatePropertyStatus } from "@/lib/actions/properties";

interface Props {
  propertyId: string;
  currentStatus: "active_listing" | "vacant" | "occupied";
}

export default function StatusDropdown({ propertyId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value as "active_listing" | "vacant" | "occupied";
    setStatus(newStatus);
    setIsLoading(true);
    
    try {
      await updatePropertyStatus(propertyId, newStatus);
    } catch (error) {
      alert("Failed to update status");
      setStatus(currentStatus); 
    } finally {
      setIsLoading(false);
    }
  }

  const colorStyles = 
    status === "active_listing" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
    status === "occupied" ? "bg-blue-50 text-blue-700 border-blue-200" :
    "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isLoading}
      className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors shadow-sm appearance-none text-center ${colorStyles} ${isLoading ? 'opacity-50' : ''}`}
    >
      <option value="active_listing">🟢 Active</option>
      <option value="vacant">⚪ Vacant</option>
      <option value="occupied">🔵 Occupied</option>
    </select>
  );
}