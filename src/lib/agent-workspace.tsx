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
import { CRM_AUTOTRACKS } from "@/lib/cinc-crm";

const KEY = "gvhs-agent-workspace";

export type Trigger = "new-lead" | "status-change" | "tag-added" | "inactivity";
export type StepKind = "email" | "text" | "task" | "wait";

export type PlanStep = {
  id: string;
  kind: StepKind;
  title: string;
  body: string;
  waitDays: number;
};

export type ActionPlan = {
  id: string;
  name: string;
  category: string;
  active: boolean;
  trigger: Trigger;
  steps: PlanStep[];
};

export type MessageTemplate = {
  id: string;
  channel: "email" | "text";
  name: string;
  subject: string;
  body: string;
};

export type SmartList = { id: string; name: string; rule: string; active: boolean };
export type ListingAlertRule = {
  id: string;
  name: string;
  area: string;
  minPrice: string;
  maxPrice: string;
  active: boolean;
};
export type AssignRule = {
  id: string;
  name: string;
  when: Trigger;
  assignTo: string;
  active: boolean;
};
export type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
};
export type RouteRule = {
  id: string;
  name: string;
  source: string;
  assignTo: string;
  active: boolean;
};
export type NotifyPref = { id: string; event: string; email: boolean; sms: boolean };
export type PhoneLine = {
  id: string;
  label: string;
  number: string;
  kind: "voice" | "text";
  active: boolean;
};
export type Signature = { id: string; name: string; body: string; isDefault: boolean };
export type SiteSetting = { id: string; label: string; value: string };
export type IdxRule = {
  id: string;
  name: string;
  criteria: string;
  cadence: string;
  active: boolean;
};
export type Integration = {
  id: string;
  name: string;
  connected: boolean;
  notes: string;
};
export type LeadSourceItem = { id: string; name: string; active: boolean };
export type TagItem = { id: string; name: string; color: string };
export type FieldItem = {
  id: string;
  name: string;
  fieldType: string;
  required: boolean;
};
export type Profile = {
  name: string;
  email: string;
  phone: string;
  title: string;
  bio: string;
};
export type Billing = { plan: string; seats: string; card: string; status: string };

export type Workspace = {
  profile: Profile;
  billing: Billing;
  team: TeamUser[];
  routing: RouteRule[];
  notifications: NotifyPref[];
  phones: PhoneLine[];
  signatures: Signature[];
  website: SiteSetting[];
  idx: IdxRule[];
  integrations: Integration[];
  sources: LeadSourceItem[];
  tags: TagItem[];
  fields: FieldItem[];
  plans: ActionPlan[];
  templates: MessageTemplate[];
  lists: SmartList[];
  alerts: ListingAlertRule[];
  assign: AssignRule[];
};

type Ctx = {
  ready: boolean;
  data: Workspace;
  saveProfile: (profile: Profile) => void;
  saveBilling: (billing: Billing) => void;
  upsert: <K extends ListKey>(key: K, item: Workspace[K][number]) => void;
  remove: (key: ListKey, id: string) => void;
  toggle: (key: ToggleKey, id: string) => void;
  setNotify: (id: string, channel: "email" | "sms", value: boolean) => void;
  setDefaultSignature: (id: string) => void;
};

type ListKey =
  | "team"
  | "routing"
  | "phones"
  | "signatures"
  | "website"
  | "idx"
  | "integrations"
  | "sources"
  | "tags"
  | "fields"
  | "plans"
  | "templates"
  | "lists"
  | "alerts"
  | "assign";

type ToggleKey = "team" | "routing" | "phones" | "idx" | "integrations" | "sources" | "plans" | "lists" | "alerts" | "assign";

const WorkspaceContext = createContext<Ctx | null>(null);

function uid() {
  return crypto.randomUUID();
}

