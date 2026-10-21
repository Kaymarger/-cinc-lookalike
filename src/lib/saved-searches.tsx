"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SearchFilters } from "@/lib/types";
import { filtersToQuery } from "@/lib/search";

const STORAGE_KEY = "gvhs-saved-searches";

export type SavedSearch = {
  id: string;
  label: string;
  filters: SearchFilters;
  email: string;
  createdAt: string;
};

type Ctx = {
  ready: boolean;
  searches: SavedSearch[];
  add: (input: { label: string; filters: SearchFilters; email: string }) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const SavedSearchesContext = createContext<Ctx | null>(null);

function read(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as SavedSearch[]) : [];
  } catch {
    return [];
  }
}

export function labelFromFilters(filters: SearchFilters): string {
  const parts: string[] = [];
  if (filters.city) parts.push(filters.city);
  if (filters.beds != null) parts.push(`${filters.beds}+ beds`);
  if (filters.maxPrice != null)
    parts.push(`under $${filters.maxPrice.toLocaleString("en-CA")}`);
  if (filters.minPrice != null)
    parts.push(`from $${filters.minPrice.toLocaleString("en-CA")}`);
  if (filters.propertyType) parts.push(filters.propertyType);
  if (filters.openHouse) parts.push("open houses");
  if (filters.newListings) parts.push("new this week");
  if (filters.q) parts.push(`“${filters.q}”`);
  return parts.length ? parts.join(" · ") : "All Greater Vancouver homes";
}

export function SavedSearchesProvider({ children }: { children: ReactNode }) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSearches(read());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  }, [searches, ready]);

  const add = useCallback(
    (input: { label: string; filters: SearchFilters; email: string }) => {
      const entry: SavedSearch = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label: input.label,
        filters: input.filters,
        email: input.email,
        createdAt: new Date().toISOString(),
      };
      setSearches((prev) => [entry, ...prev].slice(0, 20));
    },
    []
  );

  const remove = useCallback((id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clear = useCallback(() => setSearches([]), []);

  const value = useMemo(
    () => ({ ready, searches, add, remove, clear }),
    [ready, searches, add, remove, clear]
  );

  return (
    <SavedSearchesContext.Provider value={value}>
      {children}
    </SavedSearchesContext.Provider>
  );
}

export function useSavedSearches() {
  const ctx = useContext(SavedSearchesContext);
  if (!ctx) {
    throw new Error("useSavedSearches must be used within SavedSearchesProvider");
  }
  return ctx;
}

export function savedSearchHref(filters: SearchFilters) {
  return `/search${filtersToQuery(filters)}`;
}
