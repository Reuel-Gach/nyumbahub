"use client";

import React, { useState } from "react";
import { issueEviction, finalizeLease } from "@/lib/actions/landlordActions";
import { offerEarlyTermination } from "@/lib/actions/leaseActions"; // <-- NEW IMPORT

interface EvictionModalProps {
  leaseId: string;
  tenantName: string;
  currentStatus: string;
}

export default function EvictionModal({ leaseId, tenantName, currentStatus }: EvictionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEvictionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Please provide a detailed reason (minimum 10 characters).");
      return;
    }

    setLoading(true);
    setError("");

    const result = await issueEviction(leaseId, reason);
    if (result.success) {
      setIsOpen(false);
    } else {
      setError(result.error || "Something went wrong.");
      setLoading(false);
    }
  };

  // Used ONLY for Finalizing a pending move-out or eviction after the 30 days
  const handleFinalize = async () => {
    if (confirm(`Are you sure you want to finalize the move-out for ${tenantName}?`)) {
      setLoading(true);
      await finalizeLease(leaseId);
      setLoading(false);
    }
  };

  // 🔥 NEW: Sends the mutual agreement offer to the tenant
  const handleOfferEarlyEnd = async () => {
    if (confirm(`Offer ${tenantName} an immediate mutual end to the lease? They must accept this on their dashboard.`)) {
      setLoading(true);
      await offerEarlyTermination(leaseId);
      setLoading(false);
    }
  };

  // SCENARIO 1: Lease is already pending move-out or eviction
  if (currentStatus === "move_out_pending" || currentStatus === "eviction_notice") {
    return (
      <button 
        onClick={handleFinalize}
        disabled={loading}
        className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
      >
        {loading ? "Processing..." : "Finalize Move-Out"}
      </button>
    );
  }

  // SCENARIO 1.5: Landlord offered early termination and is waiting for tenant
  if (currentStatus === "early_termination_offered") {
    return (
      <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold border border-blue-200 flex items-center gap-2">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        Waiting for Tenant
      </span>
    );
  }

  // SCENARIO 2: Lease is active. Landlord can Evict OR Offer to mutually end.
  return (
    <div className="flex items-center gap-2">
      {/* Mutual Agreement Button */}
      <button
        onClick={handleOfferEarlyEnd}
        disabled={loading}
        className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Offer Early End"}
      </button>

      {/* Eviction Notice Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-sm font-bold transition-colors"
      >
        Issue Notice
      </button>

      {/* Eviction Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-rose-600 p-6 text-white">
              <h3 className="text-xl font-bold">Issue Eviction Notice</h3>
              <p className="opacity-90 text-sm mt-1">Initiate a legal 30-day notice for {tenantName}.</p>
            </div>
            
            <form onSubmit={handleEvictionSubmit} className="p-6">
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
                <strong>Legal Warning:</strong> This action will notify the tenant that they have 30 days to vacate the premises. You must provide a valid reason below.
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Reason for Eviction
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g., Rent arrears exceeding 60 days..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700 resize-none"
                />
              </div>

              {error && <p className="text-rose-600 text-sm mb-4 font-medium">{error}</p>}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Issue Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}