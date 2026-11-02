import type { Metadata } from "next";
import { SearchExperience } from "@/components/search-experience";
import { catalogSearch } from "@/lib/catalog";
import { marketStats, parseFilters } from "@/lib/search";

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

  return (
    <SearchExperience
      filters={filters}
      properties={results}
      stats={stats}
    />
  );
}
