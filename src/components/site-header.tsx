"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { useOfficeSession } from "@/components/cinc/office-session";
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

const AGENT_MENU = [
  { href: "/dashboard/spa#launchpad/agent", label: "Dashboard", icon: "dashboard" },
  { href: "/seller/homepulse", label: "HomePulse", icon: "homepulse" },
  { href: "/notebook", label: "My Notebook", icon: "notebook" },
  { href: "/dashboard/spa#settings/profile/profile", label: "Settings", icon: "settings" },
] as const;

function AgentIcon({ name }: { name: (typeof AGENT_MENU)[number]["icon"] | "logout" }) {
  const common = "h-4 w-4 shrink-0 text-[#4a5560]";
  if (name === "dashboard") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M3 10.5a5 5 0 1 1 10 0" />
        <path d="M8 10.5 10.5 6.5" />
        <path d="M3 13.5h10" />
      </svg>
    );
  }
  if (name === "homepulse") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M2 11.5 5.2 7.8l2.2 2.4 2.3-4.2L14 9" />
        <path d="M2 13.5h12" />
      </svg>
    );
  }
  if (name === "notebook") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <path d="M4 2.5h7.5v11H4z" />
        <path d="M6 2.5v11M6.8 5.5h3.2M6.8 8h3.2" />
      </svg>
    );
  }
  if (name === "settings") {
    return (
      <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
        <circle cx="8" cy="8" r="2" />
        <path d="M8 2.2v1.6M8 12.2v1.6M2.2 8h1.6M12.2 8h1.6M3.8 3.8l1.1 1.1M11.1 11.1l1.1 1.1M12.2 3.8l-1.1 1.1M4.9 11.1l-1.1 1.1" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M6.5 3.5H3.5v9h3" />
      <path d="M7 8h6.2M11 5.5 13.5 8 11 10.5" />
    </svg>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { ready, user, signOut } = useDemoAuth();
  const office = useOfficeSession();
  const agent = office.user;
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
          {ready && user && !agent && (
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
          {agent ? (
            <div className="relative">
              <button
                type="button"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setMoreOpen(false);
                }}
                className="inline-flex max-w-[220px] items-center gap-1 px-3 text-[12px] font-bold tracking-[1px] text-[#1976d2] uppercase"
              >
                <span className="truncate">{agent.name}</span>
                <svg width="8" height="5" viewBox="0 0 8 6" aria-hidden className="shrink-0">
                  <path d="M0 0h8L4 6z" fill="#1976d2" />
                </svg>
              </button>
              {accountOpen ? (
                <div className="absolute top-full right-0 z-50 min-w-[220px] border border-[#e6e6e6] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                  {AGENT_MENU.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={close}
                      className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold tracking-[0.08em] text-[#333] uppercase hover:bg-[#f4f7f8]"
                    >
                      <AgentIcon name={item.icon} />
                      {item.label}
                    </Link>
                  ))}
                  <form action="/api/agent/logout" method="post" onSubmit={() => signOut()}>
                    <input type="hidden" name="next" value="/" />
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[12px] font-bold tracking-[0.08em] text-[#333] uppercase hover:bg-[#f4f7f8]"
                    >
                      <AgentIcon name="logout" />
                      Logout
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          ) : ready && user ? (
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
            {agent
              ? AGENT_MENU.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="flex items-center gap-3 border-b border-white/15 py-3 text-[12px] font-bold tracking-[1px] !text-white uppercase"
                  >
                    {item.label}
                  </Link>
                ))
              : null}
            {agent ? (
              <form action="/api/agent/logout" method="post" onSubmit={() => signOut()}>
                <input type="hidden" name="next" value="/" />
                <button type="submit" className="py-3 text-left text-[12px] font-bold tracking-[1px] uppercase">
                  Logout
                </button>
              </form>
            ) : null}
            {!agent && user &&
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
            {!agent && user ? (
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
            ) : !agent ? (
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
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}
