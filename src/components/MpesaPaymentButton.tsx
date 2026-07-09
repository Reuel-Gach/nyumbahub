"use client";

import React, { useState, useEffect } from "react";

interface MpesaPaymentProps {
  leaseId: string;
  amount: number;
  propertyTitle: string;
}

export default function MpesaPaymentButton({ leaseId, amount, propertyTitle }: MpesaPaymentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // 1. HYDRATION CHECK: Ensures the component is fully interactive before rendering
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenClick = () => {
    setIsOpen(true);
    setMessage("");
    setError("");
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/mpesa/stk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          amount,
          leaseId,
          accountReference: propertyTitle.substring(0, 12),
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Payment failed to initiate");

      setMessage("Success! Please check your phone and enter your M-Pesa PIN.");
      
      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
      }, 4000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If React hasn't attached JS yet, show a disabled state
  if (!isMounted) {
    return (
      <button disabled className="bg-slate-300 text-slate-500 px-4 py-2 rounded-lg font-bold flex items-center gap-2 cursor-wait">
        Loading Payment...
      </button>
    );
  }

  return (
    <>
      <button
        type="button" // 3. SAFEGUARD: Prevents the button from acting like a form submit
        onClick={handleOpenClick}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition-colors flex items-center gap-2 relative z-10" // 4. z-10 prevents invisible overlaps
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
        Pay Rent via M-Pesa
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="bg-emerald-500 p-6 text-white text-center relative">
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-emerald-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <h3 className="text-2xl font-bold mb-1">M-Pesa Payment</h3>
              <p className="opacity-90">{propertyTitle}</p>
            </div>
            
            <form onSubmit={handlePayment} className="p-6">
              {/* ... form content exactly as before ... */}
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <p className="text-sm text-slate-500 uppercase tracking-wider font-bold mb-1">Amount Due</p>
                <p className="text-3xl font-black text-slate-800">Ksh {amount.toLocaleString()}</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g., 0712345678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-lg"
                />
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}
              {message && <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 rounded-lg text-sm font-bold border border-emerald-200">{message}</div>}

              <button
                type="submit"
                disabled={loading || !phoneNumber}
                className="w-full px-4 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? "Processing..." : "Confirm Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}