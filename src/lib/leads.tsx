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
  attributionSummary,
  readStoredAttribution,
  trackLeadConversion,
  type LeadAttribution,
  type LeadIntent,
} from "@/lib/lead-intake";

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
  | "general"
  | "buyer_signup"
  | "seller_signup"
  | "home_valuation";

export type LeadActivityKind =
  | "signup"
  | "note"
  | "call"
  | "text"
  | "email"
  | "system"
  | "task";

export type LeadActivity = {
  id: string;
  at: string;
  kind: LeadActivityKind;
  title: string;
  body?: string;
};

export type LeadTask = {
  id: string;
  title: string;
  due: string;
  done: boolean;
};

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
  activity: LeadActivity[];
  tasks: LeadTask[];
  score: number;
  savedSearches: string[];
  viewedProperties: string[];
  actionPlan?: string;
  intent?: LeadIntent;
  consent?: boolean;
  attribution?: LeadAttribution;
  assignedTo?: string;
  assignedUserId?: string | null;
  partnerName?: string;
  partnerUserId?: string | null;
  listingAgent?: string;
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
  intent?: LeadIntent;
  consent?: boolean;
  attribution?: LeadAttribution;
};

export type DatabaseNotice = {
  connected: boolean;
  message: string;
};

type Ctx = {
  ready: boolean;
  leads: Lead[];
  database: DatabaseNotice | null;
  add: (input: CreateLeadInput) => Lead;
  capture: (input: CreateLeadInput) => Promise<{ ok: boolean; message?: string }>;
  updateStatus: (id: string, status: LeadStatus) => void;
  updateNotes: (id: string, notes: string) => void;
  appendNote: (id: string, line: string) => void;
  appendActivity: (
    id: string,
    item: { kind: LeadActivityKind; title: string; body?: string }
  ) => void;
  addTask: (id: string, title: string, due: string) => void;
  toggleTask: (id: string, taskId: string) => void;
  setScore: (id: string, score: number) => void;
  setActionPlan: (id: string, plan: string) => void;
  markContacted: (id: string) => void;
  remove: (id: string) => void;
  getById: (id: string) => Lead | undefined;
  seedIfEmpty: () => void;
};

const LeadsContext = createContext<Ctx | null>(null);

