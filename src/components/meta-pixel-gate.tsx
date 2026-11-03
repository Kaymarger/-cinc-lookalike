"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { isPublicLeadPath } from "@/lib/meta-pixel-events";

const MetaPixel = dynamic(() => import("@/components/meta-pixel").then((mod) => mod.MetaPixel));

/** Loads the pixel chunk only on the public lead site, including its noscript image. */
export function MetaPixelGate() {
  const pathname = usePathname() || "/";
  if (!isPublicLeadPath(pathname)) return null;
  return <MetaPixel />;
}
