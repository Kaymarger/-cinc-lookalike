"use client";

import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { getPropertyById } from "@/lib/search";

export function RecentlyViewedSection() {
  const { ready, ids, clear } = useRecentlyViewed();
  if (!ready || ids.length === 0) return null;

  const homes = ids
    .map((id) => getPropertyById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  if (homes.length === 0) return null;

  return (
    <section className="border-t border-[#eee] bg-white py-14">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222] sm:text-3xl">
              Recently Viewed
            </h2>
          </div>
          <div className="flex gap-4 text-sm">
            <Link
              href="/search"
              className="font-medium text-[var(--cedar)] hover:underline"
            >
              Back to search
            </Link>
            <button
              type="button"
              onClick={clear}
              className="text-[var(--ink-muted)] hover:text-[var(--cedar)]"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {homes.map((home) => (
            <PropertyCard key={home.id} property={home} />
          ))}
        </div>
      </div>
    </section>
  );
}
