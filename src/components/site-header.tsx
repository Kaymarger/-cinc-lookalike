"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Heart, Menu, X } from "lucide-react";
import { useDemoAuth } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/search", label: "Search" },
  { href: "/featured", label: "Featured" },
  { href: "/seller/homeestimate/homevaluation", label: "Home value" },
  { href: "/about", label: "About" },
];

const moreLinks = [
  { href: "/buying", label: "Buying guide" },
  { href: "/selling", label: "Selling guide" },
  { href: "/neighborhoods", label: "Neighbourhoods" },
  { href: "/open-houses", label: "Open houses" },
  { href: "/mortgage", label: "Mortgage calculator" },
  { href: "/alerts", label: "Saved searches" },
  { href: "/compare", label: "Compare" },
  { href: "/recently-viewed", label: "Recently viewed" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { ready, user } = useDemoAuth();

  return (
    <header
      id="header"
      className="sticky top-0 z-50 border-b border-[#e8eef3] bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
          <Image
            src="/brand/archibald-logo.png"
            alt="Archibald Real Estate Group"
            width={200}
            height={46}
            className="h-9 w-auto sm:h-10"
            priority
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-[#1f2930] hover:bg-[#edf5fd] hover:text-[var(--cedar-deep)]"
            >
              {item.label}
            </Link>
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              onBlur={() => window.setTimeout(() => setMoreOpen(false), 150)}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-[#1f2930] hover:bg-[#edf5fd] hover:text-[var(--cedar-deep)]"
            >
              More
              <ChevronDown className="size-3.5" />
            </button>
            {moreOpen && (
              <div className="absolute top-full left-0 z-50 mt-1 min-w-[220px] rounded-xl border border-[#e5e5e5] bg-white py-2 shadow-lg">
                {moreLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-sm text-[#333] hover:bg-[#edf5fd] hover:text-[var(--cedar)]"
                    onClick={() => setMoreOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/saved"
            aria-label="Saved homes"
            className="inline-flex size-10 items-center justify-center rounded-full text-[var(--cedar)] hover:bg-[#edf5fd]"
          >
            <Heart className="size-5" strokeWidth={1.75} />
          </Link>

          {ready && user ? (
            <Link
              href="/account"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#1f2930] hover:bg-[#edf5fd] sm:inline-flex"
            >
              Hi, {user.name.split(" ")[0]}
            </Link>
          ) : (
            <>
              <Link
                href="/account/login"
                className="hidden rounded-full px-3 py-2 text-sm font-medium text-[#1f2930] hover:bg-[#edf5fd] sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/account/register"
                className="inline-flex h-9 items-center rounded-full bg-[var(--cedar)] px-3.5 text-sm font-semibold !text-white shadow-sm hover:brightness-95 hover:!text-white sm:h-10 sm:px-4"
              >
                Sign up
              </Link>
            </>
          )}

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-full text-[#333] hover:bg-[#f3f6f8] lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-[#eef2f5] bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-1">
            {[...nav, ...moreLinks].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-[#222] hover:bg-[#edf5fd]"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={user ? "/account" : "/account/login"}
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-lg bg-[#edf5fd] px-3 py-3 text-base font-semibold text-[var(--cedar-deep)]"
            >
              {user ? "My account" : "Log in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
