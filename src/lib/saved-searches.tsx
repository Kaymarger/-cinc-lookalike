"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { pushAccount, readSession, type AccountSnapshot } from "@/lib/account-sync";
import { deviceSearchesForEmail } from "@/lib/account-merge";
import type { SearchFilters } from "@/lib/types";
import { filtersToQuery } from "@/lib/search";

const STORAGE_KEY = "gvhs-saved-searches";

export type SavedSearch = {
  id: string;
  label: string;
  filters: SearchFilters;
  email: string;
  createdAt: string;
  frequency: string;
};

type Ctx = {
  ready: boolean;
  searches: SavedSearch[];
  add: (input: { label: string; filters: SearchFilters; email: string; frequency?: string }) => void;
  remove: (id: string) => void;
  clear: () => void;
  setFrequency: (id: string, frequency: string) => void;
};

const SavedSearchesContext = createContext<Ctx | null>(null);

function read(): SavedSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<SavedSearch>;
      if (typeof row.id !== "string" || typeof row.label !== "string") return [];
      return [{
        id: row.id,
        label: row.label,
        filters: row.filters || {},
        email: row.email || "",
        createdAt: row.createdAt || new Date().toISOString(),
        frequency: row.frequency || "Daily (Best for default search)",
      }];
    });
  } catch {
    return [];
  }
}

function fromAccount(snapshot: AccountSnapshot | null): SavedSearch[] {
  return (snapshot?.searches || []).map((search) => ({
    id: search.id,
    label: search.name,
    filters: search.filters || {},
    email: search.email,
    createdAt: search.createdAt,
    frequency: search.frequency || "Daily (Best for default search)",
  }));
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
  const emailRef = useRef("");

  useEffect(() => {
    let cancel = false;

    async function load(email: string, name: string) {
      emailRef.current = email;
      const device = email ? deviceSearchesForEmail(read(), email) : read();
      if (!email) {
        if (!cancel) {
          setSearches(device);
          setReady(true);
        }
        return;
      }
      if (!cancel) {
        setSearches([]);
        setReady(false);
      }
      const snapshot = await pushAccount(email, name, {
        searches: device.map((search) => ({
          name: search.label,
          filters: search.filters,
          createdAt: search.createdAt,
        })),
        searchesMode: "merge",
      });
      if (cancel || emailRef.current !== email) return;
      const next = snapshot ? fromAccount(snapshot) : device;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      setSearches(next);
      setReady(true);
    }

    const session = readSession();
    void load(session?.email || "", session?.name || "");

    const onSignIn = (event: Event) => {
      const detail = (event as CustomEvent<{ email?: string; name?: string }>).detail;
      void load((detail?.email || "").trim().toLowerCase(), detail?.name || "");
    };
    const onSignOut = () => {
      emailRef.current = "";
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setSearches([]);
      setReady(true);
    };
    window.addEventListener("gvhs-sign-in", onSignIn);
    window.addEventListener("gvhs-sign-out", onSignOut);
    return () => {
      cancel = true;
      window.removeEventListener("gvhs-sign-in", onSignIn);
      window.removeEventListener("gvhs-sign-out", onSignOut);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch {
      /* ignore */
    }
  }, [searches, ready]);

  const add = useCallback((input: { label: string; filters: SearchFilters; email: string; frequency?: string }) => {
    const entry: SavedSearch = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: input.label,
      filters: input.filters,
      email: input.email,
      createdAt: new Date().toISOString(),
      frequency: input.frequency || "Daily (Best for default search)",
    };
    const owner = emailRef.current;
    if (owner && input.email.trim() && input.email.trim().toLowerCase() !== owner) return;
    setSearches((prev) => [entry, ...prev].slice(0, 20));
    if (!owner) return;
    void pushAccount(owner, "", {
      searches: [{ name: entry.label, filters: entry.filters, createdAt: entry.createdAt }],
      searchesMode: "merge",
    }).then((snapshot) => {
      if (snapshot && emailRef.current === owner) setSearches(fromAccount(snapshot));
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSearches((prev) => prev.filter((search) => search.id !== id));
    const owner = emailRef.current;
    if (!owner) return;
    void fetch("/api/account/searches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: owner, id }),
    });
  }, []);

  const setFrequency = useCallback((id: string, frequency: string) => {
    setSearches((prev) => prev.map((search) => (search.id === id ? { ...search, frequency } : search)));
    const owner = emailRef.current;
    if (!owner) return;
    void fetch("/api/account/searches", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: owner, id, frequency }),
    });
  }, []);

  const clear = useCallback(() => {
    const owner = emailRef.current;
    setSearches((current) => {
      if (owner) {
        for (const search of current) {
          void fetch("/api/account/searches", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: owner, id: search.id }),
          });
        }
      }
      return [];
    });
  }, []);

  const value = useMemo(
    () => ({ ready, searches, add, remove, clear, setFrequency }),
    [ready, searches, add, remove, clear, setFrequency]
  );

  return <SavedSearchesContext.Provider value={value}>{children}</SavedSearchesContext.Provider>;
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
