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
import {
  COMPARE_MAX,
  nextCompare,
  type ComparedHome,
} from "@/lib/compare-state";

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

  useEffect(() => {
    setHomes(readHomes());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ homes }));
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
