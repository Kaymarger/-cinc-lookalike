"use client";

import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { PageAssist } from "@/components/page-assist";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { getPropertyById } from "@/lib/search";

export default function RecentlyViewedPage() {
  const { ready, ids, clear } = useRecentlyViewed();
  const homes = ready
    ? ids.map((id) => getPropertyById(id)).filter(Boolean)
    : [];

  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="relative w-fit pb-3 font-[family-name:var(--font-display)] text-3xl text-[#222]">
              Recently Viewed
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-[3px] w-16 bg-[var(--cedar)]"
              />
            </h1>
            <p className="mt-4 text-[15px] text-[#666]">
              {!ready
                ? "Loading…"
                : homes.length === 0
                  ? "Open a listing to start your history — stored on this device."
                  : `${homes.length} recently viewed home${homes.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          {homes.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-sm text-[#888] hover:text-[var(--cedar)]"
            >
              Clear history
            </button>
          )}
        </div>

        {ready && homes.length === 0 ? (
          <Link
            href="/search"
            className="mt-8 inline-flex h-11 items-center bg-[var(--cedar)] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95"
          >
            Search Homes
          </Link>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {homes.map((home) => (
              <PropertyCard key={home!.id} property={home!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
