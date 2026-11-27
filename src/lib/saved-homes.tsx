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

const STORAGE_KEY = "gvhs-saved-homes";

type SavedHomesContextValue = {
  ids: string[];
  ready: boolean;
  isSaved: (id: string) => boolean;
  toggle: (id: string) => void;
  replace: (ids: string[]) => void;
  clear: () => void;
};

const SavedHomesContext = createContext<SavedHomesContextValue | null>(null);

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
}

export function SavedHomesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readIds());
    setReady(true);
    const onSignOut = () => setIds([]);
    window.addEventListener("gvhs-sign-out", onSignOut);
    return () => window.removeEventListener("gvhs-sign-out", onSignOut);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }, [ids, ready]);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const replace = useCallback((next: string[]) => {
    setIds([...new Set(next)].slice(0, 40));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, ready, isSaved, toggle, replace, clear }),
    [ids, ready, isSaved, toggle, replace, clear]
  );

  return (
    <SavedHomesContext.Provider value={value}>
      {children}
    </SavedHomesContext.Provider>
  );
}

export function useSavedHomes() {
  const ctx = useContext(SavedHomesContext);
  if (!ctx) {
    throw new Error("useSavedHomes must be used within SavedHomesProvider");
  }
  return ctx;
}
