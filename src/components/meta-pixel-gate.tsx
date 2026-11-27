"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ADS_CONSENT_REQUIRED, consentGrantedInBrowser } from "@/lib/ads-consent";
import { isPublicLeadPath } from "@/lib/meta-pixel-events";

const MetaPixel = dynamic(() => import("@/components/meta-pixel").then((mod) => mod.MetaPixel));

/** Loads the pixel on the public site unless this visitor has opted out. */
export function MetaPixelGate() {
  const pathname = usePathname() || "/";
  const [allowed, setAllowed] = useState(() => !ADS_CONSENT_REQUIRED);

  useEffect(() => {
    const sync = () => setAllowed(consentGrantedInBrowser());
    queueMicrotask(sync);
    window.addEventListener("gvhs-consent", sync);
    return () => window.removeEventListener("gvhs-consent", sync);
  }, []);

  if (!isPublicLeadPath(pathname) || !allowed) return null;
  return <MetaPixel />;
}
