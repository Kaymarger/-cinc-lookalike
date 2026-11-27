"use client";

import { useState } from "react";
import { TrackPropertySearch } from "@/components/meta-pixel";
import { SearchFiltersBar } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import type { Property, SearchFilters } from "@/lib/types";

export function SearchExperience({
  filters,
  properties,
  stats,
  heading,
}: {
  filters: SearchFilters;
  properties: Property[];
  stats: {
    count: number;
    avgPrice: number;
    avgSqft: number;
    avgBeds: number;
  };
  heading?: string;
}) {
  const [view, setView] = useState<"list" | "map" | "split">("split");

  return (
    <div>
      <TrackPropertySearch filters={filters} />
      <SearchFiltersBar
        initial={filters}
        resultCount={stats.count}
        view={view}
        onView={setView}
        heading={heading}
      />
      <SearchResults
        properties={properties}
        stats={stats}
        view={view}
        filters={filters}
      />
    </div>
  );
}
