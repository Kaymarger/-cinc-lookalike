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
  mustSetPassword?: boolean;
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
  canExport: boolean;
  canDelete: boolean;
  canDial: boolean;
  canSendEmail: boolean;
  canSendText: boolean;
  canBecome: boolean;
  impersonating: boolean;
  refresh: () => void;
  endImpersonation: () => void;
};

const OfficeContext = createContext<Ctx | null>(null);

const empty: Ctx = {
  ready: true,
  user: null,
  roster: [],
  database: null,
  seesAll: false,
  canManageUsers: false,
  canReassign: false,
  canExport: false,
  canDelete: false,
  canDial: false,
  canSendEmail: true,
  canSendText: true,
  canBecome: false,
  impersonating: false,
  refresh: () => undefined,
  endImpersonation: () => undefined,
};

export function OfficeSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<OfficeProfile | null>(null);
  const [roster, setRoster] = useState<RosterUser[]>([]);
  const [database, setDatabase] = useState<DatabaseNotice | null>(null);
  const [seesAll, setSeesAll] = useState(false);
  const [canManageUsers, setCanManageUsers] = useState(false);
  const [canReassign, setCanReassign] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [canDial, setCanDial] = useState(false);
  const [canSendEmail, setCanSendEmail] = useState(true);
  const [canSendText, setCanSendText] = useState(true);
  const [canBecome, setCanBecome] = useState(false);
  const [impersonating, setImpersonating] = useState(false);
  const [ready, setReady] = useState(false);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const endImpersonation = useCallback(() => {
    void fetch("/api/office/become", { method: "DELETE" }).finally(() => {
      // Reload the current screen. A hash-only URL change would keep the old banner.
      window.location.reload();
    });
  }, []);

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
          canExport?: boolean;
          canDelete?: boolean;
          canDial?: boolean;
          canSendEmail?: boolean;
          canSendText?: boolean;
          canBecome?: boolean;
          impersonating?: boolean;
        };
      })
      .then(async (data) => {
        if (cancelled) return;
        setUser(data?.user ?? null);
        setDatabase(data?.database ?? null);
        setSeesAll(Boolean(data?.seesAll));
        setCanManageUsers(Boolean(data?.canManageUsers));
        setCanReassign(Boolean(data?.canReassign));
        setCanExport(Boolean(data?.canExport));
        setCanDelete(Boolean(data?.canDelete));
        setCanDial(Boolean(data?.canDial));
        setCanSendEmail(data?.canSendEmail !== false);
        setCanSendText(data?.canSendText !== false);
        setCanBecome(Boolean(data?.canBecome));
        setImpersonating(Boolean(data?.impersonating));
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
    () => ({
      ready,
      user,
      roster,
      database,
      seesAll,
      canManageUsers,
      canReassign,
      canExport,
      canDelete,
      canDial,
      canSendEmail,
      canSendText,
      canBecome,
      impersonating,
      refresh,
      endImpersonation,
    }),
    [ready, user, roster, database, seesAll, canManageUsers, canReassign, canExport, canDelete, canDial, canSendEmail, canSendText, canBecome, impersonating, refresh, endImpersonation]
  );

  return (
    <OfficeContext.Provider value={value}>
      {impersonating && user ? (
        <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-between gap-3 bg-[#d9363e] px-4 py-2 text-[13px] text-white shadow">
          <p>
            Viewing the office as <strong>{user.name}</strong>. Leads and menus match that user.
          </p>
          <button
            type="button"
            className="shrink-0 border border-white px-2 py-1 text-[12px] font-semibold uppercase"
            onClick={endImpersonation}
          >
            Switch back
          </button>
        </div>
      ) : null}
      {children}
    </OfficeContext.Provider>
  );
}

export function useOfficeSession() {
  return useContext(OfficeContext) ?? empty;
}
