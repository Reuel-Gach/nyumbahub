"use client";

import React, { useState } from "react";
import { updateProperty } from "../lib/actions/properties";

// We define the shape of the data we expect from the database
interface EditFormProps {
  propertyId: string;
  initialData: {
    title: string;
    location: string;
    pricePerMonth: number;
    description: string | null;
  };
}

export default function EditPropertyForm({ propertyId, initialData }: EditFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // We bind the ID to the server action so it knows which row to update
  const updateWithId = updateProperty.bind(null, propertyId);

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      // Execute the server action
      await updateWithId(formData);
      
      // Trigger success state
      setShowSuccess(true);
      
      // Hide the success banner after 4 seconds
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error(error);
      alert("Failed to update property. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      {/* Success Banner */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-4 shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          <span className="font-medium">Changes saved successfully!</span>
        </div>
      )}

      {/* The Form */}
      <form action={handleSubmit} className="space-y-6">
        
        {/* Title Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Property Title</label>
          <input 
            name="title" 
            defaultValue={initialData.title} 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
            required 
          />
        </div>

        {/* Location & Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Location</label>
            <input 
              name="location" 
              defaultValue={initialData.location} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              required 
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Monthly Rent (Ksh)</label>
            <input 
              name="pricePerMonth" 
              type="number" 
              defaultValue={initialData.pricePerMonth} 
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
              required 
            />
          </div>
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea 
            name="description" 
            defaultValue={initialData.description || ""} 
            rows={4} 
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y" 
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm flex justify-center items-center gap-2
              ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>

      </form>
    </div>
  );
}