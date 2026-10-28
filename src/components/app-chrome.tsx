"use client";

import { usePathname } from "next/navigation";
import { useOfficeSession } from "@/components/cinc/office-session";
import { AuthModalProvider } from "@/components/auth-modal";
import { CompareTray } from "@/components/compare-tray";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const office = useOfficeSession();
  const isAgent =
    pathname.startsWith("/agent") ||
    pathname.startsWith("/dashboard/spa") ||
    pathname.startsWith("/dashboard/sellersuite") ||
    pathname.startsWith("/dashboard/landing");

  if (isAgent) {
    return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
  }

  return (
    <AuthModalProvider>
      <div className={office.impersonating ? "pt-10" : undefined}>
        <SiteHeader />
      </div>
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <CompareTray />
      <CookieBanner />
    </AuthModalProvider>
  );
}
