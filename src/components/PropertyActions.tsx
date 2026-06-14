"use client";

import React, { useTransition } from "react";
import Link from "next/link";
import { deleteProperty } from "../lib/actions/properties"; 

interface PropertyActionsProps {
  propertyId: string;
}

export default function PropertyActions({ propertyId }: PropertyActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this property listing?")) {
      startTransition(async () => {
        try {
          await deleteProperty(propertyId);
        } catch (error) {
          console.error("Deletion error:", error);
          alert("Failed to delete the property. Please try again.");
        }
      });
    }
  };

  return (
    <div className="flex items-center gap-2.5 mt-2 md:mt-0">
      {/* Missing Edit Button linked to the dynamic edit subroute */}
      <Link
        href={`/mgmt/properties/${propertyId}/edit`}
        className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-center"
      >
        Edit
      </Link>

      {/* Delete button option */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className={`px-4 py-1.5 text-sm font-medium text-white rounded-lg transition-colors shadow-sm min-w-[80px]
          ${isPending ? "bg-red-300 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"}`}
      >
        {isPending ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}