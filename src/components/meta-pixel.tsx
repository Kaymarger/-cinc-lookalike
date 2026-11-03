"use client";

import { Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { isPublicLeadPath, metaPixelId, pixelEventsForLead, safeSearchString } from "@/lib/meta-pixel";
import type { SearchFilters } from "@/lib/types";

type Fbq = (...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fn = (window as Window & { fbq?: Fbq }).fbq;
  return typeof fn === "function" ? fn : null;
}

export function trackMeta(event: string, params?: Record<string, string | string[]>) {
  const track = fbq();
  if (!track) return;
  if (params) track("track", event, params);
  else track("track", event);
}

export function trackStoredLead(source: string) {
  for (const item of pixelEventsForLead(source)) trackMeta(item.event, item.params);
}

function PageViews() {
  const pathname = usePathname() || "/";
  const search = useSearchParams().toString();
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!isPublicLeadPath(pathname)) return;
    const key = `${pathname}?${search}`;
    const first = seen.current === null;
    if (seen.current === key) return;
    seen.current = key;
    if (first) return;
    trackMeta("PageView");
  }, [pathname, search]);

  return null;
}

export function MetaPixel() {
  const pathname = usePathname() || "/";
  if (!isPublicLeadPath(pathname)) return null;
  const id = metaPixelId();
  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(id)});fbq('track','PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <PageViews />
      </Suspense>
    </>
  );
}

export function TrackPropertySearch({ filters }: { filters: SearchFilters }) {
  const key = [
    filters.q,
    filters.city,
    filters.propertyType,
    filters.beds,
    filters.baths,
    filters.minPrice,
    filters.maxPrice,
  ]
    .filter((part) => part !== undefined && part !== "")
    .join(" ");

  useEffect(() => {
    trackMeta("Search", { search_string: safeSearchString(key) });
  }, [key]);

  return null;
}
