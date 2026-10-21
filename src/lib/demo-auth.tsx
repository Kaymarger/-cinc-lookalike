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

const STORAGE_KEY = "gvhs-demo-user";

export type DemoUser = {
  name: string;
  email: string;
  createdAt: string;
};

type Ctx = {
  ready: boolean;
  user: DemoUser | null;
  signIn: (email: string, name?: string) => void;
  signUp: (name: string, email: string) => void;
  signOut: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as DemoUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user, ready]);

  const signIn = useCallback((email: string, name?: string) => {
    setUser({
      name: name?.trim() || email.split("@")[0] || "Guest",
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
  }, []);

  const signUp = useCallback((name: string, email: string) => {
    setUser({
      name: name.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
  }, []);

  const signOut = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ ready, user, signIn, signUp, signOut }),
    [ready, user, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDemoAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useDemoAuth must be used within DemoAuthProvider");
  return ctx;
}
