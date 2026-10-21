"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import { PageAssist } from "@/components/page-assist";
import { useDemoAuth } from "@/lib/demo-auth";
import { useSavedHomes } from "@/lib/saved-homes";
import { getPropertyById } from "@/lib/search";

export default function MyPropertiesPage() {
  const { ready, ids, clear } = useSavedHomes();
  const { user } = useDemoAuth();
  const homes = ready ? ids.map((id) => getPropertyById(id)).filter(Boolean) : [];

  return (
    <div className="bg-[#f7fafc]">
      <div className="border-b border-[#e8eef3] bg-white px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
              My Properties
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-[#666]">
              {!ready
                ? "Loading…"
                : homes.length === 0
                  ? "Tap the heart on any listing to keep it here."
                  : `${homes.length} propert${homes.length === 1 ? "y" : "ies"} saved on this device.`}
            </p>
          </div>
          {homes.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-[#666] hover:text-[var(--cedar)]"
            >
              Clear all
            </button>
          )}
        </div>

        {!user && ready && (
          <div className="mt-6 rounded-2xl border border-[#d7e8f6] bg-[#edf5fd] px-4 py-4 text-sm text-[var(--cedar-deep)] sm:px-5">
            Create a free account so these stay with you.{" "}
            <Link href="/account/register" className="font-semibold underline underline-offset-2">
              Sign up
            </Link>
          </div>
        )}

        {ready && homes.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-[#e5eef5] bg-white px-6 py-14 text-center">
            <Heart className="mx-auto size-10 text-[var(--cedar)]" strokeWidth={1.5} />
            <p className="mt-4 text-lg font-semibold text-[#222]">No properties yet</p>
            <p className="mt-2 text-sm text-[#666]">
              Browse listings and tap the heart to build My Properties.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-[var(--cedar)] px-6 text-sm font-semibold text-white hover:brightness-95"
            >
              Search homes
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homes.map(
              (property) =>
                property && <PropertyCard key={property.id} property={property} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
