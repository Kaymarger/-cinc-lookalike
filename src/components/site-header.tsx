"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { useDemoAuth } from "@/lib/demo-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/search", label: "Search Homes" },
  { href: "/featured", label: "Featured" },
  { href: "/about", label: "About" },
  { href: "/contact#inquiry", label: "Contact" },
  { href: "/seller/homeestimate", label: "Home Estimate" },
];

const ACCOUNT = [
  { href: "/my-properties", label: "My Properties" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/seller/homepulse", label: "HomePulse" },
  { href: "/notebook", label: "My Notebook" },
  { href: "/account/settings", label: "Settings" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { ready, user, signOut } = useDemoAuth();
  const { openSignup } = useAuthModal();

  function close() {
    setMenuOpen(false);
    setMoreOpen(false);
    setAccountOpen(false);
  }

  return (
    <header id="header" className="sticky top-0 z-50 border-t-4 border-[#1976d2] bg-white">
      <div className="mx-auto flex min-h-[64px] max-w-[1170px] items-center gap-2 px-3 sm:px-4">
        <button
          type="button"
          id="header-icon"
          className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1.5 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span className="block h-0.5 w-5 bg-[#1f2930]" />
          <span className="block h-0.5 w-5 bg-[#1f2930]" />
          <span className="block h-0.5 w-5 bg-[#1f2930]" />
        </button>

        <Link href="/" className="shrink-0" onClick={close}>
          <Image
            src="/brand/site-logo.png"
            alt="Greater Vancouver Area Home Search"
            width={200}
            height={46}
            className="h-9 w-auto sm:h-11"
            priority
          />
        </Link>

        <nav className="ml-auto hidden items-center lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-3 text-[12px] font-bold tracking-[1px] text-[#1f2930] uppercase hover:text-[#1976d2]"
            >
              {item.label}
            </Link>
          ))}
          {ready && user && (
            <div className="relative">
              <button
                type="button"
                aria-label="A dropdown tab for more site navigation options"
                onClick={() => {
                  setMoreOpen((v) => !v);
                  setAccountOpen(false);
                }}
                className="px-3 py-3 text-[12px] font-bold tracking-[1px] text-[#1f2930] uppercase"
              >
                More
              </button>
              {moreOpen && (
                <div className="absolute top-full left-0 z-50 min-w-[200px] border border-[#dbe3e8] bg-white py-1 shadow-lg">
                  <Link href="/my-properties" className="block px-4 py-2 text-sm text-[#1f2930] hover:bg-[#ebeff2]" onClick={close}>
                    My Properties
                  </Link>
                  <Link href="/alerts" className="block px-4 py-2 text-sm text-[#1f2930] hover:bg-[#ebeff2]" onClick={close}>
                    Saved Searches
                  </Link>
                  <Link href="/compare" className="block px-4 py-2 text-sm text-[#1f2930] hover:bg-[#ebeff2]" onClick={close}>
                    Compare
                  </Link>
                  <Link href="/mortgage" className="block px-4 py-2 text-sm text-[#1f2930] hover:bg-[#ebeff2]" onClick={close}>
                    Mortgage
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="ml-2 hidden items-center lg:flex">
          {ready && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setMoreOpen(false);
                }}
                className="max-w-[200px] truncate px-3 text-[12px] font-bold tracking-[1px] text-[#1f2930] uppercase"
              >
                {user.name}
              </button>
              {accountOpen && (
                <div className="absolute top-full right-0 z-50 min-w-[200px] border border-[#dbe3e8] bg-white py-1 shadow-lg">
                  {ACCOUNT.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="block px-4 py-2 text-sm text-[#1f2930] hover:bg-[#ebeff2]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    className="block w-full px-4 py-2 text-left text-sm text-[#1f2930] hover:bg-[#ebeff2]"
                    onClick={() => {
                      signOut();
                      close();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              <button
                type="button"
                onClick={openSignup}
                className="px-3 py-3 text-[12px] font-bold tracking-[1px] text-[#1f2930] uppercase hover:text-[#1976d2]"
              >
                Log In
              </button>
              <button
                type="button"
                onClick={openSignup}
                className="border-2 border-[#1976d2] px-3 py-1.5 text-[12px] font-bold tracking-[1px] text-[#1f2930] uppercase hover:border-[#145ca4]"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="bg-[#1976d2] px-4 py-4 text-white lg:hidden">
          <nav className="flex flex-col">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="border-b border-white/15 py-3 text-[12px] font-bold tracking-[1px] !text-white uppercase"
              >
                {item.label}
              </Link>
            ))}
            {user &&
              ACCOUNT.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="border-b border-white/15 py-3 text-[12px] font-bold tracking-[1px] !text-white uppercase"
                >
                  {item.label}
                </Link>
              ))}
            {user ? (
              <button
                type="button"
                className="py-3 text-left text-[12px] font-bold tracking-[1px] uppercase"
                onClick={() => {
                  signOut();
                  close();
                }}
              >
                Logout
              </button>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openSignup();
                  }}
                  className={cn("border border-white px-3 py-2 text-[12px] font-bold tracking-[1px] uppercase")}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    openSignup();
                  }}
                  className="border border-white px-3 py-2 text-[12px] font-bold tracking-[1px] uppercase"
                >
                  Sign up
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
