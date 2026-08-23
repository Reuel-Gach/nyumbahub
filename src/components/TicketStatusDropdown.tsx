"use client";

import React, { useState } from "react";
import { updateTicketStatus } from "@/lib/actions/maintenance";

interface TicketStatusDropdownProps {
  ticketId: string;
  currentStatus: string;
}

export default function TicketStatusDropdown({ ticketId, currentStatus }: TicketStatusDropdownProps) {
  const [status, setStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus); // Optimistic UI update
    setIsUpdating(true);

    try {
      await updateTicketStatus(ticketId, newStatus);
    } catch (error) {
      console.error(error);
      setStatus(currentStatus); // Revert on failure
      alert("Failed to update status. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Dynamic colors based on status
  const getStyles = () => {
    if (status === "resolved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (status === "in_progress") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isUpdating}
      className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${getStyles()}`}
    >
      <option value="open">Open</option>
      <option value="in_progress">In Progress</option>
      <option value="resolved">Resolved</option>
    </select>
  );
}