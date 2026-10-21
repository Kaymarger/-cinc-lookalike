"use client";

import {
  useCallback,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Map as MapIcon, SlidersHorizontal, X } from "lucide-react";
import { SaveSearchButton } from "@/components/save-search-button";
import { CITIES, PROPERTY_TYPES } from "@/lib/properties";
import type { SearchFilters } from "@/lib/types";
import { filtersToQuery } from "@/lib/search";
import { cn } from "@/lib/utils";

function priceOptions(presets: number[], current?: number) {
  if (current == null || presets.includes(current)) return presets;
  return [...presets, current].sort((a, b) => a - b);
}

type Chip = { key: keyof SearchFilters; label: string };

function chipsFrom(filters: SearchFilters): Chip[] {
  const chips: Chip[] = [];
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”` });
  if (filters.city) chips.push({ key: "city", label: filters.city });
  if (filters.propertyType)
    chips.push({ key: "propertyType", label: filters.propertyType });
  if (filters.beds != null)
    chips.push({ key: "beds", label: `${filters.beds}+ beds` });
  if (filters.baths != null)
    chips.push({ key: "baths", label: `${filters.baths}+ baths` });
  if (filters.minPrice != null)
    chips.push({
      key: "minPrice",
      label: `From $${filters.minPrice.toLocaleString("en-CA")}`,
    });
  if (filters.maxPrice != null)
    chips.push({
      key: "maxPrice",
      label: `To $${filters.maxPrice.toLocaleString("en-CA")}`,
    });
  if (filters.minSqft != null)
    chips.push({ key: "minSqft", label: `${filters.minSqft}+ sqft` });
  if (filters.openHouse) chips.push({ key: "openHouse", label: "Open houses" });
  if (filters.newListings) chips.push({ key: "newListings", label: "New" });
  if (filters.virtualTour)
    chips.push({ key: "virtualTour", label: "Virtual tours" });
  return chips;
}

function FilterMenu({
  label,
  open,
  onToggle,
  children,
  active,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
          active || open
            ? "border-[var(--cedar)] bg-[#edf5fd] text-[var(--cedar-deep)]"
            : "border-[#d7e0e8] bg-white text-[#333] hover:border-[var(--cedar)]"
        )}
      >
        {label}
        <ChevronDown
          className={cn("size-3.5 transition", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 z-40 min-w-[240px] rounded-2xl border border-[#e5e5e5] bg-white p-4 shadow-xl">
          {children}
          <button
            type="button"
            onClick={onToggle}
            className="mt-3 w-full rounded-full border border-[#e5e5e5] py-2 text-xs font-semibold uppercase tracking-wide text-[#555] hover:bg-[#f5f5f5]"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function FilterFields({
  filters,
  update,
}: {
  filters: SearchFilters;
  update: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-[#888] uppercase">
          Price
        </p>
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
          <label className="block space-y-1 text-xs text-[#666]">
            Min
            <select
              className="h-10 w-full rounded-xl border border-[#ddd] px-2 text-sm"
              value={filters.minPrice != null ? String(filters.minPrice) : ""}
              onChange={(e) =>
                update(
                  "minPrice",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">Any</option>
              {priceOptions(
                [500000, 750000, 1000000, 1500000, 2000000],
                filters.minPrice
              ).map((n) => (
                <option key={n} value={String(n)}>
                  ${n.toLocaleString("en-CA")}
                </option>
              ))}
            </select>
          </label>
          <span className="pb-2 text-xs text-[#888]">to</span>
          <label className="block space-y-1 text-xs text-[#666]">
            Max
            <select
              className="h-10 w-full rounded-xl border border-[#ddd] px-2 text-sm"
              value={filters.maxPrice != null ? String(filters.maxPrice) : ""}
              onChange={(e) =>
                update(
                  "maxPrice",
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
            >
              <option value="">Any</option>
              {priceOptions(
                [750000, 1000000, 1500000, 2000000, 3000000, 5000000],
                filters.maxPrice
              ).map((n) => (
                <option key={n} value={String(n)}>
                  ${n.toLocaleString("en-CA")}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-[#888] uppercase">
          Beds
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[undefined, 1, 2, 3, 4, 5].map((n) => (
            <button
              key={String(n ?? "any")}
              type="button"
              onClick={() => update("beds", n)}
              className={cn(
                "h-9 min-w-11 rounded-full border px-3 text-sm",
                (filters.beds ?? undefined) === n
                  ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                  : "border-[#ddd] bg-white text-[#333]"
              )}
            >
              {n == null ? "Any" : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold tracking-wide text-[#888] uppercase">
          Baths
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[undefined, 1, 2, 3, 4].map((n) => (
            <button
              key={String(n ?? "any")}
              type="button"
              onClick={() => update("baths", n)}
              className={cn(
                "h-9 min-w-11 rounded-full border px-3 text-sm",
                (filters.baths ?? undefined) === n
                  ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                  : "border-[#ddd] bg-white text-[#333]"
              )}
            >
              {n == null ? "Any" : `${n}+`}
            </button>
          ))}
        </div>
      </div>

      <label className="block space-y-1 text-xs text-[#666]">
        City
        <select
          className="h-10 w-full rounded-xl border border-[#ddd] px-2 text-sm"
          value={filters.city ?? ""}
          onChange={(e) => update("city", e.target.value || undefined)}
        >
          <option value="">Any city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1 text-xs text-[#666]">
        Home type
        <select
          className="h-10 w-full rounded-xl border border-[#ddd] px-2 text-sm"
          value={filters.propertyType ?? ""}
          onChange={(e) => update("propertyType", e.target.value || undefined)}
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-[#333]">
          <input
            type="checkbox"
            checked={Boolean(filters.virtualTour)}
            onChange={(e) =>
              update("virtualTour", e.target.checked || undefined)
            }
            className="size-4 accent-[var(--cedar)]"
          />
          Virtual tours
        </label>
        <label className="flex items-center gap-2 text-sm text-[#333]">
          <input
            type="checkbox"
            checked={Boolean(filters.newListings)}
            onChange={(e) =>
              update("newListings", e.target.checked || undefined)
            }
            className="size-4 accent-[var(--cedar)]"
          />
          New listings
        </label>
        <label className="flex items-center gap-2 text-sm text-[#333]">
          <input
            type="checkbox"
            checked={Boolean(filters.openHouse)}
            onChange={(e) =>
              update("openHouse", e.target.checked || undefined)
            }
            className="size-4 accent-[var(--cedar)]"
          />
          Open houses only
        </label>
      </div>
    </div>
  );
}

export function SearchFiltersBar({
  initial,
  resultCount,
  showMap = true,
  onToggleMap,
  heading,
}: {
  initial: SearchFilters;
  resultCount: number;
  showMap?: boolean;
  onToggleMap?: () => void;
  heading?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useState<SearchFilters>(initial);
  const [keyword, setKeyword] = useState(initial.q ?? "");
  const [openMenu, setOpenMenu] = useState<
    null | "price" | "beds" | "baths" | "more"
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setFilters(initial);
    setKeyword(initial.q ?? "");
  }, [initial]);

  const pushFilters = useCallback(
    (next: SearchFilters) => {
      setFilters(next);
      startTransition(() => {
        router.push(`/search${filtersToQuery(next)}`, { scroll: false });
      });
    },
    [router]
  );

  function update<K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) {
    pushFilters({ ...filters, [key]: value || undefined });
  }

  function removeChip(key: keyof SearchFilters) {
    const next = { ...filters };
    delete next[key];
    if (key === "q") setKeyword("");
    pushFilters(next);
  }

  function clearAll() {
    setKeyword("");
    setOpenMenu(null);
    setSheetOpen(false);
    pushFilters({});
  }

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const trimmed = keyword.trim();
      if ((filters.q ?? "") === trimmed) return;
      pushFilters({ ...filters, q: trimmed || undefined });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [keyword]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = chipsFrom(filters);
  const activeFilterCount = chips.filter((c) => c.key !== "q").length;
  const title =
    heading ??
    (filters.city
      ? `${filters.city}, BC homes for sale`
      : "Greater Vancouver homes for sale");

  return (
    <div className="border-b border-[#e8eef3] bg-white">
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl text-[#222] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[#666]">
              {pending
                ? "Updating…"
                : `${resultCount} home${resultCount === 1 ? "" : "s"}`}
              {filters.q ? ` matching “${filters.q}”` : ""}
            </p>
          </div>
          <a
            href="tel:6045550100"
            className="hidden text-sm text-[#666] hover:text-[var(--cedar)] md:inline"
          >
            Need help? 604-555-0100
          </a>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              id="search-bar-input"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="City, neighbourhood, address, or MLS® #"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-[#d7e0e8] bg-[#f7fafc] px-4 text-[16px] outline-none focus:border-[var(--cedar)] focus:bg-white sm:text-sm"
            />
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#d7e0e8] bg-white px-4 text-sm font-semibold text-[#222] lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-[var(--cedar)] text-[11px] text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="hidden flex-wrap items-center gap-2 lg:flex">
            {onToggleMap && (
              <button
                type="button"
                onClick={onToggleMap}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
                  showMap
                    ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                    : "border-[#d7e0e8] bg-white text-[#333]"
                )}
              >
                <MapIcon className="size-4" />
                Map
              </button>
            )}

            <FilterMenu
              label="Price"
              open={openMenu === "price"}
              onToggle={() =>
                setOpenMenu((m) => (m === "price" ? null : "price"))
              }
              active={filters.minPrice != null || filters.maxPrice != null}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
                <label className="block space-y-1 text-xs text-[#666]">
                  Min
                  <select
                    className="h-9 w-full rounded-lg border border-[#ddd] px-2 text-sm"
                    value={
                      filters.minPrice != null ? String(filters.minPrice) : ""
                    }
                    onChange={(e) =>
                      update(
                        "minPrice",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">Any</option>
                    {priceOptions(
                      [500000, 750000, 1000000, 1500000, 2000000],
                      filters.minPrice
                    ).map((n) => (
                      <option key={n} value={String(n)}>
                        ${n.toLocaleString("en-CA")}
                      </option>
                    ))}
                  </select>
                </label>
                <span className="pb-2 text-xs text-[#888]">to</span>
                <label className="block space-y-1 text-xs text-[#666]">
                  Max
                  <select
                    className="h-9 w-full rounded-lg border border-[#ddd] px-2 text-sm"
                    value={
                      filters.maxPrice != null ? String(filters.maxPrice) : ""
                    }
                    onChange={(e) =>
                      update(
                        "maxPrice",
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">Any</option>
                    {priceOptions(
                      [750000, 1000000, 1500000, 2000000, 3000000, 5000000],
                      filters.maxPrice
                    ).map((n) => (
                      <option key={n} value={String(n)}>
                        ${n.toLocaleString("en-CA")}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </FilterMenu>

            <FilterMenu
              label="Beds"
              open={openMenu === "beds"}
              onToggle={() =>
                setOpenMenu((m) => (m === "beds" ? null : "beds"))
              }
              active={filters.beds != null}
            >
              <div className="flex flex-wrap gap-1.5">
                {[undefined, 1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={String(n ?? "any")}
                    type="button"
                    onClick={() => update("beds", n)}
                    className={cn(
                      "h-8 min-w-10 rounded-full border px-2 text-sm",
                      (filters.beds ?? undefined) === n
                        ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                        : "border-[#ddd] bg-white text-[#333]"
                    )}
                  >
                    {n == null ? "Any" : `${n}+`}
                  </button>
                ))}
              </div>
            </FilterMenu>

            <FilterMenu
              label="Baths"
              open={openMenu === "baths"}
              onToggle={() =>
                setOpenMenu((m) => (m === "baths" ? null : "baths"))
              }
              active={filters.baths != null}
            >
              <div className="flex flex-wrap gap-1.5">
                {[undefined, 1, 2, 3, 4].map((n) => (
                  <button
                    key={String(n ?? "any")}
                    type="button"
                    onClick={() => update("baths", n)}
                    className={cn(
                      "h-8 min-w-10 rounded-full border px-2 text-sm",
                      (filters.baths ?? undefined) === n
                        ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                        : "border-[#ddd] bg-white text-[#333]"
                    )}
                  >
                    {n == null ? "Any" : `${n}+`}
                  </button>
                ))}
              </div>
            </FilterMenu>

            <FilterMenu
              label="More"
              open={openMenu === "more"}
              onToggle={() =>
                setOpenMenu((m) => (m === "more" ? null : "more"))
              }
              active={Boolean(
                filters.city ||
                  filters.propertyType ||
                  filters.minSqft ||
                  filters.openHouse ||
                  filters.virtualTour ||
                  filters.newListings
              )}
            >
              <FilterFields filters={filters} update={update} />
            </FilterMenu>

            <SaveSearchButton filters={filters} />

            <select
              id="sortby"
              className="ml-auto h-10 rounded-full border border-[#d7e0e8] bg-white px-3 text-sm text-[#333]"
              value={filters.sort ?? "newest"}
              onChange={(e) =>
                update(
                  "sort",
                  (e.target.value as SearchFilters["sort"]) || "newest"
                )
              }
              aria-label="Sort listings"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="sqft-desc">Largest first</option>
            </select>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {onToggleMap && (
              <button
                type="button"
                onClick={onToggleMap}
                className={cn(
                  "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border text-sm font-medium",
                  showMap
                    ? "border-[var(--cedar)] bg-[var(--cedar)] text-white"
                    : "border-[#d7e0e8] bg-white text-[#333]"
                )}
              >
                <MapIcon className="size-4" />
                {showMap ? "Hide map" : "Show map"}
              </button>
            )}
            <SaveSearchButton filters={filters} />
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => removeChip(chip.key)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#edf5fd] px-3 py-1.5 text-xs font-medium text-[var(--cedar-deep)] hover:bg-[#dbeaf8]"
                >
                  {chip.label}
                  <X className="size-3.5" />
                </button>
              ))}
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-medium text-[#888] hover:text-[var(--cedar)]"
              >
                Clear all
              </button>
              <Link
                href="/alerts"
                className="ml-auto text-xs font-medium text-[var(--cedar)] hover:underline"
              >
                My alerts
              </Link>
            </div>
          )}
        </div>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-[90] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#222]">Filters</h2>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="inline-flex size-9 items-center justify-center rounded-full hover:bg-[#f3f6f8]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <FilterFields filters={filters} update={update} />
            <div className="sticky bottom-0 mt-6 flex gap-2 bg-white pt-3 pb-1">
              <button
                type="button"
                onClick={clearAll}
                className="h-12 flex-1 rounded-full border border-[#ddd] text-sm font-semibold text-[#444]"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="h-12 flex-[1.4] rounded-full bg-[var(--cedar)] text-sm font-semibold text-white"
              >
                Show {resultCount} homes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
