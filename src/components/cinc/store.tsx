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

const KEY = "gvhs-cinc-spa";

export type DealStage = "showing" | "offer" | "contract" | "closed" | "prelisting" | "active" | "pending";

export type Deal = {
  id: string;
  board: "purchases" | "listings";
  stage: DealStage;
  client: string;
  address: string;
  price: string;
  potential: string;
  status: "Active" | "Archived";
  createdAt: number;
};

export type Mail = {
  id: string;
  folder: "inbox" | "sent" | "drafts" | "trashed";
  kind: "email" | "text";
  from?: string;
  to: string;
  subject: string;
  body: string;
  at: string;
  unread?: boolean;
};

export type Template = {
  id: string;
  group: string;
  name: string;
  type: "Email" | "Text";
  createdBy: string;
  edited: string;
  body: string;
};

export type Track = {
  id: string;
  name: string;
  category: string;
  status: "active" | "paused" | "draft";
  trigger: string;
};

export type Pocket = {
  id: string;
  address: string;
  mls: string;
  status: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  feature: string;
};

export type Campaign = {
  id: string;
  name: string;
  message: string;
  active: boolean;
  number?: string;
  property?: string;
  code?: string;
};

export type LandingPage = {
  id: string;
  name: string;
  category: "buyers" | "sellers" | "contact";
  url: string;
  active: boolean;
};

export type Note = { id: string; body: string; at: string };
export type Reminder = { id: string; leadId: string; title: string; due: string; done: boolean; day: string };
export type Appt = { id: string; leadId: string; title: string; when: string; request?: boolean };
export type CallLog = { id: string; leadId: string; name: string; at: string; kind: "call" | "text" | "voicemail" | "email"; body?: string };
export type Assign = { agent: string; partner: string; listing: string };

export type Profile = {
  email: string;
  cell: string;
  home: string;
  office: string;
  first: string;
  last: string;
  title: string;
  license: string;
  loan: string;
  bio: string;
  subdomain: string;
  facebook: string;
  google: string;
  pinterest: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  signature: string;
  photoName: string;
};

export type NotifyPref = { cinc: boolean; email: boolean; text: boolean };

export type SettingsForm = {
  leadTextAlerts: "Disabled" | "Enabled";
  plainText: "No" | "Yes";
  chat: "Disabled" | "Enabled";
  contactInfo: "No" | "Yes";
  leadSummary: "No" | "Yes";
  summaryOften: "Daily" | "Weekly" | "Monthly";
  landing: "Leads Dashboard" | "Launchpad";
  usageReport: "Off" | "On";
  viewReport: "Off" | "On";
  viewCount: string;
  viewNotes: "Off" | "On";
};

export type SpaState = {
  pipeline: Record<string, string>;
  labels: Record<string, string[]>;
  assigned: Record<string, Assign>;
  leadType: Record<string, string>;
  trashed: string[];
  alertFreq: Record<string, string>;
  signInAlert: Record<string, boolean>;
  notes: Record<string, Note[]>;
  reminders: Reminder[];
  appointments: Appt[];
  calls: CallLog[];
  deals: Deal[];
  mail: Mail[];
  templates: Template[];
  groups: string[];
  tracks: Track[];
  hiddenTracks: string[];
  pocket: Pocket[];
  campaigns: Campaign[];
  openHouses: { id: string; address: string; when: string; virtual?: boolean }[];
  landingPages: LandingPage[];
  sites: { id: string; name: string }[];
  profile: Profile;
  settings: SettingsForm;
  notifications: Record<string, NotifyPref>;
  integrations: Record<string, boolean>;
  customLinks: { id: string; label: string; url: string }[];
  behavioral: Record<string, boolean>;
  plan: "agent" | "team";
  requests: Record<string, "awaiting" | "acted" | "dismissed">;
  savedSearches: Record<string, string[]>;
  info: Record<string, Record<string, string>>;
  buyerMatches: Record<string, boolean>;
  customFilters: string[];
  leadTracks: Record<string, { id: string; name: string; cancelled?: boolean }[]>;
  verify: Record<string, "verified" | "unlocked" | "locked">;
  dataVersion: number;
};

