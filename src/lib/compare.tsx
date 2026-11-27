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
import { pushAccount, readSession } from "@/lib/account-sync";
import {
  COMPARE_MAX,
  nextCompare,
  type ComparedHome,
} from "@/lib/compare-state";
import type { Property } from "@/lib/types";

const STORAGE_KEY = "gvhs-compare";

type Ctx = {
  ready: boolean;
  homes: ComparedHome[];
  notice: string;
  pending: ComparedHome | null;
  isCompared: (id: string) => boolean;
  toggle: (home: ComparedHome) => { ok: boolean; reason?: string };
  replaceWithPending: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  max: number;
};

const CompareContext = createContext<Ctx | null>(null);

function propertyToCompared(property: Property): ComparedHome {
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
    image: property.images?.[0],
    neighborhood: property.neighborhood,
  };
}

async function hydrate(ids: string[], device: ComparedHome[]): Promise<ComparedHome[]> {
  const byId = new Map(device.map((home) => [home.id, home]));
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) {
    try {
      const response = await fetch(`/api/listings?ids=${encodeURIComponent(missing.join(","))}`);
      const data = (await response.json()) as { properties?: Property[] };
      for (const property of data.properties || []) byId.set(property.id, propertyToCompared(property));
    } catch {
      /* keep the homes we already have */
    }
  }
  return ids.flatMap((id) => {
    const home = byId.get(id);
    return home ? [home] : [];
  }).slice(0, COMPARE_MAX);
}

function readHomes(): ComparedHome[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || !("homes" in parsed)) return [];
    const homes = (parsed as { homes?: unknown }).homes;
    if (!Array.isArray(homes)) return [];
    return homes.filter((item): item is ComparedHome => {
      if (!item || typeof item !== "object") return false;
      const row = item as Partial<ComparedHome>;
      return typeof row.id === "string" && typeof row.address === "string" && typeof row.price === "number";
    }).slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [homes, setHomes] = useState<ComparedHome[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState<ComparedHome | null>(null);
  const emailRef = useRef("");
  const skipPost = useRef(true);

  useEffect(() => {
    let cancel = false;

    async function load(email: string, name: string) {
      emailRef.current = email;
      const device = readHomes();
      if (!email) {
        skipPost.current = true;
        if (!cancel) {
          setHomes(device);
          setReady(true);
        }
        return;
      }
      if (!cancel) {
        setHomes([]);
        setPending(null);
        setReady(false);
      }
      const snapshot = await pushAccount(email, name, {
        compare: device.map((home) => home.id),
        compareMode: "merge",
      });
      if (cancel || emailRef.current !== email) return;
      const next = await hydrate(snapshot?.compare ?? device.map((home) => home.id), device);
      if (cancel || emailRef.current !== email) return;
      skipPost.current = true;
      setHomes(next);
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
      skipPost.current = true;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      setHomes([]);
      setPending(null);
      setNotice("");
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ homes }));
    } catch {
      /* ignore */
    }
    if (skipPost.current) {
      skipPost.current = false;
      return;
    }
    const email = emailRef.current;
    if (!email) return;
    void pushAccount(email, "", { compare: homes.map((home) => home.id), compareMode: "replace" });
  }, [homes, ready]);

  const isCompared = useCallback((id: string) => homes.some((home) => home.id === id), [homes]);

  const toggle = useCallback((home: ComparedHome) => {
    if (homes.some((item) => item.id === home.id)) {
      setHomes(homes.filter((item) => item.id !== home.id));
      setPending(null);
      setNotice("");
      return { ok: true };
    }
    if (homes.length >= COMPARE_MAX) {
      setPending(home);
      setNotice("Compare is full. Choose which home to replace.");
      return { ok: false, reason: "Compare is full. Choose which home to replace." };
    }
    const next = nextCompare(homes, home);
    setHomes(next.homes);
    setPending(null);
    setNotice("");
    return { ok: true };
  }, [homes]);

  const replaceWithPending = useCallback((id: string) => {
    setHomes((current) => {
      if (!pending) return current;
      return current.map((home) => (home.id === id ? pending : home));
    });
    setPending(null);
    setNotice("Replaced a home in your compare list.");
  }, [pending]);

  const remove = useCallback((id: string) => {
    setHomes((prev) => prev.filter((home) => home.id !== id));
    setNotice("");
  }, []);

  const clear = useCallback(() => {
    setHomes([]);
    setNotice("");
  }, []);

  const value = useMemo(
    () => ({ ready, homes, notice, pending, isCompared, toggle, replaceWithPending, remove, clear, max: COMPARE_MAX }),
    [ready, homes, notice, pending, isCompared, toggle, replaceWithPending, remove, clear]
  );

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used within CompareProvider");
  return ctx;
}

export type { ComparedHome };
