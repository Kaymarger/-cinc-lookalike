"use client";

import Image from "next/image";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { useCompare } from "@/lib/compare";
import { propertyHref } from "@/lib/listing-url";
import { formatPrice, formatSqft, getPropertyById } from "@/lib/search";

export default function ComparePage() {
  const { ready, ids, remove, clear } = useCompare();
  const homes = ready
    ? ids.map((id) => getPropertyById(id)).filter(Boolean)
    : [];

  const rows: { label: string; values: (string | number)[] }[] = homes.length
    ? [
        {
          label: "Price",
          values: homes.map((h) => formatPrice(h!.price)),
        },
        {
          label: "Address",
          values: homes.map((h) => h!.address),
        },
        {
          label: "City",
          values: homes.map((h) => `${h!.city}, ${h!.province}`),
        },
        {
          label: "Type",
          values: homes.map((h) => h!.propertyType),
        },
        {
          label: "Beds",
          values: homes.map((h) => h!.beds),
        },
        {
          label: "Baths",
          values: homes.map((h) => h!.baths),
        },
        {
          label: "Size",
          values: homes.map((h) => formatSqft(h!.sqft)),
        },
        {
          label: "Year built",
          values: homes.map((h) => h!.yearBuilt),
        },
        {
          label: "Status",
          values: homes.map((h) => h!.status),
        },
        {
          label: "$ / SqFt",
          values: homes.map((h) =>
            formatPrice(Math.round(h!.price / h!.sqft))
          ),
        },
        {
          label: "Listed",
          values: homes.map((h) =>
            h!.listedDaysAgo === 0
              ? "Today"
              : `${h!.listedDaysAgo} day${h!.listedDaysAgo === 1 ? "" : "s"} ago`
          ),
        },
      ]
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
              Compare Homes
              <span
                aria-hidden
                className="absolute bottom-0 left-0 h-[3px] w-16 bg-[var(--cedar)]"
              />
            </h1>
            <p className="mt-2 text-[var(--ink-muted)]">
              {!ready
                ? "Loading…"
                : homes.length === 0
                  ? "Add up to 3 homes with Compare on a listing card or detail page."
                  : `Comparing ${homes.length} home${homes.length === 1 ? "" : "s"}.`}
            </p>
          </div>
          {homes.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="text-sm text-[var(--ink-muted)] hover:text-[var(--cedar)]"
            >
              Clear compare
            </button>
          )}
        </div>

        {ready && homes.length === 0 ? (
          <Link
            href="/search"
            className="mt-8 inline-flex rounded-sm bg-[var(--cedar)] px-4 py-2.5 text-sm font-medium text-white hover:brightness-95"
          >
            Find homes to compare
          </Link>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="w-32 p-3 text-left font-medium text-[var(--ink-muted)]" />
                  {homes.map((home) => (
                    <th key={home!.id} className="p-3 text-left align-top">
                      <div className="relative mb-3 aspect-[4/3] overflow-hidden bg-[var(--mist)]">
                        <Image
                          src={home!.images[0]}
                          alt={home!.address}
                          fill
                          className="object-cover"
                          sizes="280px"
                        />
                      </div>
                      <Link
                        href={propertyHref(home!)}
                        className="font-medium text-[var(--cedar)] hover:underline"
                      >
                        {home!.address}
                      </Link>
                      <button
                        type="button"
                        onClick={() => remove(home!.id)}
                        className="mt-2 block text-xs text-[var(--ink-muted)] hover:text-[var(--cedar)]"
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-t border-border">
                    <th className="p-3 text-left font-medium text-[var(--ink-muted)]">
                      {row.label}
                    </th>
                    {row.values.map((value, i) => (
                      <td
                        key={`${row.label}-${homes[i]!.id}`}
                        className="p-3 text-[var(--ink)]"
                      >
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