function seed(): Workspace {
  return {
    profile: {
      name: "Casey Archibald",
      email: "agent@example.com",
      phone: "(604) 363-7858",
      title: "Personal Real Estate Corporation",
      bio: "Demo agent profile for the Greater Vancouver home search site.",
    },
    billing: {
      plan: "CINC Pro (placeholder)",
      seats: "3",
      card: "Visa ending 4242",
      status: "Demo — not billed",
    },
    team: [
      { id: "u1", name: "Casey Archibald", email: "agent@example.com", role: "Owner", active: true },
      { id: "u2", name: "Alex Chen", email: "alex@example.com", role: "Agent", active: true },
      { id: "u3", name: "Jordan Lee", email: "jordan@example.com", role: "ISA", active: false },
    ],
    routing: [
      { id: "r1", name: "Website registrations", source: "IDX registration", assignTo: "Round robin", active: true },
      { id: "r2", name: "Home estimate", source: "Home estimate", assignTo: "Casey Archibald", active: true },
    ],
    notifications: [
      { id: "n1", event: "New lead", email: true, sms: true },
      { id: "n2", event: "Showing request", email: true, sms: false },
      { id: "n3", event: "Missed text", email: false, sms: true },
    ],
    phones: [
      { id: "p1", label: "Main office", number: "(604) 363-7858", kind: "voice", active: true },
      { id: "p2", label: "Text line", number: "(604) 555-0199", kind: "text", active: true },
    ],
    signatures: [
      {
        id: "s1",
        name: "Default",
        body: "Casey Archibald\nArchibald Real Estate Group\n(604) 363-7858",
        isDefault: true,
      },
    ],
    website: [
      { id: "w1", label: "Site name", value: "Greater Vancouver Area Home Search" },
      { id: "w2", label: "Primary color", value: "#1976d2" },
    ],
    idx: [
      { id: "i1", name: "Vancouver under $1.5M", criteria: "Vancouver, max $1,500,000", cadence: "Daily", active: true },
    ],
    integrations: [
      { id: "g1", name: "Google Calendar", connected: false, notes: "Not connected in this demo." },
      { id: "g2", name: "Follow Up Boss", connected: false, notes: "" },
    ],
    sources: [
      { id: "ls1", name: "Website", active: true },
      { id: "ls2", name: "Open house", active: true },
      { id: "ls3", name: "Referral", active: true },
    ],
    tags: [
      { id: "t1", name: "Hot", color: "#e53935" },
      { id: "t2", name: "Buyer", color: "#1976d2" },
      { id: "t3", name: "Seller", color: "#4caf50" },
    ],
    fields: [
      { id: "f1", name: "Pre-approved", fieldType: "Yes/No", required: false },
      { id: "f2", name: "Timeframe", fieldType: "Text", required: false },
    ],
    plans: CRM_AUTOTRACKS.map((track) => ({
      id: track.id,
      name: track.name,
      category: track.category,
      active: track.status === "active",
      trigger: "new-lead" as Trigger,
      steps: [
        { id: `${track.id}-e`, kind: "email" as StepKind, title: "Intro email", body: "Thanks for reaching out.", waitDays: 0 },
        { id: `${track.id}-w`, kind: "wait" as StepKind, title: "Wait", body: "", waitDays: 2 },
        { id: `${track.id}-t`, kind: "text" as StepKind, title: "Check-in text", body: "Still looking?", waitDays: 0 },
        { id: `${track.id}-k`, kind: "task" as StepKind, title: "Call the lead", body: "Phone follow-up", waitDays: 0 },
      ],
    })),
    templates: [
      { id: "tm1", channel: "email", name: "Buyer welcome", subject: "Welcome", body: "Glad you are searching Greater Vancouver." },
      { id: "tm2", channel: "text", name: "Quick hello", subject: "", body: "Hi, this is Casey. Want me to send matching homes?" },
    ],
    lists: [
      { id: "sl1", name: "New buyers this week", rule: "Type is Buyer and created in the last 7 days", active: true },
      { id: "sl2", name: "No contact in 14 days", rule: "Last activity older than 14 days", active: true },
    ],
    alerts: [
      { id: "la1", name: "Kitsilano houses", area: "Kitsilano", minPrice: "1500000", maxPrice: "3000000", active: true },
    ],
    assign: [
      { id: "aa1", name: "New website leads", when: "new-lead", assignTo: "Casey Archibald", active: true },
    ],
  };
}

export function AgentWorkspaceProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Workspace>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...seed(), ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data, ready]);

  const saveProfile = useCallback((profile: Profile) => {
    setData((d) => ({ ...d, profile }));
  }, []);
  const saveBilling = useCallback((billing: Billing) => {
    setData((d) => ({ ...d, billing }));
  }, []);

  const upsert = useCallback(<K extends ListKey>(key: K, item: Workspace[K][number]) => {
    setData((d) => {
      const list = d[key] as { id: string }[];
      const exists = list.some((row) => row.id === item.id);
      const next = exists
        ? list.map((row) => (row.id === item.id ? item : row))
        : [item, ...list];
      return { ...d, [key]: next };
    });
  }, []);

  const remove = useCallback((key: ListKey, id: string) => {
    setData((d) => ({
      ...d,
      [key]: (d[key] as { id: string }[]).filter((row) => row.id !== id),
    }));
  }, []);

  const toggle = useCallback((key: ToggleKey, id: string) => {
    setData((d) => ({
      ...d,
      [key]: (d[key] as { id: string; active?: boolean; connected?: boolean }[]).map((row) => {
        if (row.id !== id) return row;
        if (key === "integrations") return { ...row, connected: !row.connected };
        return { ...row, active: !row.active };
      }),
    }));
  }, []);

  const setNotify = useCallback((id: string, channel: "email" | "sms", value: boolean) => {
    setData((d) => ({
      ...d,
      notifications: d.notifications.map((n) =>
        n.id === id ? { ...n, [channel]: value } : n
      ),
    }));
  }, []);

  const setDefaultSignature = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      signatures: d.signatures.map((s) => ({ ...s, isDefault: s.id === id })),
    }));
  }, []);

  const value = useMemo(
    () => ({
      ready,
      data,
      saveProfile,
      saveBilling,
      upsert,
      remove,
      toggle,
      setNotify,
      setDefaultSignature,
    }),
    [ready, data, saveProfile, saveBilling, upsert, remove, toggle, setNotify, setDefaultSignature]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within AgentWorkspaceProvider");
  return ctx;
}

export function newId() {
  return uid();
}
