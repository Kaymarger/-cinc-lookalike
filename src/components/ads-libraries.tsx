"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/** Loads gtag.js on idle or as soon as a signup needs it. lazyOnload avoids a head preload. */
export function AdsLibraries({ tagId }: { tagId: string }) {
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const start = () => {
      if ((window as Window & { __gvhsAdsOptOut?: boolean }).__gvhsAdsOptOut) return;
      queueMicrotask(() => setLoad(true));
    };
    const idle = window.requestIdleCallback?.(start, { timeout: 2500 });
    const timer = idle == null ? window.setTimeout(start, 1200) : undefined;
    window.addEventListener("gvhs-consent", start);
    window.addEventListener("gvhs-load-ads", start);
    return () => {
      if (idle != null && window.cancelIdleCallback) window.cancelIdleCallback(idle);
      if (timer != null) window.clearTimeout(timer);
      window.removeEventListener("gvhs-consent", start);
      window.removeEventListener("gvhs-load-ads", start);
    };
  }, []);

  if (!load || !tagId) return null;
  return <Script src={`https://www.googletagmanager.com/gtag/js?id=${tagId}`} strategy="lazyOnload" />;
}
