"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ADS_CONSENT_KEY, writeConsentCookie } from "@/lib/ads-consent";

const KEY = ADS_CONSENT_KEY;

type Choice = "all" | "opt-out";

function remember(choice: Choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* ignore */
  }
  writeConsentCookie(choice);
  const granted = choice === "all";
  const state = granted ? "granted" : "denied";
  (window as Window & { __gvhsAdsOptOut?: boolean }).__gvhsAdsOptOut = !granted;
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (!granted && typeof fbq === "function") {
    try {
      fbq("consent", "revoke");
    } catch {
      /* ignore */
    }
    (window as Window & { fbq?: (...args: unknown[]) => void }).fbq = () => undefined;
  }
  const capture = (window as Window & { __gvhsCaptureAds?: () => void }).__gvhsCaptureAds;
  if (granted && typeof capture === "function") capture();
  window.dispatchEvent(new Event("gvhs-consent"));
}

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        if (!localStorage.getItem(KEY)) setShow(true);
      } catch {
        setShow(true);
      }
    });
  }, []);

  if (!show) return null;

  return (
    <div
      id="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-[#e6ebef] bg-white px-3 py-2 text-[13px] leading-snug text-[#1f2930] shadow-[0_-1px_4px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex max-w-[1170px] flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p>
          We use cookies to improve your experience and measure our ads. See our{" "}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        <div className="flex items-center gap-4">
          <a
            href="#opt-out"
            onClick={(event) => {
              event.preventDefault();
              remember("opt-out");
              setShow(false);
            }}
            className="underline"
          >
            Opt out
          </a>
          <button
            type="button"
            id="accept-cookie-notification"
            onClick={() => {
              remember("all");
              setShow(false);
            }}
            className="h-8 bg-[#04427d] px-3 text-[13px] font-semibold text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
