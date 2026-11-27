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
      ? parsed.filter((value): value is string => typeof value === "string")
      : [];
  } catch {
    return [];
  }
}

export function SavedHomesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const emailRef = useRef("");
  const skipPost = useRef(true);

  useEffect(() => {
    let cancel = false;

    async function load(email: string, name: string) {
      emailRef.current = email;
      const device = readIds();
      if (!email) {
        skipPost.current = true;
        if (!cancel) {
          setIds(device);
          setReady(true);
        }
        return;
      }
      if (!cancel) {
        setIds([]);
        setReady(false);
      }
      const snapshot = await pushAccount(email, name, { homes: device, homesMode: "merge" });
      if (cancel || emailRef.current !== email) return;
      skipPost.current = true;
      setIds(snapshot?.homes ?? device);
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
      setIds([]);
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* ignore */
    }
    if (skipPost.current) {
      skipPost.current = false;
      return;
    }
    const email = emailRef.current;
    if (!email) return;
    void pushAccount(email, "", { homes: ids, homesMode: "replace" });
  }, [ids, ready]);

  const isSaved = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback((id: string) => {
    setIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  }, []);

  const replace = useCallback((next: string[]) => {
    setIds([...new Set(next)].slice(0, 40));
  }, []);

  const clear = useCallback(() => setIds([]), []);

  const value = useMemo(
    () => ({ ids, ready, isSaved, toggle, replace, clear }),
    [ids, ready, isSaved, toggle, replace, clear]
  );

  return <SavedHomesContext.Provider value={value}>{children}</SavedHomesContext.Provider>;
}

export function useSavedHomes() {
  const ctx = useContext(SavedHomesContext);
  if (!ctx) {
    throw new Error("useSavedHomes must be used within SavedHomesProvider");
  }
  return ctx;
}
