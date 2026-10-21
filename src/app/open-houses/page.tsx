import type { Metadata } from "next";
import Link from "next/link";
import { CamelotPageHeader } from "@/components/camelot-page-header";
import { PropertyCard } from "@/components/property-card";
import { properties } from "@/lib/properties";

export const metadata: Metadata = {
  title: "Open Houses",
  description: "Open houses across Greater Vancouver.",
};

export default function OpenHousesPage() {
  const openHouses = properties.filter((p) => p.openHouse);

  return (
    <div className="bg-white">
      <CamelotPageHeader
        title="Open Houses"
        subtitle="Homes with scheduled open houses in our sample inventory."
      />
      <div className="mx-auto max-w-[1200px] px-4 pb-14 sm:px-6 lg:px-8">
        <p className="mt-2 text-[15px] text-[#666]">
          <Link
            href="/search/quick/PDQVLZZZW2J6S7VM6/open-houses-in-vancouver"
            className="text-[var(--cedar)] hover:underline"
          >
            Open houses in Vancouver
          </Link>
          {" · "}
          <Link
            href="/search?openHouse=1"
            className="text-[var(--cedar)] hover:underline"
          >
            Filter the full search
          </Link>
        </p>

        {openHouses.length === 0 ? (
          <div className="mt-12 border border-[#e5e5e5] bg-[#fafafa] px-6 py-12 text-center">
            <p className="text-[#666]">
              No open houses in the sample inventory right now.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex h-11 items-center bg-[var(--cedar)] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:brightness-90"
            >
              Search Homes
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {openHouses.map((property) => (
              <div key={property.id}>
                <PropertyCard property={property} />
                <p className="mt-2 text-sm font-medium text-[var(--cedar)]">
                  Open house · {property.openHouse}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
