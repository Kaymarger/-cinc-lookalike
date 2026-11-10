import type { Metadata } from "next";
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { PageAssist } from "@/components/page-assist";
import { catalogFeatured } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Featured Listings",
  description: "Active homes featured on Casey Archibald's site.",
};

export default async function FeaturedPage() {
  const list = await catalogFeatured(24);

  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-center font-[family-name:var(--font-display)] text-3xl font-normal text-[#222] sm:text-4xl">
          Featured Listings
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-center text-[15px] text-[#666]">
          Homes Casey Archibald is featuring right now.
        </p>
        {list.length ? (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p, i) => (
            <PropertyCard key={p.id} property={p} priority={i < 3} />
          ))}
        </div>
        ) : (
          <p className="mx-auto mt-10 max-w-xl text-center text-[15px] text-[#666]">
            No featured listings are available right now.
          </p>
        )}

        <div className="mt-12 flex justify-center">
          <Link
            href="/search"
            className="inline-flex h-11 items-center bg-[var(--cedar)] px-8 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-95"
          >
            Search All Homes
          </Link>
        </div>
      </div>
    </div>
  );
}
