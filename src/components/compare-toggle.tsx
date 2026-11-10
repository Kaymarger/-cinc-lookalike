"use client";

import { Check, Columns2 } from "lucide-react";
import { useCompare, type ComparedHome } from "@/lib/compare";
import type { Property } from "@/lib/types";
import { cn } from "@/lib/utils";

export function comparedHomeFromProperty(property: Property): ComparedHome {
  return {
    id: property.id,
    mlsNumber: property.mlsNumber,
    price: property.price,
    address: property.address,
    city: property.city,
    province: property.province,
    postalCode: property.postalCode,
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
    propertyType: property.propertyType,
    yearBuilt: property.yearBuilt,
    listedDaysAgo: property.listedDaysAgo,
    brokerage: property.brokerage,
    image: property.images[0],
    neighborhood: property.neighborhood,
  };
}

export function CompareToggle({
  property,
  className,
}: {
  property: Property;
  className?: string;
}) {
  const { ready, homes, isCompared, toggle, max } = useCompare();
  const active = ready && isCompared(property.id);
  const full = ready && !active && homes.length >= max;

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle(comparedHomeFromProperty(property));
      }}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border px-3 text-sm font-semibold",
        active
          ? "border-[#1976d2] bg-[#1976d2] text-white"
          : "border-[#1976d2] bg-white text-[#1976d2] hover:bg-[#edf5fd]",
        className
      )}
    >
      {active ? <Check className="size-4" /> : <Columns2 className="size-4" />}
      {active ? `Added · ${homes.length} of ${max}` : full ? "Compare is full" : "Add to compare"}
    </button>
  );
}
