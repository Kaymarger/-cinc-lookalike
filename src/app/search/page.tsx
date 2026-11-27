import type { Metadata } from "next";
import Link from "next/link";
import { SearchExperience } from "@/components/search-experience";
import { catalogSearch } from "@/lib/catalog";
import { creaPhotoUrl } from "@/lib/crea-photo";
import { SEARCH_PAGE_SIZE } from "@/lib/ddf/db";
import { filtersToQuery, marketStats, parseFilters } from "@/lib/search";

export const maxDuration = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const filters = parseFilters(await searchParams);
  const city = filters.city?.trim();
  const title = city ? `${city} Homes for Sale` : "Vancouver, BC Homes for Sale";
  const description = city
    ? `Homes for sale in ${city}, British Columbia. Filter by price, beds, and property type.`
    : "Filter Greater Vancouver listings by city, price, beds, baths, and property type — with map view.";
  return {
    title,
    description,
    alternates: { canonical: city ? `/search?city=${encodeURIComponent(city)}` : "/search" },
  };
}

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
  const lcp = results[0]?.images?.[0];
  return (
    <>
      {lcp ? <link rel="preload" as="image" href={creaPhotoUrl(lcp, "med")} /> : null}
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
