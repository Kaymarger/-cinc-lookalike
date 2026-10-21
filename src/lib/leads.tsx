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

const STORAGE_KEY = "gvhs-leads";

export type LeadStatus =
  | "new"
  | "contacted"
  | "showing"
  | "nurture"
  | "closed";

export type LeadSource =
  | "showing_request"
  | "ask_question"
  | "registration"
  | "photo_gate"
  | "search_alert"
  | "general";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  source: LeadSource;
  status: LeadStatus;
  propertyAddress?: string;
  propertyId?: string;
  searchLabel?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

type CreateLeadInput = {
  name: string;
  email: string;
  phone: string;
  smsOptIn?: boolean;
  source: LeadSource;
  propertyAddress?: string;
  propertyId?: string;
  searchLabel?: string;
  notes?: string;
};

type Ctx = {
  ready: boolean;
  leads: Lead[];
  add: (input: CreateLeadInput) => Lead;
  updateStatus: (id: string, status: LeadStatus) => void;
  updateNotes: (id: string, notes: string) => void;
  appendNote: (id: string, line: string) => void;
  markContacted: (id: string) => void;
  remove: (id: string) => void;
  getById: (id: string) => Lead | undefined;
  seedIfEmpty: () => void;
};

const LeadsContext = createContext<Ctx | null>(null);

const SEED: Lead[] = [
  {
    id: "lead-seed-1",
    name: "Jordan Lee",
    email: "jordan.lee@email.com",
    phone: "604-555-0142",
    smsOptIn: true,
    source: "showing_request",
    status: "new",
    propertyAddress: "7305 Coronado Dr",
    propertyId: "r2389012",
    notes: "",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: "lead-seed-2",
    name: "Priya Sharma",
    email: "priya.s@email.com",
    phone: "778-555-0198",
    smsOptIn: true,
    source: "search_alert",
    status: "contacted",
    searchLabel: "Vancouver · 2+ beds · under $1,200,000",
    notes: "Looking to move before school year. Prefers Westside.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "lead-seed-3",
    name: "Marcus Chen",
    email: "mchen@email.com",
    phone: "604-555-0110",
    smsOptIn: false,
    source: "ask_question",
    status: "showing",
    propertyAddress: "1416 Purcell Dr",
    propertyId: "r2391044",
    notes: "Saturday 1pm showing confirmed with listing agent.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "lead-seed-4",
    name: "Ava Nguyen",
    email: "ava.n@email.com",
    phone: "250-555-0177",
    smsOptIn: true,
    source: "photo_gate",
    status: "nurture",
    propertyAddress: "1482 Robson St Unit 1202",
    propertyId: "r2391666",
    notes: "Investor — watching Coal Harbour inventory.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

function readLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  showing: "Showing",
  nurture: "Nurture",
  closed: "Closed",
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  showing_request: "Showing request",
  ask_question: "Ask a question",
  registration: "Registration",
  photo_gate: "Photo gallery",
  search_alert: "Search alert",
  general: "General inquiry",
};

export const LEAD_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "showing",
  "nurture",
  "closed",
];

export const LEAD_SOURCES = Object.keys(
  LEAD_SOURCE_LABEL
) as LeadSource[];

export function LeadsProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = readLeads();
    if (existing.length === 0) {
      setLeads(SEED);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED));
    } else {
      setLeads(existing);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads, ready]);

  const add = useCallback((input: CreateLeadInput) => {
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      smsOptIn: Boolean(input.smsOptIn),
      source: input.source,
      status: "new",
      propertyAddress: input.propertyAddress,
      propertyId: input.propertyId,
      searchLabel: input.searchLabel,
      notes: input.notes ?? "",
      createdAt: now,
      updatedAt: now,
    };
    setLeads((prev) => [lead, ...prev]);
    return lead;
  }, []);

  const updateStatus = useCallback((id: string, status: LeadStatus) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status, updatedAt: new Date().toISOString() }
          : l
      )
    );
  }, []);

  const updateNotes = useCallback((id: string, notes: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, notes, updatedAt: new Date().toISOString() }
          : l
      )
    );
  }, []);

  const appendNote = useCallback((id: string, line: string) => {
    const stamp = new Date().toLocaleString("en-CA");
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const notes = l.notes
          ? `${l.notes}\n[${stamp}] ${line}`
          : `[${stamp}] ${line}`;
        return { ...l, notes, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const markContacted = useCallback((id: string) => {
    const stamp = new Date().toLocaleString("en-CA");
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const notes = l.notes
          ? `${l.notes}\n[${stamp}] Marked contacted`
          : `[${stamp}] Marked contacted`;
        return {
          ...l,
          status: l.status === "new" ? "contacted" : l.status,
          notes,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getById = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads]
  );

  const seedIfEmpty = useCallback(() => {
    setLeads((prev) => (prev.length === 0 ? SEED : prev));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      leads,
      add,
      updateStatus,
      updateNotes,
      appendNote,
      markContacted,
      remove,
      getById,
      seedIfEmpty,
    }),
    [
      ready,
      leads,
      add,
      updateStatus,
      updateNotes,
      appendNote,
      markContacted,
      remove,
      getById,
      seedIfEmpty,
    ]
  );

  return (
    <LeadsContext.Provider value={value}>{children}</LeadsContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used within LeadsProvider");
  return ctx;
}
