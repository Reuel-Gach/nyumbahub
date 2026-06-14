import React from "react";
// Using explicit relative paths to bypass the alias error
import { db } from "../../../../../../db";
import { properties } from "../../../../../../db/schema/properties";
import { eq } from "drizzle-orm";
import EditPropertyForm from "../../../../../../components/EditPropertyForm";

export default async function EditPropertyPage({ params }: { params: { id: string } }) {
  // Fetch existing property directly from Neon securely
  const property = await db.query.properties.findFirst({
    where: eq(properties.id, params.id),
  });

  // Fallback if someone types in a bad URL ID
  if (!property) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 text-center">
        <h2 className="text-xl font-bold text-slate-800">Property not found</h2>
        <p className="text-slate-500 mt-2">The listing you are trying to edit does not exist.</p>
      </div>
    );
  }

  // We extract only the plain text/number data needed for the form to prevent Next.js hydration errors
  const initialData = {
    title: property.title,
    location: property.location,
    pricePerMonth: property.pricePerMonth,
    description: property.description,
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-10">
      
      <div className="mb-6 border-b border-slate-100 pb-4">
        <h1 className="text-2xl font-bold text-slate-800">Edit Property</h1>
        <p className="text-sm text-slate-500 mt-1">Update the details for your listing below.</p>
      </div>

      {/* Render our new interactive Client Component and pass it the data */}
      <EditPropertyForm propertyId={property.id} initialData={initialData} />

    </div>
  );
}