const PROFILE: Profile = {
  email: "agent@example.com",
  cell: "(604) 363-7858",
  home: "",
  office: "(604) 363-7858",
  first: "Kayla",
  last: "Gerak",
  title: "Realtor",
  license: "",
  loan: "",
  bio: "Archibald Real Estate Group — Greater Vancouver homes.",
  subdomain: "casey",
  facebook: "https://www.facebook.com/caseyarchibaldvancouverrealtor",
  google: "",
  pinterest: "",
  twitter: "",
  instagram: "https://www.instagram.com/caseyarchibald",
  youtube: "https://www.youtube.com/@caseyarchibaldvancouverrealtor",
  linkedin: "https://www.linkedin.com/in/casey-archibald-06836730",
  signature: "Kayla Gerak · Archibald Real Estate Group · (604) 363-7858",
  photoName: "",
};

const SETTINGS: SettingsForm = {
  leadTextAlerts: "Enabled",
  plainText: "No",
  chat: "Enabled",
  contactInfo: "Yes",
  leadSummary: "No",
  summaryOften: "Daily",
  landing: "Launchpad",
  usageReport: "Off",
  viewReport: "Off",
  viewCount: "5",
  viewNotes: "Off",
};

export const NOTIFY_GROUPS: { title: string; items: { id: string; description: string }[] }[] = [
  {
    title: "ESSENTIAL ALERTS",
    items: [
      { id: "New Leads", description: "When a new lead registers or is assigned to you." },
      { id: "Reminders", description: "When a reminder is due." },
      { id: "New Note", description: "When a teammate adds a note on your lead." },
      { id: "Request Showing", description: "When a lead requests a showing." },
      { id: "New Task", description: "When a task is assigned to you." },
    ],
  },
  {
    title: "LEAD ALERTS",
    items: [
      { id: "Contact Change Alert", description: "When a lead updates their phone or email." },
      { id: "High Property View", description: "When a lead views several listings in a short time." },
      { id: "Lead Login Alert", description: "When a lead signs in to the site." },
      { id: "Unsubscribed Alert", description: "When a lead unsubscribes from email." },
      { id: "Inquiry", description: "When a lead sends a property inquiry." },
      { id: "Existing Lead Home Value Request", description: "When an existing lead asks for a home value." },
    ],
  },
  {
    title: "AGENT ALERTS",
    items: [
      { id: "Lead Reassign", description: "When a lead is reassigned to you." },
      { id: "Direct Mail Activity", description: "When a lead scans a direct-mail piece." },
    ],
  },
];

function defaultNotify(): Record<string, NotifyPref> {
  const all: Record<string, NotifyPref> = {};
  for (const group of NOTIFY_GROUPS) {
    for (const item of group.items) {
      const emailOn = item.id === "Inquiry" || item.id === "Existing Lead Home Value Request";
      all[item.id] = { cinc: false, email: emailOn, text: true };
    }
  }
  return all;
}

export const INTEGRATIONS = [
  "Google",
  "Zapier",
  "CRM Connect",
  "Slack",
  "Zillow Tech Connect",
  "Zillow Contact API",
  "Dotloop",
  "Mojo",
  "API Nation",
  "External Email Tracking",
];

const DATA_VERSION = 6;

function buildTemplates(): Template[] {
  const rows: Template[] = [];
  const counts: [string, number][] = [
    ["ISA", 2],
    ["Uncategorized", 1],
    ["Shared Templates", 17],
    ["CINC Templates", 54],
  ];
  for (const [group, count] of counts) {
    for (let i = 1; i <= count; i++) {
      rows.push({
        id: `tpl-${group.replace(/\s+/g, "-").toLowerCase()}-${i}`,
        group,
        name: group === "ISA" && i === 1 ? "Day 2 - Text" : group === "ISA" && i === 2 ? "Day 15 - Text" : `${group === "CINC Templates" ? "CINC" : group.split(" ")[0]} ${i}`,
        type: group === "ISA" || i % 3 === 0 ? "Text" : "Email",
        createdBy: group === "CINC Templates" ? "CINC" : group === "Shared Templates" ? "Team" : "Kayla Gerak",
        edited: "09-14-2022",
        body: "Thanks for registering with Archibald Real Estate Group. This sample template stays on this device.",
      });
    }
  }
  return rows;
}

