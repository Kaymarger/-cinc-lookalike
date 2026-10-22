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

export type DealStage = "showing" | "offer" | "contract" | "closed";

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
  status: "active" | "paused";
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
export type CallLog = { id: string; leadId: string; name: string; at: string; kind: "call" | "text" | "voicemail" };
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
};

const PROFILE: Profile = {
  email: "agent@example.com",
  cell: "(604) 363-7858",
  home: "",
  office: "(604) 363-7858",
  first: "Casey",
  last: "Archibald",
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
  signature: "Casey Archibald · Archibald Real Estate Group · (604) 363-7858",
  photoName: "",
};

const SETTINGS: SettingsForm = {
  leadTextAlerts: "Enabled",
  plainText: "No",
  chat: "Enabled",
  contactInfo: "Yes",
  leadSummary: "Yes",
  summaryOften: "Daily",
  landing: "Launchpad",
  usageReport: "Off",
  viewReport: "On",
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
      { id: "Appointment Request", description: "When a lead requests an appointment." },
      { id: "Appointment Confirmed", description: "When an appointment is confirmed." },
      { id: "Deal Reminder", description: "When a deal reminder is due." },
      { id: "AutoTrack Error", description: "When an AutoTrack step cannot send." },
    ],
  },
];

function defaultNotify(): Record<string, NotifyPref> {
  const all: Record<string, NotifyPref> = {};
  for (const group of NOTIFY_GROUPS) {
    for (const item of group.items) {
      all[item.id] = { cinc: true, email: group.title === "ESSENTIAL ALERTS", text: false };
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

const DEFAULT: SpaState = {
  pipeline: {},
  labels: { "crm-1": ["H"], "crm-2": ["N", "B"], "crm-5": ["R"] },
  assigned: {},
  leadType: {},
  trashed: [],
  alertFreq: {},
  signInAlert: {},
  notes: {},
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
  mail: [
    {
      id: "mail-1",
      folder: "inbox",
      kind: "text",
      to: "Casey Archibald",
      subject: "Lead assigned",
      body: "Lead Morgan Ellis has been reassigned to you. STOP=EndMsgs",
      at: "9:42 AM",
      unread: true,
    },
    {
      id: "mail-2",
      folder: "inbox",
      kind: "text",
      to: "Casey Archibald",
      subject: "Lead assigned",
      body: "Lead Jordan Blake has been reassigned to you. STOP=EndMsgs",
      at: "9:41 AM",
      unread: true,
    },
    {
      id: "mail-3",
      folder: "inbox",
      kind: "email",
      to: "Casey Archibald",
      subject: "New inquiry",
      body: "Avery Quinn asked about 810 235 Keith Road.",
      at: "Yesterday",
    },
  ],
  templates: [
    {
      id: "tpl-1",
      group: "ISA",
      name: "ISA Welcome Email",
      type: "Email",
      createdBy: "Casey Archibald",
      edited: "Oct 12, 2026",
      body: "Thanks for registering. I am Casey Archibald and I will follow up shortly.",
    },
    {
      id: "tpl-2",
      group: "ISA",
      name: "ISA Follow-up Text",
      type: "Text",
      createdBy: "Casey Archibald",
      edited: "Oct 12, 2026",
      body: "Hi, this is Casey with Archibald Real Estate Group. Is now a good time to chat?",
    },
    {
      id: "tpl-3",
      group: "Uncategorized",
      name: "Quick hello",
      type: "Email",
      createdBy: "Casey Archibald",
      edited: "Oct 2, 2026",
      body: "Just checking in.",
    },
    {
      id: "tpl-4",
      group: "Shared",
      name: "Team introduction",
      type: "Email",
      createdBy: "Team",
      edited: "Sep 18, 2026",
      body: "Welcome to the team inbox.",
    },
    {
      id: "tpl-5",
      group: "CINC Templates",
      name: "New lead day 1",
      type: "Email",
      createdBy: "CINC",
      edited: "Jan 4, 2026",
      body: "Thanks for your interest in Greater Vancouver homes.",
    },
  ],
  groups: ["ISA", "Uncategorized", "Shared", "CINC Templates"],
  tracks: [],
  hiddenTracks: [],
  pocket: [],
  campaigns: [
    {
      id: "camp-1",
      name: "New inquiry reply",
      message: "Thanks for reaching out. I am Casey and I will send details shortly.",
      active: true,
    },
  ],
  openHouses: [],
  landingPages: [
    { id: "lp-1", name: "Buyer Guide", category: "buyers", url: "/landing/buyer-guide", active: true },
    { id: "lp-2", name: "What's My Home Worth", category: "sellers", url: "/seller/homeestimate", active: true },
    { id: "lp-3", name: "Contact Casey", category: "contact", url: "/contact", active: true },
  ],
  sites: [],
  profile: PROFILE,
  settings: SETTINGS,
  notifications: defaultNotify(),
  integrations: {},
  customLinks: [],
  behavioral: {
    "New Listing Match": true,
    "Price Change": true,
    "Open House Nearby": false,
  },
  plan: "agent",
  requests: {},
  savedSearches: {},
  info: {},
  buyerMatches: {},
  customFilters: [],
};

function load(raw: string | null): SpaState {
  if (!raw) return DEFAULT;
  try {
    const parsed = JSON.parse(raw) as Partial<SpaState>;
    return {
      ...DEFAULT,
      ...parsed,
      profile: { ...DEFAULT.profile, ...parsed.profile },
      settings: { ...DEFAULT.settings, ...parsed.settings },
      notifications: { ...DEFAULT.notifications, ...parsed.notifications },
      behavioral: { ...DEFAULT.behavioral, ...parsed.behavioral },
      labels: { ...DEFAULT.labels, ...parsed.labels },
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
