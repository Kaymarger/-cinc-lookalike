import { MERGE_TAGS } from "./cinc-options";

export const AUTOTRACK_HOURS = [
  "9 AM - 5 PM, Monday - Friday",
  "9 AM - 5 PM, Monday - Sunday",
  "9 AM - 9 PM, Monday - Friday",
  "9 AM - 9 PM, Monday - Sunday",
] as const;

export const EMAIL_FOOTER =
  "The recipient of this message is [EMAIL]. Archibald Real Estate Group, 300 - 1195 W Broadway. 604-363-7858 / If you do not wish to receive these messages in the future, click https://www.greatervancouverhomesearch.com/account/settings/?[AUTOLOGINQS] to unsubscribe.";

export const AUTOTRACK_CATEGORIES = ["General", "Buyer", "Listing", "Nurture", "Past Client", "My AutoTracks"] as const;

export const COMPLETION_ACTIONS = [
  "Take No Further Action",
  "Automatically Start Another AutoTrack",
  "Automatically Restart This AutoTrack",
  "Apply a Label",
] as const;

export const STEP_ACTIONS = ["email", "text", "task"] as const;

export type StepAction = (typeof STEP_ACTIONS)[number];
export type TrackStatus = "active" | "paused" | "disabled" | "draft";
export type BodyFormat = "html" | "plain";

export type AutoTrackFile = {
  id: string;
  name: string;
  contentType: string;
  size: number;
};

export type AutoTrackStep = {
  id: string;
  day: number;
  action: StepAction;
  subject: string;
  body: string;
  format: BodyFormat;
  to: string;
  from: string;
  template: string;
  schedule: "immediate" | "specific";
  scheduleTime: string;
  meridiem: "AM" | "PM";
  delayMinutes: number;
  afterPrevious: boolean;
  calendarOn: string;
  attachments: AutoTrackFile[];
  videoUrl: string;
  videoTitle: string;
  reminderType: string;
  blocking: boolean;
};

export type AutoTrackDocument = {
  id: string;
  name: string;
  category: string;
  status: TrackStatus;
  trigger: string;
  stopTrigger: string;
  leadTypes: string[];
  hours: string;
  includeWeekend: boolean;
  skipHolidays: boolean;
  startNewLead: boolean;
  startLabel: string;
  startStage: string;
  landing: string;
  customField: string;
  source: string;
  sources: string[];
  stopLabel: string;
  stopStage: string;
  stopReply: boolean;
  complete: string;
  completeTrack: string;
  completeLabel: string;
  share: boolean;
  owner: string;
  visibility: "public" | "private";
  captured: boolean;
  seedRevision: number;
  userEdited: boolean;
  steps: AutoTrackStep[];
};

export type MergeSample = Record<(typeof MERGE_TAGS)[number], string>;

/** Sample lead used only to fill merge tags in Preview. Names match the demo CRM, not a real client. */
export const SAMPLE_MERGE: MergeSample = {
  "[FIRSTNAME]": "Jordan",
  "[LASTNAME]": "Blake",
  "[FULLNAME]": "Jordan Blake",
  "[CELLPHONE]": "(778) 555-0144",
  "[EMAIL]": "jordan.blake@example.com",
  "[FAVORITE CITY]": "Burnaby",
  "[ADDRESS]": "405 4189 Cambie Street, Vancouver",
  "[SECONDARY CONTACT]": "Alex Blake",
  "[WEBSITE]": "https://cinc-lookalike.vercel.app",
  "[TIMEOFDAY]": "afternoon",
  "[AGENT FIRSTNAME]": "Casey",
  "[AGENT LASTNAME]": "Archibald",
  "[AGENT CELLPHONE]": "(604) 363-7858",
  "[AGENT CINC NUMBER]": "4829103344556677",
  "[AGENT EMAIL]": "agent@example.com",
  "[AGENT LICENSENUMBER]": "BC-000000",
  "[LISTINGAGENT FIRSTNAME]": "Casey",
  "[LISTINGAGENT LASTNAME]": "Archibald",
  "[LISTINGAGENT CELLPHONE]": "(604) 363-7858",
  "[LISTINGAGENT EMAIL]": "agent@example.com",
  "[PARTNER FIRSTNAME]": "Kayla",
  "[PARTNER LASTNAME]": "Gerak",
  "[PARTNER CELLPHONE]": "(604) 555-0102",
  "[PARTNER EMAIL]": "kayla.gerak@example.com",
  "[PARTNER COMPANY]": "Archibald Real Estate Group",
  "[PARTNER WEBSITE]": "https://cinc-lookalike.vercel.app",
  "[PARTNER LICENSE]": "BC-000001",
  "[DAYOFWEEK]": "Friday",
  "[MARKETREPORTLINK]": "https://cinc-lookalike.vercel.app/info/market-update",
  "[CHANGE_SETTINGS_LINK]": "https://cinc-lookalike.vercel.app/account",
  "[APPURL]": "https://cinc-lookalike.vercel.app",
  "[LOAN_APP_URL]": "https://cinc-lookalike.vercel.app/contact",
};

