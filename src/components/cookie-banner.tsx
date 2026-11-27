"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADS_CONSENT_KEY, writeConsentCookie } from "@/lib/ads-consent";

const KEY = ADS_CONSENT_KEY;

type Choice = "all" | "essential";

function remember(choice: Choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* ignore */
  }
  writeConsentCookie(choice);
  const granted = choice === "all";
  const state = granted ? "granted" : "denied";
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === "function") {
    gtag("consent", "update", {
      ad_storage: state,
      ad_user_data: state,
      ad_personalization: state,
      analytics_storage: state,
    });
  }
  const capture = (window as Window & { __gvhsCaptureAds?: () => void }).__gvhsCaptureAds;
  if (granted && typeof capture === "function") capture();
  window.dispatchEvent(new Event("gvhs-consent"));
}

export function CookieBanner() {
  const pathname = usePathname() || "/";
  const inFlow = pathname === "/start" || pathname.startsWith("/lp/");
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
      className={
        inFlow
          ? "bg-[#1f2930] px-4 py-3 text-[13px] leading-snug text-white"
          : "fixed inset-x-0 bottom-0 z-[80] bg-[#1f2930] px-4 py-3 text-[13px] leading-snug text-white"
      }
    >
      <div className="mx-auto flex max-w-[1170px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Advertising cookies stay off until you accept.{" "}
          <Link href="/privacy" className="!text-white underline">
            Privacy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              remember("essential");
              setShow(false);
            }}
            className="h-10 border border-white/40 px-4 text-sm font-semibold text-white"
          >
            Essential only
          </button>
          <button
            type="button"
            id="accept-cookie-notification"
            onClick={() => {
              remember("all");
              setShow(false);
            }}
            className="h-10 bg-white px-4 text-sm font-semibold text-[#1f2930]"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
