import type { Metadata } from "next";
import Link from "next/link";
import { SearchExperience } from "@/components/search-experience";
import { catalogSearch } from "@/lib/catalog";
import { SEARCH_PAGE_SIZE } from "@/lib/ddf/db";
import { filtersToQuery, marketStats, parseFilters } from "@/lib/search";

export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Vancouver, BC Homes for Sale",
  description:
    "Filter Greater Vancouver listings by city, price, beds, baths, and property type — with map view.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const { properties: results, total } = await catalogSearch(filters);
  const stats = { ...marketStats(results), count: total };

  const page = filters.page || 1;
  const pages = Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE));
  return (
    <>
      <SearchExperience
        filters={filters}
        properties={results}
        stats={stats}
      />
      {pages > 1 ? (
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 pb-10 text-sm" aria-label="Search pages">
          {page > 1 ? (
            <Link href={`/search${filtersToQuery({ ...filters, page: page - 1 })}`} className="font-semibold text-[var(--cedar)]">
              Previous
            </Link>
          ) : (
            <span />
          )}
          <p className="text-[#555]">
            Page {page} of {pages}
          </p>
          {page < pages ? (
            <Link href={`/search${filtersToQuery({ ...filters, page: page + 1 })}`} className="font-semibold text-[var(--cedar)]">
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