function buildMail(): Mail[] {
  const inbox: Mail[] = Array.from({ length: 100 }, (_, i) => ({
    id: `mail-in-${i + 1}`,
    folder: "inbox" as const,
    kind: (i % 8 === 0 ? "email" : "text") as Mail["kind"],
    from: "System",
    to: "Kayla Gerak",
    subject: "Lead assigned",
    body: `Lead sample ${i + 1} registered. View https://greatervancouverhomesearch.com/search/sample-${i + 1} STOP=EndMsgs`,
    at: `${(i % 12) || 12}:${String((i * 7) % 60).padStart(2, "0")} ${i % 2 ? "AM" : "PM"}`,
    unread: i < 8,
  }));
  const sent: Mail[] = [
    { id: "sent-1", folder: "sent", kind: "email", from: "CC", to: "Some Agent", subject: "Some subject", body: "Some Agent / Some subject", at: "5 days ago" },
    { id: "sent-2", folder: "sent", kind: "email", from: "SS", to: "Some Agent", subject: "Some subject", body: "Some Agent / Some subject", at: "5 days ago" },
    { id: "sent-3", folder: "sent", kind: "text", from: "CC", to: "Some Agent", subject: "Some subject", body: "Some Agent / Some subject", at: "5 days ago" },
  ];
  const drafts: Mail[] = [
    { id: "draft-1", folder: "drafts", kind: "email", to: "", subject: "", body: "", at: "Sep 16, 2026" },
    { id: "draft-2", folder: "drafts", kind: "email", to: "Morgan Ellis", subject: "Re: Saturday showing", body: "Following up on the sample showing request.", at: "Sep 16, 2026" },
  ];
  const trashed: Mail[] = Array.from({ length: 80 }, (_, i) => ({
    id: `trash-${i + 1}`,
    folder: "trashed" as const,
    kind: "text" as const,
    from: "System",
    to: "Kayla Gerak",
    subject: "Lead assigned",
    body: `Archived notice ${i + 1} for a sample lead. https://greatervancouverhomesearch.com/search/sample-${i + 1} STOP=EndMsgs`,
    at: `${(i % 12) || 12}:${String((i * 3) % 60).padStart(2, "0")} ${i % 2 ? "AM" : "PM"}`,
  }));
  return [...inbox, ...sent, ...drafts, ...trashed];
}

