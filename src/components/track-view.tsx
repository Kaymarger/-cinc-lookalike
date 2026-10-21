"use client";

import { useEffect } from "react";
import { useRecentlyViewed } from "@/lib/recently-viewed";

export function TrackView({ propertyId }: { propertyId: string }) {
  const { ready, track } = useRecentlyViewed();

  useEffect(() => {
    if (!ready) return;
    track(propertyId);
  }, [propertyId, track, ready]);

  return null;
}
