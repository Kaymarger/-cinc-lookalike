"use client";

import { useState } from "react";
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
  const [showMap, setShowMap] = useState(true);

  return (
    <div>
      <SearchFiltersBar
        initial={filters}
        resultCount={properties.length}
        showMap={showMap}
        onToggleMap={() => setShowMap((v) => !v)}
        heading={heading}
      />
      <SearchResults
        properties={properties}
        stats={stats}
        showMap={showMap}
      />
    </div>
  );
}
