"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { List, Map as MapIcon } from "lucide-react";
import { PropertyCard } from "@/components/property-card";
import type { Property, SearchFilters } from "@/lib/types";
import { parseShape } from "@/lib/geo";
import { filtersToQuery } from "@/lib/search";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/search";
import { cn } from "@/lib/utils";

const SearchMap = dynamic(
  () =>
    import("@/components/search-map").then((m) => m.SearchMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[var(--mist)] text-sm text-[var(--ink-muted)]">
        Loading map…
      </div>
    ),
  }
);

export function SearchResults({
  properties,
  stats,
  showMap = true,
  filters,
}: {
  properties: Property[];
  stats: {
    count: number;
    avgPrice: number;
    avgSqft: number;
    avgBeds: number;
  };
  showMap?: boolean;
  filters?: SearchFilters;
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(8);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [wide, setWide] = useState(false);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setWide(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    setVisible(window.matchMedia("(min-width: 1024px)").matches ? 24 : 8);
  }, [properties.length, properties[0]?.id]);

  useEffect(() => {
    if (!selectedId) return;
    const el = cardRefs.current[selectedId];
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  if (properties.length === 0) {
    const suggestions = [
      { href: "/search?city=Burnaby&maxPrice=1000000", label: "Burnaby under $1M" },
      { href: "/search?city=Vancouver&beds=2", label: "Vancouver 2+ beds" },
      { href: "/search?propertyType=Condo&maxPrice=900000", label: "Condos under $900k" },
      { href: "/search?openHouse=1&weekend=1", label: "This weekend’s open houses" },
      { href: "/search?sort=newest", label: "Newest listings" },
    ];

    return (
      <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--cedar-deep)]">
            No homes match these filters
          </h2>
          <p className="mt-3 text-[var(--ink-muted)]">
            Try widening the price range, removing a city filter, or draw a shape on the map.
          </p>
        </div>
        {showMap ? (
          <div className="mt-6 h-[420px] overflow-hidden border border-border">
            <SearchMap
              properties={[]}
              selectedId={null}
              onSelect={() => undefined}
              circle={filters?.circleLat != null && filters.circleLng != null && filters.circleKm != null ? { lat: filters.circleLat, lng: filters.circleLng, km: filters.circleKm } : null}
              shape={parseShape(filters?.shape)}
              onShape={filters ? (next) => {
                router.push(`/search${filtersToQuery({ ...filters, shape: next ? next.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join(";") : undefined, circleLat: undefined, circleLng: undefined, circleKm: undefined, page: undefined })}`);
              } : undefined}
              onCircle={filters ? (next) => {
                router.push(`/search${filtersToQuery({ ...filters, circleLat: next?.lat, circleLng: next?.lng, circleKm: next?.km, page: undefined })}`);
              } : undefined}
            />
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-full border border-[#d7e0e8] px-3 py-1 text-sm">{item.label}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      id="searchListingsContainer"
      className="mx-auto max-w-[1350px] px-4 py-4"
    >
      <div
        id="searchListingHeader"
        className="mb-4 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-[var(--ink-muted)]">
          <span>
            Avg price{" "}
            <strong className="font-semibold text-[var(--ink)]">
              {formatPrice(stats.avgPrice)}
            </strong>
          </span>
          <span>
            Avg size{" "}
            <strong className="font-semibold text-[var(--ink)]">
              {stats.avgSqft.toLocaleString()} SqFt
            </strong>
          </span>
          <span>
            Avg beds{" "}
            <strong className="font-semibold text-[var(--ink)]">
              {stats.avgBeds}
            </strong>
          </span>
        </div>

        {showMap && (
          <div className="inline-flex border border-border bg-white p-0.5 lg:hidden">
              <button
                type="button"
                aria-pressed={mobileView === "list"}
                onClick={() => setMobileView("list")}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-medium",
                mobileView === "list"
                  ? "bg-[var(--cedar)] text-white"
                  : "text-[var(--ink-muted)]"
              )}
            >
              <List className="size-4" />
              List
            </button>
            <button
              type="button"
              aria-pressed={mobileView === "map"}
              onClick={() => setMobileView("map")}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 px-3 text-sm font-medium",
                mobileView === "map"
                  ? "bg-[var(--cedar)] text-white"
                  : "text-[var(--ink-muted)]"
              )}
            >
              <MapIcon className="size-4" />
              Map
            </button>
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid gap-4 lg:gap-6",
          showMap ? "lg:grid-cols-2" : "lg:grid-cols-1"
        )}
      >
        <div
          id="listing-results"
          className={cn(
            "max-h-[calc(100vh-13rem)] overflow-y-auto pr-1",
            showMap
              ? "grid grid-cols-1 content-start gap-3 sm:grid-cols-2"
              : "grid grid-cols-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3",
            showMap && mobileView === "map" ? "hidden lg:block" : "block",
            !showMap && "mx-auto w-full"
          )}
        >
          {properties.slice(0, visible).map((property, i) => (
            <div
              key={property.id}
              ref={(el) => {
                cardRefs.current[property.id] = el;
              }}
              onMouseEnter={() => setSelectedId(property.id)}
              onFocusCapture={() => setSelectedId(property.id)}
              className={cn(
                "p-1 transition-colors",
                selectedId === property.id && "bg-[#edf5fd]"
              )}
            >
              <PropertyCard
                property={property}
              priority={i < 2}
                layout="list"
              />
            </div>
          ))}
          {visible < properties.length && (
            <button
              type="button"
              onClick={() => setVisible((n) => n + 24)}
              className="col-span-full h-11 border border-[#1976d2] text-sm font-semibold text-[#1976d2]"
            >
              Show more ({properties.length - visible} left)
            </button>
          )}
        </div>

        {showMap && (wide || mobileView === "map") ? (
          <div
            className={cn(
              "sticky top-[5.5rem] h-[min(70vh,640px)] overflow-hidden border border-border bg-[var(--mist)] lg:h-[calc(100vh-13rem)]",
              mobileView === "list" ? "hidden lg:block" : "block"
            )}
          >
            <SearchMap
              properties={properties}
              selectedId={selectedId}
              circle={filters?.circleLat != null && filters.circleLng != null && filters.circleKm != null ? { lat: filters.circleLat, lng: filters.circleLng, km: filters.circleKm } : null}
              shape={parseShape(filters?.shape)}
              onShape={filters ? (next) => {
                router.push(`/search${filtersToQuery({ ...filters, shape: next ? next.map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`).join(";") : undefined, circleLat: undefined, circleLng: undefined, circleKm: undefined, page: undefined })}`);
              } : undefined}
              onCircle={filters ? (next) => {
                router.push(`/search${filtersToQuery({ ...filters, circleLat: next?.lat, circleLng: next?.lng, circleKm: next?.km, page: undefined })}`);
              } : undefined}
              onSelect={(id) => {
                setSelectedId(id);
                setMobileView("list");
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
