"use client";

import React, { useState } from "react";
// Note: We will create this server action next!
import { submitTourRequest } from "../lib/actions/tours";

interface TourBookingFormProps {
  propertyId: string;
  landlordId: string;
}

export default function TourBookingForm({ propertyId, landlordId }: TourBookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("propertyId", propertyId);
      formData.set("landlordId", landlordId);

      // We will define this action in the next step
      await submitTourRequest(formData);
      
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to submit request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 className="text-lg font-bold text-emerald-800 mb-2">Tour Request Sent!</h3>
        <p className="text-emerald-600 text-sm">The landlord will receive your request and contact you shortly to confirm the time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        Request a Tour
      </h3>
      
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Select Date</label>
          <input 
            type="date" 
            name="tourDate" 
            required 
            // Prevent selecting dates in the past
            min={new Date().toISOString().split('T')[0]} 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <input type="text" name="tenantName" placeholder="Full Name" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <input type="tel" name="tenantPhone" placeholder="Phone Number (e.g., 07...)" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <input type="email" name="tenantEmail" placeholder="Email Address" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <textarea name="message" placeholder="Optional message for the landlord..." rows={2} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className={`w-full py-3 rounded-lg font-bold text-white transition-colors ${isSubmitting ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSubmitting ? "Sending Request..." : "Send Request"}
        </button>
        <p className="text-center text-xs text-slate-400 mt-2">No commitment required. Free to tour.</p>
      </form>
    </div>
  );
}