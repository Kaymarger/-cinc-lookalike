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
    <div className="fixed inset-x-3 bottom-3 z-[80] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-md">
      <div className="rounded-2xl border border-[#e5eef5] bg-white p-4 shadow-xl shadow-black/10">
        <p className="text-[13px] leading-snug text-[#444]">
          We use cookies to keep your saved homes and search experience working.
          Read the{" "}
          <Link href="/privacy" className="font-medium text-[var(--cedar)] underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              localStorage.setItem(KEY, "1");
            } catch {
              /* ignore */
            }
            setShow(false);
          }}
          className="mt-3 h-10 w-full rounded-full bg-[var(--cedar)] text-sm font-semibold text-white hover:brightness-95"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
