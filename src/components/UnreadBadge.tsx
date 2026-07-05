"use client";

import React, { useEffect, useState } from "react";
import { getUnreadCountForTour } from "@/lib/actions/messages";

export default function UnreadBadge({ tourId, currentUserId }: { tourId: string; currentUserId: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 1. Fetch immediately on mount
    getUnreadCountForTour(tourId, currentUserId).then(setCount);

    // 2. Poll every 10 seconds for that "real-time" feel
    const interval = setInterval(() => {
      getUnreadCountForTour(tourId, currentUserId).then(setCount);
    }, 10000);

    return () => clearInterval(interval);
  }, [tourId, currentUserId]);

  if (count === 0) return null; // Hide the badge if there are no new messages

  return (
    <span className="flex items-center justify-center w-5 h-5 ml-2 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm animate-pulse">
      {count > 9 ? "9+" : count}
    </span>
  );
}