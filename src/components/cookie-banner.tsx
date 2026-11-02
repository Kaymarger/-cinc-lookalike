"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const KEY = "gvhs-cookies-accepted";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div
      id="cookie-banner"
      className="fixed inset-x-0 bottom-0 z-[80] bg-black/90 px-4 py-3 text-[13px] leading-snug text-white"
    >
      <div className="mx-auto flex max-w-[1170px] items-center justify-between gap-3">
        <p>
          We use cookies to run this site.{" "}
          <Link href="/privacy" className="!text-white underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          id="accept-cookie-notification"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
          className="h-10 shrink-0 bg-[#1976d2] px-6 text-sm font-bold tracking-[1px] text-white uppercase hover:bg-[#145ca4]"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
