"use client";

import React, { useState } from "react";
import { updatePayment, deletePayment } from "@/lib/actions/payments";

interface PaymentActionsProps {
  payment: {
    id: string;
    amount: number;
    method: string;
    reference: string | null;
  };
}

export default function PaymentActions({ payment }: PaymentActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Deletion
  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to delete this payment record? This will reduce your total revenue.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deletePayment(payment.id);
    } catch (error) {
      alert("Failed to delete payment.");
      setIsDeleting(false);
    }
  }

  // Handle Update
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("paymentId", payment.id); // Inject the ID securely
      
      await updatePayment(formData);
      setIsEditing(false);
    } catch (error) {
      alert("Failed to update payment.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <div className="flex justify-end gap-2">
        <button 
          onClick={() => setIsEditing(true)}
          disabled={isDeleting}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Edit Payment"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
        </button>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className={`p-1.5 rounded transition-colors ${isDeleting ? "text-red-300" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
          title="Delete Payment"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
        </button>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
              <h2 className="text-sm font-bold text-slate-800">Edit Payment Record</h2>
              <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">&times;</button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-4 space-y-3 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Amount Paid (Ksh)</label>
                <input type="number" name="amountPaid" defaultValue={payment.amount} required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Payment Method</label>
                <select name="paymentMethod" defaultValue={payment.method} required className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                  <option value="m-pesa">M-Pesa</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reference Number</label>
                <input type="text" name="referenceNumber" defaultValue={payment.reference || ""} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm uppercase" />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsEditing(false)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm">
                  {isSaving ? "Saving..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}