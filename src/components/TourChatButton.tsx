"use client";

import React, { useState } from "react";
import TourChatModal from "./TourChatModal";
import UnreadBadge from "./UnreadBadge"; // <-- NEW IMPORT

export default function TourChatButton({ 
  tour, 
  currentUserId 
}: { 
  tour: any; 
  currentUserId: string; 
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-full sm:w-auto relative"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
        Open Chat
        
        {/* <-- THE NEW NOTIFICATION BADGE --> */}
        <UnreadBadge tourId={tour.id} currentUserId={currentUserId} /> 
      </button>

      {isOpen && (
        <TourChatModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          tourId={tour.id}
          propertyTitle={tour.propertyTitle}
          tourDate={tour.tourDate}
          status={tour.status}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}