"use client";

import { useEffect } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { useDemoAuth } from "@/lib/demo-auth";

const KEY = "gvhs-listing-views";
const LIMIT = 3;

/** Opens registration after a few listing views, the way CINC gates full access. */
export function ViewGate({ propertyId }: { propertyId: string }) {
  const { ready, user } = useDemoAuth();
  const { openSignup } = useAuthModal();

  useEffect(() => {
    if (!ready || user) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
    } catch {
      seen = [];
    }
    if (!seen.includes(propertyId)) seen = [...seen, propertyId].slice(-40);
    localStorage.setItem(KEY, JSON.stringify(seen));
    if (seen.length >= LIMIT) openSignup();
  }, [openSignup, propertyId, ready, user]);

  return null;
}