export const TEMPLATE_BODIES: Record<string, { subject: string; body: string }> = {
  Welcome: {
    subject: "Welcome, [FIRSTNAME]",
    body: "Hi [FIRSTNAME], welcome. Your agent is [AGENT FIRSTNAME] [AGENT LASTNAME].",
  },
  "Market Update": {
    subject: "Market update for [FAVORITE CITY]",
    body: "Hi [FIRSTNAME], here is this week's update for [FAVORITE CITY]. [MARKETREPORTLINK]",
  },
  "Showing Follow Up": {
    subject: "Following up on [ADDRESS]",
    body: "Hi [FIRSTNAME], thanks for touring [ADDRESS]. Reply to [AGENT FIRSTNAME] any time.",
  },
};

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_BODY = 20_000;
const MAX_FILES = 5;

export function insertAtCursor(value: string, start: number, end: number, insert: string) {
  const safeStart = Math.max(0, Math.min(start, value.length));
  const safeEnd = Math.max(safeStart, Math.min(end, value.length));
  const next = value.slice(0, safeStart) + insert + value.slice(safeEnd);
  return { value: next, caret: safeStart + insert.length };
}

export function fillMergeTags(input: string, sample: MergeSample = SAMPLE_MERGE): string {
  let out = input;
  for (const tag of MERGE_TAGS) out = out.split(tag).join(sample[tag]);
  return out;
}

