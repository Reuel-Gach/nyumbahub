"use client";

import React, { useState, useRef } from "react";
import { createProperty } from "../../../../../lib/actions/properties";
import { UploadDropzone } from "../../../../../utils/uploadthing";

export default function NewPropertyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Use a ref for the URL to ensure it is always synchronous/up-to-date
  const imageUrlRef = useRef<string>("");
  // We use this state JUST for triggering a re-render to show the preview
  const [, setTriggerRender] = useState(0); 
  
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      // Get the value directly from the ref, not state
      formData.set("imageUrl", imageUrlRef.current);
      
      await createProperty(formData);
      
      setShowSuccess(true);
      imageUrlRef.current = ""; // Clear the ref
      setTriggerRender(prev => prev + 1); // Force re-render to clear UI
      formRef.current?.reset(); 
      
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error("Property creation error:", error);
      alert("Failed to post property. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-10">
      
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-800">List a New Property</h1>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-3">
          <span className="font-medium">Property posted successfully!</span>
        </div>
      )}

      {/* IMAGE UPLOAD SECTION */}
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-4">Property Photo *</label>
        
        {imageUrlRef.current ? (
          <div className="relative w-full h-64 rounded-xl overflow-hidden border border-emerald-200">
            <img src={imageUrlRef.current} alt="preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => { imageUrlRef.current = ""; setTriggerRender(p => p + 1); }}
              className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full"
            >
              Remove
            </button>
          </div>
        ) : (
          <UploadDropzone
            endpoint="propertyImage"
            onClientUploadComplete={(res) => {
              if (res && res[0]) {
                imageUrlRef.current = res[0].url;
                setTriggerRender(p => p + 1); // Trigger UI update
              }
            }}
            onUploadError={(e) => alert(`Upload failed: ${e.message}`)}
            className="ut-button:bg-blue-600 p-8 border-2 border-dashed border-slate-300 bg-white"
          />
        )}
      </div>

      {/* FORM SECTION */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="imageUrl" value={imageUrlRef.current} />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Property Title *</label>
          <input type="text" name="title" required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Location *</label>
            <input type="text" name="location" required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Monthly Rent (Ksh) *</label>
            <input type="number" name="pricePerMonth" required className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea name="description" rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg"></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !imageUrlRef.current}
          className={`w-full text-white font-semibold py-3 px-4 rounded-lg ${isSubmitting || !imageUrlRef.current ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSubmitting ? "Posting..." : "Post Property"}
        </button>
      </form>
    </div>
  );
}