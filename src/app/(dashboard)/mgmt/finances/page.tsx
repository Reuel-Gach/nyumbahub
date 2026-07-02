import React from "react";
import Link from "next/link";
import { getLandlordLedger } from "@/lib/actions/payments";
import { getActiveLeases } from "@/lib/actions/leases";
import LogPaymentForm from "@/components/LogPaymentForm";
import PaymentActions from "@/components/PaymentActions"; // Make sure this is imported!

export const dynamic = 'force-dynamic';

export default async function FinancesPage() {
  const ledgerData = await getLandlordLedger();
  const activeLeases = await getActiveLeases();

  // Calculate total revenue collected
  const totalRevenue = ledgerData.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 mt-4">
      
      {/* Back to Dashboard Navigation */}
      <div className="mb-4">
        <Link 
          href="/mgmt/dashboard" 
          className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors flex items-center gap-1 w-fit"
        >
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Financial Ledger</h1>
          <p className="text-slate-500 mt-1">Track rent collections, M-Pesa records, and property revenue.</p>
        </div>
        
        {/* Interactive Component! */}
        <LogPaymentForm activeLeases={activeLeases} />
      </div>

      {/* Analytics Card */}
      <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl mb-8 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500 opacity-10 rounded-full blur-2xl"></div>
        <span className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-1">Total Revenue Collected</span>
        <span className="text-4xl font-black text-emerald-600">Ksh {totalRevenue.toLocaleString()}</span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-800">Transaction History</h2>
        </div>

        {ledgerData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Tenant & Property</th>
                  <th className="px-6 py-4">Method & Ref</th>
                  <th className="px-6 py-4 text-right">Amount (Ksh)</th>
                  <th className="px-6 py-4 text-right">Actions</th> {/* NEW: Actions Header */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerData.map((payment) => (
                  <tr key={payment.paymentId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                      {new Date(payment.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{payment.tenantName}</p>
                      <p className="text-xs text-slate-500">{payment.propertyTitle}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase
                        ${payment.method === 'm-pesa' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}
                      `}>
                        {payment.method === 'm-pesa' ? '🟢 M-PESA' : '🏦 BANK'}
                      </span>
                      {payment.reference && (
                        <p className="text-xs text-slate-500 mt-1 font-mono">{payment.reference}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className="text-base font-black text-slate-800">
                        {payment.amount.toLocaleString()}
                      </span>
                    </td>
                    
                    {/* NEW: Payment Actions Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentActions payment={{
                        id: payment.paymentId,
                        amount: payment.amount,
                        method: payment.method || "m-pesa",
                        reference: payment.reference
                      }} />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No payments recorded yet</h3>
            <p className="text-slate-500 mb-6">When tenants pay rent, log it here to build your ledger.</p>
          </div>
        )}
      </div>
    </div>
  );
}