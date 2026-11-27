"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useOfficeSession } from "@/components/cinc/office-session";
import { AuthModalProvider } from "@/components/auth-modal";
import { CompareTray } from "@/components/compare-tray";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site";

function WelcomeToast() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (sessionStorage.getItem("gvhs-welcome") !== "1") return;
      sessionStorage.removeItem("gvhs-welcome");
      queueMicrotask(() => setShow(true));
      const timer = window.setTimeout(() => setShow(false), 6000);
      return () => window.clearTimeout(timer);
    } catch {
      return undefined;
    }
  }, []);
  if (!show) return null;
  return (
    <p role="status" className="fixed top-4 left-1/2 z-[90] -translate-x-1/2 bg-[#04427d] px-4 py-3 text-sm text-white shadow">
      You&apos;re all set, check your inbox
    </p>
  );
}

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const office = useOfficeSession();
  const isAgent =
    pathname.startsWith("/agent") ||
    pathname.startsWith("/dashboard/spa") ||
    pathname.startsWith("/dashboard/sellersuite") ||
    pathname.startsWith("/dashboard/landing") ||
    pathname.startsWith("/dashboard/settings") ||
    pathname.startsWith("/dashboard/pages");

  if (isAgent) {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  const adLanding = pathname === "/start" || (pathname.startsWith("/lp/") && pathname !== "/lp/home-value");
  if (adLanding) {
    return (
      <AuthModalProvider>
        <WelcomeToast />
        <CookieBanner />
        <header className="border-b border-[#e6ebef] bg-white">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
            <Link href="/" className="truncate text-[15px] font-semibold text-[#04427d]">
              {SITE.company}
            </Link>
            <a href={`tel:${SITE.phoneTel}`} className="shrink-0 whitespace-nowrap text-[15px] font-semibold text-[#04427d]">
              {SITE.phoneDisplay}
            </a>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1">{children}</main>
        <footer className="border-t border-[#e6ebef] px-4 py-6 text-center text-[12px] leading-relaxed text-[#5c6770]">
          <p>{SITE.company} · RE/MAX Crest Realty Westside · {SITE.addressLine}, {SITE.cityLine}</p>
          <p className="mt-2">
            <Link href="/privacy" className="underline">Privacy</Link>
            {" · "}
            <Link href="/terms" className="underline">Terms</Link>
            {" · "}
            <Link href="/disclaimer" className="underline">Disclaimer</Link>
          </p>
        </footer>
      </AuthModalProvider>
    );
  }

  return (
    <AuthModalProvider>
      <WelcomeToast />
      <div className={office.impersonating ? "pt-10" : undefined}>
        <SiteHeader />
      </div>
      <main id="main" tabIndex={-1} className="flex-1">{children}</main>
      <SiteFooter />
      <CompareTray />
      <CookieBanner />
    </AuthModalProvider>
  );
}
