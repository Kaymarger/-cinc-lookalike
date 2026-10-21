"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import type { Property } from "@/lib/types";

export function FeaturedCarousel({ properties }: { properties: Property[] }) {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const pages = Math.max(1, Math.ceil(properties.length / perPage));
  const slice = properties.slice(page * perPage, page * perPage + perPage);

  function prev() {
    setPage((p) => (p - 1 + pages) % pages);
  }
  function next() {
    setPage((p) => (p + 1) % pages);
  }

  return (
    <div className="relative">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((property, i) => (
          <PropertyCard
            key={property.id}
            property={property}
            priority={i === 0}
          />
        ))}
      </div>

      {pages > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous featured listings"
            onClick={prev}
            className="absolute top-[28%] -left-2 hidden size-10 -translate-y-1/2 items-center justify-center text-[#bbb] hover:text-[var(--cedar)] lg:flex xl:-left-6"
          >
            <ChevronLeft className="size-10 stroke-[1.25]" />
          </button>
          <button
            type="button"
            aria-label="Next featured listings"
            onClick={next}
            className="absolute top-[28%] -right-2 hidden size-10 -translate-y-1/2 items-center justify-center text-[#bbb] hover:text-[var(--cedar)] lg:flex xl:-right-6"
          >
            <ChevronRight className="size-10 stroke-[1.25]" />
          </button>
          <div className="mt-8 flex justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Featured page ${i + 1}`}
                onClick={() => setPage(i)}
                className={`size-2.5 rounded-full ${
                  i === page ? "bg-[#222]" : "bg-[#d0d0d0]"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
