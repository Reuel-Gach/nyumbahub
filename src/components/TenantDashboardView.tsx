import React from "react";
import Link from "next/link";

export default function TenantDashboardView({ tenantData }: { tenantData: any }) {
  if (!tenantData) return null;
  const { user, lease, payments, tours } = tenantData;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Welcome, {user?.fullName?.split(" ")[0] || "Resident"}!
          </h1>
          <p className="text-slate-500 mt-1">Manage your home, rent payments, and tour requests.</p>
        </div>
        
        {/* The Bridge to Landlord Mode */}
        <Link
          href="/mgmt/properties/new"
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-4 py-2.5 rounded-lg font-bold transition-colors shadow-sm text-sm"
        >
          Own a property? List it here
        </Link>
      </div>

      {/* 2. MY CURRENT HOME (If they have an active lease) */}
      {lease && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-200 overflow-hidden mb-8">
          <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-emerald-900">🏠 My Current Home</h2>
            <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full uppercase">
              Active Lease
            </span>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">{lease.propertyTitle}</h3>
                <p className="text-slate-500 mt-1">📍 {lease.propertyLocation}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Monthly Rent</p>
                  <p className="text-lg font-black text-slate-800">Ksh {lease.rentAmount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Landlord</p>
                  <p className="text-sm font-bold text-slate-800">{lease.landlordName}</p>
                  <a href={`mailto:${lease.landlordEmail}`} className="text-sm text-blue-600 hover:underline">
                    {lease.landlordEmail}
                  </a>
                </div>
              </div>
            </div>
            
            {/* Payment Call to Action */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col justify-center text-center">
              <p className="text-sm font-bold text-slate-600 mb-2">Next Payment Due</p>
              <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm">
                Pay via M-Pesa
              </button>
              <p className="text-xs text-slate-400 mt-2">Coming soon via Daraja API</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. PAYMENT HISTORY (Only show if they actually have a lease) */}
      {lease && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-800">💳 Payment History</h2>
          </div>
          
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Method & Ref</th>
                    <th className="px-6 py-4 text-right">Amount (Ksh)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                        {new Date(payment.paymentDate).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase
                          ${payment.paymentMethod === 'm-pesa' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}
                        `}>
                          {payment.paymentMethod === 'm-pesa' ? '🟢 M-PESA' : '🏦 BANK / CASH'}
                        </span>
                        {payment.referenceNumber && (
                          <p className="text-xs text-slate-500 mt-1 font-mono">{payment.referenceNumber}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap text-base font-black text-slate-800">
                        {payment.amountPaid.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 px-4">
              <p className="text-slate-500 text-sm">No payments recorded yet.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. MY TOUR REQUESTS (Always show, very useful for house hunting) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">📅 My Tour Requests</h2>
        </div>
        
        {tours && tours.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {tours.map((tour: any) => (
              <div key={tour.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-bold text-slate-800">{tour.propertyTitle}</h3>
                  <p className="text-sm text-slate-500 mt-1">📍 {tour.propertyLocation}</p>
                  <p className="text-sm text-slate-600 mt-2">
                    Scheduled for: <span className="font-semibold">{new Date(tour.tourDate).toLocaleDateString('en-GB')}</span>
                  </p>
                </div>
                <div>
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide
                    ${tour.status === 'approved' ? 'bg-blue-100 text-blue-800' : 
                      tour.status === 'declined' ? 'bg-red-100 text-red-800' : 
                      tour.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
                      'bg-amber-100 text-amber-800'}`}
                  >
                    {tour.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4">
            <p className="text-slate-500 text-sm mb-4">You haven't requested any property tours yet.</p>
            <Link href="/" className="text-sm font-bold text-blue-600 hover:text-blue-800">
              Browse Available Properties &rarr;
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}