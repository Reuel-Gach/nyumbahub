"use client";

import React, { useState, useEffect } from "react";
import { requestMoveOut } from "@/lib/actions/leaseActions";

export default function MoveOutButton({ leaseId }: { leaseId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Calculate minimum date (30 days from today) in YYYY-MM-DD format for the HTML input
  const [minDateStr, setMinDateStr] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 30);
    const formatted = minDate.toISOString().split('T')[0];
    setMinDateStr(formatted);
    setSelectedDate(formatted); // Default to exactly 30 days
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await requestMoveOut(leaseId, new Date(selectedDate));

    if (result.success) {
      setIsOpen(false);
      // The server action will revalidate the path, so the dashboard will naturally refresh!
    } else {
      setError(result.error || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm font-bold text-slate-500 hover:text-rose-600 transition-colors border border-slate-200 hover:border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-lg"
      >
        Request Move-Out
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-rose-500 p-6 text-white">
              <h3 className="text-xl font-bold">End Tenancy (Move-Out)</h3>
              <p className="opacity-90 text-sm mt-1">Please provide your legal 30-day notice.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
                <strong>Legal Notice:</strong> Under Kenyan law, you are required to give a 30-day notice before vacating the premises. Your deposit may be withheld if proper notice is not given.
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Select Move-Out Date
                </label>
                <input
                  type="date"
                  required
                  min={minDateStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-rose-500 outline-none text-slate-700"
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
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-colors disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Confirm Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}