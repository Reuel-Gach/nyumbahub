"use client";

import React, { useState } from "react";

interface ImageGalleryProps {
  coverImage: string | null;
  gallery: string[] | null;
  title: string;
}

export default function ImageGallery({ coverImage, gallery, title }: ImageGalleryProps) {
  // Combine cover image and gallery into one array. Remove any null/empty values.
  const allImages = [coverImage, ...(gallery || [])].filter(Boolean) as string[];

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  // If there are no images at all, show the fallback placeholder
  if (allImages.length === 0) {
    return (
      <div className="w-full h-72 md:h-96 bg-slate-200 rounded-2xl border border-slate-300 flex items-center justify-center overflow-hidden">
        <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // If there's only 1 image, just show it (no arrows needed)
  if (allImages.length === 1) {
    return (
      <div className="w-full h-72 md:h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-sm">
        <img src={allImages[0]} alt={title} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-72 md:h-[500px] bg-slate-900 rounded-2xl overflow-hidden shadow-sm group">
      {/* Main Image */}
      <img
        key={currentIndex} // Adding key forces a tiny re-render for smooth feeling
        src={allImages[currentIndex]}
        alt={`${title} - Image ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Left Arrow */}
      <button
        onClick={prevImage}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full backdrop-blur-sm shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Previous image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
      </button>

      {/* Right Arrow */}
      <button
        onClick={nextImage}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 p-2 rounded-full backdrop-blur-sm shadow-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label="Next image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {allImages.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all shadow-sm ${
              idx === currentIndex ? "bg-white scale-125" : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to image ${idx + 1}`}
          />
        ))}
      </div>
      
      {/* Counter Badge */}
      <div className="absolute top-4 right-4 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
        {currentIndex + 1} / {allImages.length}
      </div>
    </div>
  );
}