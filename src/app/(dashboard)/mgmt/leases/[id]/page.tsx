import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { leases } from "@/db/schema/leases";
import { properties } from "@/db/schema/properties";
import { users } from "@/db/schema/users";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";

export default async function DetailedLeasePage({ params }: { params: { id: string } }) {
  const clerkUser = await currentUser();
  if (!clerkUser) return notFound();

  // Fetch the lease, including user IDs to check permissions
  const result = await db
    .select({
      id: leases.id,
      landlordId: leases.landlordId,
      tenantId: leases.tenantId,
      status: leases.status,
      startDate: leases.startDate,
      endDate: leases.endDate,
      leaseDuration: leases.leaseDuration,
      rentAmount: leases.rentAmount,
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyLocation: properties.location,
      propertyImage: properties.imageUrl,
      tenantName: users.fullName,
      tenantEmail: users.email,
    })
    .from(leases)
    .innerJoin(properties, eq(leases.propertyId, properties.id))
    .innerJoin(users, eq(leases.tenantId, users.id))
    .where(eq(leases.id, params.id))
    .limit(1);

  const lease = result[0];
  if (!lease) return notFound();

  // Check roles
  const loggedInUser = await db.select().from(users).where(eq(users.clerkId, clerkUser.id)).limit(1);
  const isLandlord = loggedInUser[0]?.id === lease.landlordId;
  const isTenant = loggedInUser[0]?.id === lease.tenantId;

  if (!isLandlord && !isTenant) return <div className="p-10 text-center">Unauthorized access.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      {/* HEADER */}
      <div className="mb-8">
        <Link href={isLandlord ? "/mgmt/dashboard" : "/dashboard"} className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2">
          &larr; Back to {isLandlord ? "Landlord" : "Tenant"} Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">{lease.propertyTitle}</h1>
        <p className="text-slate-500">{lease.propertyLocation}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* MAIN INFO */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Lease Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-500 text-xs">Rent Amount</p>
                <p className="font-bold text-lg text-emerald-600">Ksh {lease.rentAmount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Duration</p>
                <p className="font-bold text-lg">{lease.leaseDuration || "N/A"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Start Date</p>
                <p className="font-bold text-slate-800">{lease.startDate.toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">End Date</p>
                <p className="font-bold text-slate-800">{lease.endDate ? lease.endDate.toLocaleDateString() : "Month-to-Month"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* SIDEBAR - DYNAMIC CONTENT BASED ON ROLE */}
        <div className="space-y-6">
          
          {/* LANDLORD VIEW: Analytics & Management */}
          {isLandlord && (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-wider">Management Tools</h3>
              <div className="space-y-3">
                <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 rounded text-sm font-bold">Log Rent Payment</button>
                <button className="w-full py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-sm font-bold border border-rose-200">Issue Notice</button>
              </div>
            </div>
          )}

          {/* TENANT VIEW: Support & Payments */}
          {isTenant && (
            <div className="bg-white p-6 rounded-xl border border-blue-100 shadow-sm">
              <h3 className="font-bold text-blue-900 mb-4 uppercase text-xs tracking-wider">Tenant Hub</h3>
              <div className="space-y-3">
                <button className="w-full py-2 bg-blue-600 text-white hover:bg-blue-700 rounded text-sm font-bold">Pay Rent via M-Pesa</button>
                <button className="w-full py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded text-sm font-bold">Request Maintenance</button>
                <button className="w-full py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-sm font-bold">Download Lease PDF</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}