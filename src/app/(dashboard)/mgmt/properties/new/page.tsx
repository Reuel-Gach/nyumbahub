"use client";

import React, { useState, useRef } from "react";
import { createProperty } from "../../../../../lib/actions/properties";
import { UploadDropzone } from "../../../../../utils/uploadthing";
import { getCategories, getSubTypesByCategory, PropertyCategory } from "../../../../../lib/constants/propertyTypes"; // <-- NEW IMPORT

export default function NewPropertyPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 🔥 NEW: State to track selected category for the cascading dropdown
  const [selectedCategory, setSelectedCategory] = useState<PropertyCategory>("Residential");
  
  // Refs for tracking image URLs synchronously
  const imageUrlRef = useRef<string>("");
  const galleryUrlsRef = useRef<string[]>([]);
  
  // State JUST for triggering a re-render to show previews
  const [, setTriggerRender] = useState(0); 
  
  const formRef = useRef<HTMLFormElement>(null);

  const removeGalleryImage = (indexToRemove: number) => {
    galleryUrlsRef.current = galleryUrlsRef.current.filter((_, idx) => idx !== indexToRemove);
    setTriggerRender(p => p + 1);
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); 
    
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      
      formData.set("imageUrl", imageUrlRef.current);
      
      formData.delete("gallery");
      galleryUrlsRef.current.forEach((url) => {
        formData.append("gallery", url);
      });
      
      await createProperty(formData);
      
      setShowSuccess(true);
      
      imageUrlRef.current = ""; 
      galleryUrlsRef.current = []; 
      setTriggerRender(prev => prev + 1); 
      formRef.current?.reset(); 
      // Reset dropdown to default
      setSelectedCategory("Residential");
      
      setTimeout(() => setShowSuccess(false), 4000);
    } catch (error) {
      console.error("Property creation error:", error);
      alert("Failed to post property. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-slate-100 mt-10 mb-20">
      
      <div className="mb-8 border-b border-slate-100 pb-6">
        <h1 className="text-2xl font-bold text-slate-800">List a New Property</h1>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-3">
          <span className="font-medium">Property posted successfully!</span>
        </div>
      )}

      {/* 1. COVER IMAGE UPLOAD */}
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <label className="block text-sm font-bold text-slate-700 mb-1">Cover Photo *</label>
        <p className="text-xs text-slate-500 mb-4">This is the main image tenants will see in the search results.</p>
        
        {imageUrlRef.current ? (
          <div className="relative w-full h-64 rounded-xl overflow-hidden border border-emerald-200 shadow-sm">
            <img src={imageUrlRef.current} alt="Cover preview" className="w-full h-full object-cover" />
            <button 
              type="button" 
              onClick={() => { imageUrlRef.current = ""; setTriggerRender(p => p + 1); }}
              className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors"
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
                setTriggerRender(p => p + 1);
              }
            }}
            onUploadError={(e) => alert(`Upload failed: ${e.message}`)}
            className="ut-button:bg-blue-600 p-8 border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 transition-colors"
          />
        )}
      </div>

      {/* 2. GALLERY IMAGES UPLOAD */}
      <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
        <div className="flex justify-between items-end mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Gallery Images</label>
            <p className="text-xs text-slate-500">Add interior shots, the kitchen, bathroom, or parking.</p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-md">
            {galleryUrlsRef.current.length} added
          </span>
        </div>
        
        {galleryUrlsRef.current.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            {galleryUrlsRef.current.map((url, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeGalleryImage(index)}
                  className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/80 text-transparent group-hover:text-white flex items-center justify-center font-bold text-sm transition-all"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <UploadDropzone
          endpoint="propertyImage"
          onClientUploadComplete={(res) => {
            if (res && res.length > 0) {
              const newUrls = res.map((r) => r.url);
              galleryUrlsRef.current = [...galleryUrlsRef.current, ...newUrls];
              setTriggerRender(p => p + 1);
            }
          }}
          onUploadError={(e) => alert(`Upload failed: ${e.message}`)}
          className="ut-button:bg-slate-800 p-4 border-2 border-dashed border-slate-300 bg-white"
        />
      </div>

      {/* 3. FORM SECTION */}
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Property Title *</label>
          <input type="text" name="title" required placeholder="e.g. Modern 2-Bedroom in Kilimani" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
        </div>

        {/* 🔥 NEW: Category and Sub-Type Cascading Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-blue-900">Category *</label>
            <select
              name="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PropertyCategory)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700"
            >
              {getCategories().map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-blue-900">Property Type *</label>
            <select
              name="subType"
              required
              className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-slate-700"
            >
              {getSubTypesByCategory(selectedCategory).map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Location *</label>
            <input type="text" name="location" required placeholder="e.g. Kilimani, Nairobi" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Monthly Rent (Ksh) *</label>
            <input type="number" name="pricePerMonth" required placeholder="e.g. 45000" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea name="description" rows={5} placeholder="Describe the amenities, security, water availability..." className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"></textarea>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !imageUrlRef.current}
          className={`w-full text-white font-bold py-4 px-4 rounded-xl shadow-sm transition-all
            ${isSubmitting || !imageUrlRef.current 
              ? 'bg-slate-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
        >
          {isSubmitting ? "Posting Property..." : "Publish Property Listing"}
        </button>
      </form>
    </div>
  );
}