const DEFAULT: SpaState = {
  pipeline: {},
  labels: { "crm-1": ["H"], "crm-2": ["N", "B"], "crm-5": ["R"] },
  assigned: {},
  leadType: {},
  trashed: [],
  alertFreq: {},
  signInAlert: {},
  notes: {
    "crm-1": [{ id: "note-pin", body: "Already in contact with an agent.", at: "10/18/2026 at 2:10 PM" }],
  },
  reminders: [
    {
      id: "rem-1",
      leadId: "crm-1",
      title: "Call about the Kitchener inquiry",
      due: "Oct 20, 2026",
      done: false,
      day: "DAY 1 (CALL)",
    },
  ],
  appointments: [],
  calls: [],
  deals: [],
  mail: buildMail(),
  templates: buildTemplates(),
  groups: ["ISA", "Uncategorized", "Shared Templates", "CINC Templates"],
  tracks: [],
  hiddenTracks: [],
  pocket: [],
  campaigns: [],
  openHouses: [],
  landingPages: [
    { id: "lp-b1", name: "Buyer Guide", category: "buyers", url: "/info/buyer-guide", active: false },
    { id: "lp-s1", name: "Get More Money When You Sell", category: "sellers", url: "/info/get-more-money", active: true },
    { id: "lp-s2", name: "What's My Home Worth", category: "sellers", url: "/info/home-worth", active: false },
    { id: "lp-s3", name: "Seller Checklist", category: "sellers", url: "/info/seller-checklist", active: true },
    { id: "lp-s4", name: "Market Update", category: "sellers", url: "/info/market-update", active: false },
    { id: "lp-c1", name: "Contact the Team", category: "contact", url: "/info/contact", active: true },
    { id: "lp-c2", name: "Book a Call", category: "contact", url: "/info/book-a-call", active: false },
    { id: "lp-c3", name: "Office Hours", category: "contact", url: "/info/office-hours", active: false },
    { id: "lp-c4", name: "About the Team", category: "contact", url: "/info/team", active: true },
    { id: "lp-c5", name: "Careers", category: "contact", url: "/info/careers", active: false },
    { id: "lp-c6", name: "Newsletter", category: "contact", url: "/info/newsletter", active: false },
  ],
  sites: [],
  profile: PROFILE,
  settings: SETTINGS,
  notifications: defaultNotify(),
  integrations: {},
  customLinks: [],
  behavioral: {},
  plan: "agent",
  requests: {},
  savedSearches: {},
  info: {},
  buyerMatches: {},
  customFilters: [],
  leadTracks: {},
  verify: {},
  dataVersion: DATA_VERSION,
};

function load(raw: string | null): SpaState {
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw) as Partial<SpaState>;
    const fresh = parsed.dataVersion !== DATA_VERSION;
    return {
      ...DEFAULT,
      ...parsed,
      profile: fresh ? DEFAULT.profile : { ...DEFAULT.profile, ...parsed.profile },
      settings: fresh ? DEFAULT.settings : { ...DEFAULT.settings, ...parsed.settings },
      notifications: fresh ? DEFAULT.notifications : { ...DEFAULT.notifications, ...parsed.notifications },
      behavioral: fresh ? DEFAULT.behavioral : { ...DEFAULT.behavioral, ...parsed.behavioral },
      labels: { ...DEFAULT.labels, ...parsed.labels },
      mail: fresh ? DEFAULT.mail : parsed.mail ?? DEFAULT.mail,
      templates: fresh ? DEFAULT.templates : parsed.templates ?? DEFAULT.templates,
      groups: fresh ? DEFAULT.groups : parsed.groups ?? DEFAULT.groups,
      campaigns: fresh ? DEFAULT.campaigns : parsed.campaigns ?? DEFAULT.campaigns,
      landingPages: fresh ? DEFAULT.landingPages : parsed.landingPages ?? DEFAULT.landingPages,
      notes: fresh ? DEFAULT.notes : { ...DEFAULT.notes, ...parsed.notes },
      leadTracks: parsed.leadTracks ?? {},
      verify: parsed.verify ?? {},
      dataVersion: DATA_VERSION,
    };
  } catch {
    return DEFAULT;
  }
}

type Ctx = {
  ready: boolean;
  state: SpaState;
  patch: (partial: Partial<SpaState>) => void;
  update: (fn: (state: SpaState) => SpaState) => void;
};

const CincStoreContext = createContext<Ctx | null>(null);

export function CincStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SpaState>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(load(localStorage.getItem(KEY)));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(state));
  }, [ready, state]);

  const patch = useCallback((partial: Partial<SpaState>) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  const update = useCallback((fn: (state: SpaState) => SpaState) => {
    setState((current) => fn(current));
  }, []);

  const value = useMemo(() => ({ ready, state, patch, update }), [ready, state, patch, update]);
  return <CincStoreContext.Provider value={value}>{children}</CincStoreContext.Provider>;
}

export function useCinc() {
  const ctx = useContext(CincStoreContext);
  if (!ctx) throw new Error("useCinc must be used within CincStoreProvider");
  return ctx;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowLabel() {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
