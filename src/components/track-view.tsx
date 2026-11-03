"use client";

import { useEffect } from "react";
import { trackMeta } from "@/components/meta-pixel";
import { useRecentlyViewed } from "@/lib/recently-viewed";

export function TrackView({ propertyId }: { propertyId: string }) {
  const { ready, track } = useRecentlyViewed();

  useEffect(() => {
    if (!ready) return;
    track(propertyId);
  }, [propertyId, track, ready]);

  useEffect(() => {
    if (!propertyId) return;
    trackMeta("ViewContent", { content_ids: [propertyId], content_type: "home_listing" });
  }, [propertyId]);

  return null;
}
