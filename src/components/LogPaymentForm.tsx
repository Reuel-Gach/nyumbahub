"use client";

import React, { useState } from "react";
import { logPayment } from "@/lib/actions/payments";

interface LeaseOption {
  id: string;
  rentAmount: number;
  propertyTitle: string | null;
  tenantName: string | null;
}

export default function LogPaymentForm({ activeLeases }: { activeLeases: LeaseOption[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      await logPayment(formData);
      setIsOpen(false);
    } catch (error) {
      alert("Failed to log payment.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg font-bold transition-colors shadow-sm flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
        Log New Payment
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Record Manual Payment</h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Select Tenant & Property</label>
            {activeLeases.length === 0 ? (
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
                No active leases found. You must move a tenant in first!
              </div>
            ) : (
              <select name="leaseId" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium">
                <option value="">-- Choose Lease --</option>
                {activeLeases.map(lease => (
                  <option key={lease.id} value={lease.id}>
                    {lease.tenantName} - {lease.propertyTitle} (Rent: Ksh {lease.rentAmount})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount Paid (Ksh)</label>
              <input type="number" name="amountPaid" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold" placeholder="e.g. 20000" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Method</label>
              <select name="paymentMethod" required className="w-full px-4 py-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold">
                <option value="m-pesa">🟢 M-Pesa</option>
                <option value="bank_transfer">🏦 Bank Transfer</option>
                <option value="cash">💵 Cash</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">M-Pesa Ref / Receipt No.</label>
            <input type="text" name="referenceNumber" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm uppercase placeholder-normal" placeholder="e.g. QEX1234567" />
          </div>

          <button 
            type="submit" 
            disabled={isLoading || activeLeases.length === 0}
            className={`w-full py-3 text-white text-sm font-bold rounded-lg transition-colors shadow-sm mt-2 ${isLoading || activeLeases.length === 0 ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            {isLoading ? "Saving..." : "Save Payment Record"}
          </button>
        </form>
      </div>
    </div>
  );
}