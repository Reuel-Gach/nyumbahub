"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateProperty } from "../lib/actions/properties";
import { UploadDropzone } from "../utils/uploadthing";

// Define the shape of the incoming property data
interface EditPropertyFormProps {
  property: {
    id: string;
    title: string;
    location: string;
    pricePerMonth: number;
    description: string | null;
    imageUrl: string | null;
  };
}

export default function EditPropertyForm({ property }: EditPropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pre-fill the image ref with the existing database image
  const imageUrlRef = useRef<string>(property.imageUrl || "");
  const [, setTriggerRender] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      formData.set("imageUrl", imageUrlRef.current);
      
      await updateProperty(property.id, formData);
      
      // On success, redirect back to the dashboard immediately
      router.push("/mgmt/dashboard");
      router.refresh(); 
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update property.");
      setIsSubmitting(false); // Only stop loading if it fails, otherwise let it transition
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* IMAGE UPLOAD SECTION */}
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-4">Property Photo</label>
        
        {imageUrlRef.current ? (
          <div className="relative w-full h-64 rounded-xl overflow-hidden border border-emerald-200">
            <img src={imageUrlRef.current} alt="preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => { imageUrlRef.current = ""; setTriggerRender(p => p + 1); }}
              className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Remove & Change
            </button>
          </div>
        ) : (
          <UploadDropzone
            endpoint="propertyImage"
            onClientUploadComplete={(res) => {
              if (res && res[0]) {
                imageUrlRef.current = res[0].url;
                setTriggerRender(p => p + 1); 
              }
            }}
            onUploadError={(e) => alert(`Upload failed: ${e.message}`)}
            className="ut-button:bg-blue-600 p-8 border-2 border-dashed border-slate-300 bg-white"
          />
        )}
      </div>

      <input type="hidden" name="imageUrl" value={imageUrlRef.current} />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Property Title *</label>
        {/* Notice we use defaultValue to pre-fill the inputs! */}
        <input type="text" name="title" defaultValue={property.title} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Location *</label>
          <input type="text" name="location" defaultValue={property.location} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Monthly Rent (Ksh) *</label>
          <input type="number" name="pricePerMonth" defaultValue={property.pricePerMonth} required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea name="description" defaultValue={property.description || ""} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg"></textarea>
      </div>

      <div className="pt-4 flex gap-4">
        <button
          type="button"
          onClick={() => router.push("/mgmt/dashboard")}
          className="flex-1 bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !imageUrlRef.current}
          className={`flex-1 text-white font-semibold py-3 px-4 rounded-lg ${isSubmitting || !imageUrlRef.current ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSubmitting ? "Saving Changes..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}