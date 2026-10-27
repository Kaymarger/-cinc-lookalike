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

const SESSION_KEY = "gvhs-demo-user";
const ACCOUNTS_KEY = "gvhs-demo-accounts";

export type DemoUser = {
  name: string;
  email: string;
  phone?: string;
  createdAt: string;
};

type Ctx = {
  ready: boolean;
  user: DemoUser | null;
  signIn: (email: string, name?: string) => void;
  signInWithPassword: (email: string, password: string) => string | null;
  signUp: (name: string, email: string, phone?: string) => void;
  updateProfile: (patch: Partial<Pick<DemoUser, "name" | "email" | "phone">>) => void;
  signOut: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

function readAccounts(): DemoUser[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as DemoUser[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: DemoUser[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) setUser(JSON.parse(raw) as DemoUser);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user, ready]);

  const remember = useCallback((next: DemoUser) => {
    const accounts = readAccounts().filter(
      (a) => a.email.toLowerCase() !== next.email.toLowerCase()
    );
    accounts.push(next);
    writeAccounts(accounts);
    setUser(next);
  }, []);

  const signIn = useCallback((email: string, name?: string) => {
    const existing = readAccounts().find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      setUser(existing);
      return;
    }
    remember({
      name: name?.trim() || email.split("@")[0] || "Guest",
      email: email.trim(),
      createdAt: new Date().toISOString(),
    });
  }, [remember]);

  const signInWithPassword = useCallback((email: string, password: string) => {
    const existing = readAccounts().find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!existing) return "No account with that email. Sign up first.";
    if ((existing.phone || "") !== password.trim()) {
      return "That phone password does not match this demo account.";
    }
    setUser(existing);
    return null;
  }, []);

  const signUp = useCallback((name: string, email: string, phone?: string) => {
    remember({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
  }, [remember]);

  const updateProfile = useCallback(
    (patch: Partial<Pick<DemoUser, "name" | "email" | "phone">>) => {
      setUser((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        const accounts = readAccounts().map((a) =>
          a.email.toLowerCase() === current.email.toLowerCase() ? next : a
        );
        writeAccounts(accounts);
        return next;
      });
    },
    []
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      ready,
      user,
      signIn,
      signInWithPassword,
      signUp,
      updateProfile,
      signOut,
    }),
    [ready, user, signIn, signInWithPassword, signUp, updateProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useDemoAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useDemoAuth must be used within DemoAuthProvider");
  return ctx;
}
