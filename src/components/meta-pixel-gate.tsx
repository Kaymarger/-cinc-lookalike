"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isPublicLeadPath } from "@/lib/meta-pixel-events";

const MetaPixel = dynamic(() => import("@/components/meta-pixel").then((mod) => mod.MetaPixel));

function adsAllowed() {
  try {
    return localStorage.getItem("gvhs-cookies") === "all";
  } catch {
    return false;
  }
}

/** Loads the pixel only on the public site, and only after advertising cookies are accepted. */
export function MetaPixelGate() {
  const pathname = usePathname() || "/";
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(adsAllowed());
    sync();
    window.addEventListener("gvhs-consent", sync);
    return () => window.removeEventListener("gvhs-consent", sync);
  }, []);

  if (!isPublicLeadPath(pathname) || !allowed) return null;
  return <MetaPixel />;
}
