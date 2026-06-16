import React from "react";
import { getPropertyById } from "../../../../../../lib/actions/properties"; // Double check this relative path!
import EditPropertyForm from "../../../../../../components/EditPropertyForm"; // Double check this relative path!
import { notFound } from "next/navigation";

interface EditPageProps {
  params: {
    id: string;
  };
}

export default async function EditPropertyPage({ params }: EditPageProps) {
  // 1. Fetch the data securely on the server
  const property = await getPropertyById(params.id);

  // 2. If someone types a random ID in the URL, show a 404
  if (!property) {
    notFound();
  }

  // 3. Pass the valid data to the interactive client form
  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-10">
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-800">Edit Property</h1>
        <p className="text-slate-500 text-sm mt-2">
          Update the details for your listing.
        </p>
      </div>

      {/* Render the client component, passing down the fetched data */}
      <EditPropertyForm property={property} />
    </div>
  );
}