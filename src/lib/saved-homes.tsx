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

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, ready, isSaved, toggle, clear }),
    [ids, ready, isSaved, toggle, clear]
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
