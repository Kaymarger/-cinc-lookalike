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
import type { OfficeRole } from "@/lib/office-access";

export type OfficeProfile = {
  id: string;
  email: string;
  role: OfficeRole;
  roleLabel: string;
  firstName: string;
  lastName: string;
  name: string;
  cell: string;
  home: string;
  office: string;
  title: string;
  license: string;
  loan: string;
  bio: string;
  signature: string;
  subdomain: string;
  facebook: string;
  google: string;
  pinterest: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  active: boolean;
  bootstrap: boolean;
};

export type RosterUser = {
  id: string;
  name: string;
  role: OfficeRole;
  email: string;
};

type DatabaseNotice = { connected: boolean; configured?: boolean; message: string };

type Ctx = {
  ready: boolean;
  user: OfficeProfile | null;
  roster: RosterUser[];
  database: DatabaseNotice | null;
  seesAll: boolean;
  canManageUsers: boolean;
  canReassign: boolean;
  refresh: () => void;
};

const OfficeContext = createContext<Ctx | null>(null);

export function OfficeSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OfficeProfile | null>(null);
  const [roster, setRoster] = useState<RosterUser[]>([]);
  const [database, setDatabase] = useState<DatabaseNotice | null>(null);
  const [seesAll, setSeesAll] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canReassign, setCanReassign] = useState(false);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/office/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          user?: OfficeProfile;
          database?: DatabaseNotice;
          seesAll?: boolean;
          canManageUsers?: boolean;
          canReassign?: boolean;
        };
      })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data?.user ?? null);
        setDatabase(data?.database ?? null);
        setSeesAll(Boolean(data?.seesAll));
        setCanManageUsers(Boolean(data?.canManageUsers));
        setCanReassign(Boolean(data?.canReassign));
        if (!data?.user) {
          setRoster([]);
          setReady(true);
          return;
        }
        const rosterResponse = await fetch("/api/office/roster", { cache: "no-store" });
        const rosterData = rosterResponse.ok
          ? ((await rosterResponse.json()) as { users?: RosterUser[] })
          : null;
        if (cancelled) return;
        setRoster(rosterData?.users ?? []);
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const value = useMemo(
    () => ({ ready, user, roster, database, seesAll, canManageUsers, canReassign, refresh }),
    [ready, user, roster, database, seesAll, canManageUsers, canReassign, refresh]
  );

  return <OfficeContext.Provider value={value}>{children}</OfficeContext.Provider>;
}

export function useOfficeSession() {
  const ctx = useContext(OfficeContext);
  if (!ctx) {
    return {
      ready: true,
      user: null,
      roster: [],
      database: null,
      seesAll: false,
      canManageUsers: false,
      canReassign: false,
      refresh: () => undefined,
    } satisfies Ctx;
  }
  return ctx;
}