const SEED = [
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

function stamp() {
  return new Date().toLocaleString("en-CA", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function normalizeLead(raw: Partial<Lead> & Pick<Lead, "id" | "name" | "email" | "source" | "status" | "createdAt">): Lead {
  const notes = raw.notes ?? "";
  const activity =
    Array.isArray(raw.activity) && raw.activity.length > 0
      ? raw.activity
      : [
          {
            id: `${raw.id}-created`,
            at: raw.createdAt,
            kind: "signup" as const,
            title: raw.source === "registration" ? "Free Access signup" : "Lead captured",
            body: notes || undefined,
          },
        ];
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    phone: raw.phone ?? "",
    smsOptIn: Boolean(raw.smsOptIn),
    source: raw.source,
    status: raw.status,
    propertyAddress: raw.propertyAddress,
    propertyId: raw.propertyId,
    searchLabel: raw.searchLabel,
    notes,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
    activity,
    tasks: raw.tasks ?? [],
    score: raw.score ?? 62,
    savedSearches: raw.savedSearches ?? (raw.searchLabel ? [raw.searchLabel] : []),
    viewedProperties:
      raw.viewedProperties ?? (raw.propertyAddress ? [raw.propertyAddress] : []),
    actionPlan: raw.actionPlan,
    intent: raw.intent,
    consent: raw.consent,
    attribution: raw.attribution,
    assignedTo: raw.assignedTo,
    assignedUserId: raw.assignedUserId,
    partnerName: raw.partnerName,
    partnerUserId: raw.partnerUserId,
    listingAgent: raw.listingAgent,
  };
}

function readLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => normalizeLead(item as Lead));
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
  buyer_signup: "Buyer signup",
  seller_signup: "Seller signup",
  home_valuation: "Home valuation",
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
  const [database, setDatabase] = useState<DatabaseNotice | null>(null);

  useEffect(() => {
    const existing = readLeads();
    const seeded =
      existing.length === 0 ? SEED.map((item) => normalizeLead(item as Lead)) : existing;
    if (existing.length === 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setLeads(seeded);
      setReady(true);
    });
    fetch("/api/leads", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          leads?: Partial<Lead>[];
          database?: DatabaseNotice;
        };
      })
      .then((data) => {
        if (cancelled || !data) return;
        if (data.database?.message) {
          setDatabase({
            connected: Boolean(data.database.connected),
            message: data.database.message,
          });
        }
        if (!data.leads?.length) return;
        const remote = data.leads.map((item) =>
          normalizeLead(item as Lead)
        );
        const remoteIds = new Set(remote.map((lead) => lead.id));
        setLeads((prev) => {
          const localOnly = prev.filter((lead) => !remoteIds.has(lead.id));
          return [...remote, ...localOnly].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads, ready]);

  const buildLead = useCallback((input: CreateLeadInput): Lead => {
    const now = new Date().toISOString();
    const attribution = input.attribution ?? readStoredAttribution();
    const campaign = attributionSummary(attribution);
    const notes = input.notes ?? "";
    return {
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
      notes,
      createdAt: now,
      updatedAt: now,
      score: input.source === "registration" || input.source === "buyer_signup" ? 70 : 58,
      savedSearches: input.searchLabel ? [input.searchLabel] : [],
      viewedProperties: input.propertyAddress ? [input.propertyAddress] : [],
      tasks: [],
      intent: input.intent,
      consent: input.consent,
      attribution,
      activity: [
        {
          id: `act-${Date.now()}`,
          at: now,
          kind:
            input.source === "registration" || input.source === "buyer_signup"
              ? "signup"
              : "system",
          title:
            input.source === "registration" || input.source === "buyer_signup"
              ? "Free Access signup"
              : "Lead captured",
          body: [notes, campaign].filter(Boolean).join("\n") || LEAD_SOURCE_LABEL[input.source],
        },
      ],
    };
  }, []);

  const publish = useCallback((lead: Lead, input: CreateLeadInput) => {
    return fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        smsOptIn: lead.smsOptIn,
        source: lead.source,
        intent: input.intent,
        propertyAddress: lead.propertyAddress,
        propertyId: lead.propertyId,
        searchLabel: lead.searchLabel,
        notes: lead.notes,
        consent: input.consent,
        attribution: lead.attribution,
      }),
    }).then(async (response) => {
      const data = (await response.json().catch(() => null)) as {
        ok?: boolean;
        persisted?: boolean;
        message?: string;
        lead?: Partial<Lead>;
      } | null;
      if (data?.lead) {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === lead.id ? normalizeLead({ ...item, ...data.lead, id: item.id }) : item
          )
        );
      }
      if (response.ok && data?.ok !== false && data?.persisted) trackLeadConversion();
      return {
        ok: response.ok && data?.ok !== false,
        persisted: Boolean(data?.persisted),
        message: data?.message,
      };
    });
  }, []);

  const add = useCallback((input: CreateLeadInput) => {
    const lead = buildLead(input);
    setLeads((prev) => [lead, ...prev]);
    void publish(lead, input).catch(() => undefined);
    return lead;
  }, [buildLead, publish]);

  const capture = useCallback(async (input: CreateLeadInput) => {
    const lead = buildLead(input);
    setLeads((prev) => [lead, ...prev.filter((item) => item.id !== lead.id)]);
    try {
      const result = await publish(lead, input);
      if (!result.ok) {
        setLeads((prev) => prev.filter((item) => item.id !== lead.id));
        return { ok: false, message: result.message || "Please check the form and try again." };
      }
      return { ok: true };
    } catch {
      setLeads((prev) => prev.filter((item) => item.id !== lead.id));
      return {
        ok: false,
        message: "We could not reach the office just now. Please call (604) 363-7858.",
      };
    }
  }, [buildLead, publish]);

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

  const appendActivity = useCallback(
    (
      id: string,
      item: { kind: LeadActivityKind; title: string; body?: string }
    ) => {
      const entry: LeadActivity = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(),
        kind: item.kind,
        title: item.title,
        body: item.body,
      };
      setLeads((prev) =>
        prev.map((l) =>
          l.id === id
            ? {
                ...l,
                activity: [entry, ...(l.activity ?? [])],
                updatedAt: new Date().toISOString(),
              }
            : l
        )
      );
    },
    []
  );

  const appendNote = useCallback((id: string, line: string) => {
    const when = stamp();
    const entry: LeadActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      at: new Date().toISOString(),
      kind: "note",
      title: "Note added",
      body: line,
    };
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const notes = l.notes ? `${l.notes}\n[${when}] ${line}` : `[${when}] ${line}`;
        return {
          ...l,
          notes,
          activity: [entry, ...(l.activity ?? [])],
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const addTask = useCallback((id: string, title: string, due: string) => {
    const task: LeadTask = {
      id: `task-${Date.now()}`,
      title,
      due,
      done: false,
    };
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, tasks: [task, ...(l.tasks ?? [])], updatedAt: new Date().toISOString() }
          : l
      )
    );
  }, []);

  const toggleTask = useCallback((id: string, taskId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? {
              ...l,
              tasks: (l.tasks ?? []).map((t) =>
                t.id === taskId ? { ...t, done: !t.done } : t
              ),
            }
          : l
      )
    );
  }, []);

  const setScore = useCallback((id: string, score: number) => {
    const next = Math.max(0, Math.min(100, Math.round(score)));
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, score: next } : l))
    );
  }, []);

  const setActionPlan = useCallback((id: string, plan: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, actionPlan: plan, updatedAt: new Date().toISOString() }
          : l
      )
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
    setLeads((prev) =>
      prev.length === 0 ? SEED.map((item) => normalizeLead(item as Lead)) : prev
    );
  }, []);

  const value = useMemo(
    () => ({
      ready,
      leads,
      database,
      add,
      capture,
      updateStatus,
      updateNotes,
      appendNote,
      appendActivity,
      addTask,
      toggleTask,
      setScore,
      setActionPlan,
      markContacted,
      remove,
      getById,
      seedIfEmpty,
    }),
    [
      ready,
      leads,
      database,
      add,
      capture,
      updateStatus,
      updateNotes,
      appendNote,
      appendActivity,
      addTask,
      toggleTask,
      setScore,
      setActionPlan,
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
