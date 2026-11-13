"use client";

import { PropertyCard } from "@/components/property-card";
import type { Property } from "@/lib/types";

export function FeaturedCarousel({ properties }: { properties: Property[] }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} priority={false} />
      ))}
    </div>
  );
}
