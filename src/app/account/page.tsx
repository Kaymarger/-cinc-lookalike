"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageAssist } from "@/components/page-assist";
import { useDemoAuth } from "@/lib/demo-auth";
import { useSavedHomes } from "@/lib/saved-homes";
import { useSavedSearches } from "@/lib/saved-searches";
import { useRecentlyViewed } from "@/lib/recently-viewed";

const LINKS = [
  { href: "/saved", label: "Saved Homes", desc: "Hearted listings on this device" },
  { href: "/alerts", label: "Saved Searches", desc: "Alert criteria you’ve saved" },
  { href: "/recently-viewed", label: "Recently Viewed", desc: "Listings you’ve opened" },
  { href: "/compare", label: "Compare", desc: "Side-by-side shortlist" },
  { href: "/search", label: "Search Homes", desc: "Continue browsing inventory" },
  { href: "/contact", label: "Message Casey", desc: "Reach your agent" },
];

export default function AccountHubPage() {
  const router = useRouter();
  const { ready, user, signOut } = useDemoAuth();
  const { ids: saved } = useSavedHomes();
  const { searches } = useSavedSearches();
  const { ids: viewed } = useRecentlyViewed();

  useEffect(() => {
    if (ready && !user) router.replace("/account/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <div className="bg-white px-4 py-16 text-center text-sm text-[#666]">
        Loading account…
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cedar)]">
          My Settings
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[#222]">
          Welcome, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          {user.email} · Demo account on this device only
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="border border-[#e5e5e5] p-4">
            <p className="text-2xl font-semibold text-[var(--cedar)]">
              {saved.length}
            </p>
            <p className="text-sm text-[#666]">Saved homes</p>
          </div>
          <div className="border border-[#e5e5e5] p-4">
            <p className="text-2xl font-semibold text-[var(--cedar)]">
              {searches.length}
            </p>
            <p className="text-sm text-[#666]">Saved searches</p>
          </div>
          <div className="border border-[#e5e5e5] p-4">
            <p className="text-2xl font-semibold text-[var(--cedar)]">
              {viewed.length}
            </p>
            <p className="text-sm text-[#666]">Recently viewed</p>
          </div>
        </div>

        <ul className="mt-10 divide-y divide-[#eee] border border-[#e5e5e5]">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-[#edf5fd]"
              >
                <div>
                  <p className="font-medium text-[#222]">{item.label}</p>
                  <p className="text-sm text-[#888]">{item.desc}</p>
                </div>
                <span className="text-[var(--cedar)]">→</span>
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => {
            signOut();
            router.push("/");
          }}
          className="mt-8 h-10 border border-[#ddd] px-4 text-sm font-medium text-[#555] hover:border-[var(--cedar)] hover:text-[var(--cedar)]"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
