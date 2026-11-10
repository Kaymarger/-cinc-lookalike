"use client";

import Image from "next/image";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { useCompare, type ComparedHome } from "@/lib/compare";
import { propertyHref } from "@/lib/listing-url";
import { formatPrice, formatSqft } from "@/lib/search";
import type { Property } from "@/lib/types";

function fact(value: string | number | undefined, missing = "—") {
  if (value === undefined || value === "" || value === 0) return missing;
  return String(value);
}

function rows(homes: ComparedHome[]) {
  return [
    { label: "Price", values: homes.map((home) => formatPrice(home.price)) },
    { label: "MLS®", values: homes.map((home) => fact(home.mlsNumber)) },
    { label: "City", values: homes.map((home) => [home.city, home.province].filter(Boolean).join(", ") || "—") },
    { label: "Neighbourhood", values: homes.map((home) => fact(home.neighborhood)) },
    { label: "Type", values: homes.map((home) => fact(home.propertyType)) },
    { label: "Beds", values: homes.map((home) => fact(home.beds)) },
    { label: "Baths", values: homes.map((home) => fact(home.baths)) },
    { label: "Size", values: homes.map((home) => (home.sqft > 0 ? formatSqft(home.sqft) : "—")) },
    { label: "Year built", values: homes.map((home) => (home.yearBuilt > 0 ? String(home.yearBuilt) : "—")) },
    { label: "Days on site", values: homes.map((home) => (home.listedDaysAgo > 0 ? String(home.listedDaysAgo) : "—")) },
    { label: "Brokerage", values: homes.map((home) => fact(home.brokerage)) },
  ];
}

export default function ComparePage() {
  const { ready, homes = [], remove, clear, max } = useCompare();
  const facts = rows(homes);

  return (
    <div className="bg-white pb-40">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[1200px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">Compare homes</h1>
            <p className="mt-2 max-w-xl text-sm text-[#5a6f82]">
              {!ready
                ? "Loading your comparison."
                : homes.length === 0
                  ? "Use Add to compare on a listing. You can compare 2 or 3 homes. No account is required."
                  : homes.length === 1
                    ? "1 of 3 selected. Add one more home to compare them side by side."
                    : `${homes.length} of ${max} selected. Facts below are the details supplied with each listing.`}
            </p>
          </div>
          {homes.length > 0 ? (
            <button type="button" onClick={clear} className="text-sm font-semibold text-[#1976d2]">
              Clear all
            </button>
          ) : null}
        </div>

        {ready && homes.length === 0 ? (
          <Link href="/search" className="mt-8 inline-flex h-11 items-center bg-[#1976d2] px-5 text-sm font-bold text-white">
            Find homes to compare
          </Link>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <div
              className="grid min-w-[720px] gap-px bg-[#e5e5e5]"
              style={{ gridTemplateColumns: `9rem repeat(${Math.max(homes.length, 1)}, minmax(180px, 1fr))` }}
            >
              <div className="bg-white p-3" />
              {homes.map((home) => (
                <div key={home.id} className="bg-white p-3">
                  <div className="relative mb-3 aspect-[4/3] bg-[#7b97aa]">
                    {home.image ? (
                      <Image src={home.image} alt={home.address} fill className="object-cover" sizes="240px" unoptimized={home.image.startsWith("http") && !home.image.includes("ddfcdn.realtor.ca")} />
                    ) : (
                      <span className="grid h-full place-items-center text-sm text-white">No photo supplied</span>
                    )}
                  </div>
                  <Link href={propertyHref(home as unknown as Property)} className="font-semibold text-[#1976d2] hover:underline">
                    {home.address}
                  </Link>
                  <button type="button" onClick={() => remove(home.id)} className="mt-2 block text-xs font-semibold text-[#5a6f82]">
                    Remove
                  </button>
                </div>
              ))}
              {facts.map((row) => (
                <div key={row.label} className="contents">
                  <div className="bg-[#f7fafc] p-3 text-sm font-semibold text-[#5a6f82]">{row.label}</div>
                  {row.values.map((value, index) => (
                    <div key={`${row.label}-${homes[index]?.id}`} className="bg-white p-3 text-sm text-[#1f2930]">
                      {value}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