export function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return parsed.pathname.split("/").filter(Boolean)[0] || null;
    if (host === "youtube.com" || host === "m.youtube.com") {
      const watch = parsed.searchParams.get("v");
      if (watch) return watch;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((part) => part === "embed" || part === "shorts");
      if (marker >= 0) return parts[marker + 1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function videoThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

export function videoBlock(url: string, title: string, format: BodyFormat): string {
  const safeUrl = url.trim();
  const safeTitle = title.trim() || "Video";
  if (!safeUrl) return "";
  if (format === "plain") return `\nVideo: ${safeTitle}\n${safeUrl}\n`;
  const thumb = videoThumbnail(safeUrl);
  const image = thumb ? `<img src="${escapeAttr(thumb)}" alt="${escapeAttr(safeTitle)}" width="320" />` : escapeText(safeTitle);
  return `<figure data-video="${escapeAttr(safeUrl)}"><a href="${escapeAttr(safeUrl)}">${image}</a><figcaption>${escapeText(safeTitle)}</figcaption></figure>`;
}

export function sanitizeEmailHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?(iframe|object|embed|link|meta)[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/javascript:/gi, "");
}

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

export type StepPreview = {
  subject: string;
  body: string;
  format: BodyFormat;
  attachments: AutoTrackFile[];
  videoUrl: string;
  videoTitle: string;
  to: string;
  from: string;
};

/** What this step would send: merge tags filled, attachments and video included. */
export function deliveryPayload(step: AutoTrackStep, sample: MergeSample = SAMPLE_MERGE): StepPreview {
  return {
    subject: fillMergeTags(step.subject, sample),
    body: fillMergeTags(step.format === "html" ? sanitizeEmailHtml(step.body) : step.body, sample),
    format: step.format,
    attachments: step.attachments,
    videoUrl: step.videoUrl,
    videoTitle: step.videoTitle,
    to: step.to,
    from: step.from,
  };
}

export function stepSummary(step: AutoTrackStep): string {
  const kind = step.action === "email" ? "Email" : step.action === "text" ? "Text" : "Reminder";
  const label = step.subject.trim() || step.body.trim().slice(0, 80) || "Untitled";
  const when = step.calendarOn ? `${step.calendarOn} · ` : "";
  return `${when}Day ${step.day} · offset ${Math.max(0, step.day - 1)} · ${kind} · ${label}`;
}

export function statusLabel(status: TrackStatus): string {
  if (status === "active") return "Active";
  if (status === "paused") return "Paused";
  if (status === "disabled") return "Disabled";
  return "Draft";
}

export function emptyStep(action: StepAction, day: number, id: string): AutoTrackStep {
  return {
    id,
    day,
    action,
    subject: action === "task" ? "Call" : "",
    body: "",
    format: "html",
    to: action === "task" ? "Buyer's Agent" : "Lead",
    from: "Buyer's Agent",
    template: "",
    schedule: "immediate",
    scheduleTime: "09:00",
    meridiem: "AM",
    delayMinutes: 0,
    afterPrevious: false,
    calendarOn: "",
    attachments: [],
    videoUrl: "",
    videoTitle: "",
    reminderType: "Call",
    blocking: false,
  };
}

function clip(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export function sanitizeStep(input: unknown, index: number): AutoTrackStep | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Partial<AutoTrackStep>;
  const action = oneOf(raw.action, STEP_ACTIONS, "email");
  const day = Math.min(365, Math.max(1, Math.round(Number(raw.day) || 1)));
  const id = ID_RE.test(String(raw.id ?? "")) ? String(raw.id) : `step-${index + 1}`;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.slice(0, MAX_FILES).flatMap((file) => {
        if (!file || typeof file !== "object") return [];
        const item = file as Partial<AutoTrackFile>;
        if (!ID_RE.test(String(item.id ?? ""))) return [];
        return [{
          id: String(item.id),
          name: clip(item.name, 180) || "attachment",
          contentType: clip(item.contentType, 120) || "application/octet-stream",
          size: Math.max(0, Math.round(Number(item.size) || 0)),
        }];
      })
    : [];
  return {
    id,
    day,
    action,
    subject: clip(raw.subject, 300),
    body: clip(raw.body, MAX_BODY),
    format: raw.format === "plain" ? "plain" : "html",
    to: clip(raw.to, 120) || "Lead",
    from: clip(raw.from, 120),
    template: clip(raw.template, 120),
    schedule: raw.schedule === "specific" ? "specific" : "immediate",
    scheduleTime: clip(raw.scheduleTime, 8) || "09:00",
    meridiem: raw.meridiem === "PM" ? "PM" : "AM",
    delayMinutes: Math.max(0, Math.min(24 * 60, Math.round(Number(raw.delayMinutes) || 0))),
    afterPrevious: Boolean(raw.afterPrevious),
    calendarOn: clip(raw.calendarOn, 80),
    attachments,
    videoUrl: clip(raw.videoUrl, 500),
    videoTitle: clip(raw.videoTitle, 180),
    reminderType: oneOf(raw.reminderType, ["Call", "Email", "Other"] as const, "Call"),
    blocking: Boolean(raw.blocking),
  };
}

export function triggerLabel(doc: Pick<AutoTrackDocument, "startStage" | "startLabel" | "landing" | "source" | "customField">): string {
  return doc.startStage || doc.startLabel || doc.landing || doc.source || doc.customField || "New Lead";
}

export function stopLabel(doc: Pick<AutoTrackDocument, "stopReply" | "stopStage" | "stopLabel">): string {
  if (doc.stopReply) return "When Lead Replies/Reaches Out";
  return doc.stopStage || doc.stopLabel || "";
}

export function sanitizeTrack(input: unknown): { ok: true; value: AutoTrackDocument } | { ok: false; message: string } {
  if (!input || typeof input !== "object") return { ok: false, message: "Enter the AutoTrack." };
  const raw = input as Partial<AutoTrackDocument>;
  const name = clip(raw.name, 160).trim();
  if (!name) return { ok: false, message: "Enter a name." };
  if (!ID_RE.test(String(raw.id ?? ""))) return { ok: false, message: "That AutoTrack id is not valid." };
  const steps = (Array.isArray(raw.steps) ? raw.steps : [])
    .map((step, index) => sanitizeStep(step, index))
    .filter((step): step is AutoTrackStep => Boolean(step))
    .slice(0, 40);
  const leadTypes = (Array.isArray(raw.leadTypes) ? raw.leadTypes : [])
    .map((item) => clip(item, 40))
    .filter((item) => ["Everyone", "Buyer", "Seller", "Buyer & Seller", "Recruit"].includes(item));
  const value: AutoTrackDocument = {
    id: String(raw.id),
    name,
    category: oneOf(raw.category, AUTOTRACK_CATEGORIES, "General"),
    status: oneOf(raw.status, ["active", "paused", "disabled", "draft"] as const, "draft"),
    leadTypes: leadTypes.length ? leadTypes : ["Everyone"],
    hours: oneOf(raw.hours, AUTOTRACK_HOURS, AUTOTRACK_HOURS[0]),
    includeWeekend: Boolean(raw.includeWeekend),
    skipHolidays: Boolean(raw.skipHolidays),
    startNewLead: Boolean(raw.startNewLead),
    startLabel: clip(raw.startLabel, 80),
    startStage: clip(raw.startStage, 80),
    landing: clip(raw.landing, 80),
    customField: clip(raw.customField, 40),
    source: clip(raw.source, 800),
    sources: (Array.isArray(raw.sources) ? raw.sources : []).map((item) => clip(item, 120)).filter(Boolean).slice(0, 40),
    stopLabel: clip(raw.stopLabel, 80),
    stopStage: clip(raw.stopStage, 80),
    stopReply: raw.stopReply !== false,
    complete: oneOf(raw.complete, COMPLETION_ACTIONS, "Take No Further Action"),
    completeTrack: clip(raw.completeTrack, 160),
    completeLabel: clip(raw.completeLabel, 80),
    share: Boolean(raw.share),
    owner: clip(raw.owner, 80),
    visibility: raw.visibility === "private" ? "private" : "public",
    captured: Boolean(raw.captured),
    seedRevision: Math.max(0, Math.round(Number(raw.seedRevision) || 0)),
    userEdited: Boolean(raw.userEdited),
    steps,
    trigger: "",
    stopTrigger: "",
  };
  value.trigger = triggerLabel(value);
  value.stopTrigger = stopLabel(value);
  return { ok: true, value };
}

export function documentFrom(partial: Partial<AutoTrackDocument> & { id: string; name: string }): AutoTrackDocument {
  const base = blankDocument(partial.id, partial.name);
  const parsed = sanitizeTrack({ ...base, ...partial, id: partial.id, name: partial.name, steps: partial.steps ?? [] });
  return parsed.ok ? parsed.value : base;
}

export function blankDocument(id: string, name = "Blank Template Copy"): AutoTrackDocument {
  const sanitized = sanitizeTrack({
    id,
    name,
    category: "General",
    status: "draft",
    leadTypes: ["Everyone"],
    hours: AUTOTRACK_HOURS[0],
    stopReply: true,
    complete: "Take No Further Action",
    steps: [],
  });
  if (!sanitized.ok) throw new Error(sanitized.message);
  return sanitized.value;
}
