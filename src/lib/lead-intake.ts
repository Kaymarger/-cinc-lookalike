import { consentGrantedInBrowser } from "./ads-consent";
import { googleAdsId, googleAdsLeadLabel } from "./google-ads";
import { pixelEventsForLead } from "./meta-pixel-events";

/** Shared lead payload checks. Safe to import from the browser and the server. */

export const LEAD_CONSENT_TEXT =
  "I agree to receive listing emails and messages from Archibald Real Estate Group about homes that match my search, by email, phone, or text. I can unsubscribe at any time. Consent is not a condition of any purchase. Message and data rates may apply. Reply STOP to opt out of texts.";

export const CAPTURE_SOURCES = [
  "showing_request",
  "ask_question",
  "registration",
  "photo_gate",
  "search_alert",
  "general",
  "buyer_signup",
  "seller_signup",
  "home_valuation",
] as const;

export type CaptureSource = (typeof CAPTURE_SOURCES)[number];

export const LEAD_INTENTS = ["buyer", "seller", "valuation", "inquiry"] as const;
export type LeadIntent = (typeof LEAD_INTENTS)[number];

export type LeadAttribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
  landingPath?: string;
  landingUrl?: string;
  referrer?: string;
  device?: "mobile" | "desktop";
  timeframe?: string;
  firstTimeBuyer?: boolean;
  preApproved?: boolean;
};

export type SanitizedLead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  smsOptIn: boolean;
  source: CaptureSource;
  intent: LeadIntent;
  propertyAddress?: string;
  propertyId?: string;
  searchLabel?: string;
  notes: string;
  consent: boolean;
  consentText?: string;
  attribution: LeadAttribution;
  assignedTo: string;
  createdAt: string;
};

const SOURCE_SET = new Set<string>(CAPTURE_SOURCES);
const INTENT_SET = new Set<string>(LEAD_INTENTS);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function intentFor(source: CaptureSource, requested: string): LeadIntent {
  if (INTENT_SET.has(requested)) return requested as LeadIntent;
  if (source === "buyer_signup" || source === "registration") return "buyer";
  if (source === "seller_signup") return "seller";
  if (source === "home_valuation") return "valuation";
  return "inquiry";
}

export function sanitizeAttribution(value: unknown): LeadAttribution {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const pick = (key: keyof LeadAttribution, max = 300) => {
    const text = cleanText(raw[key], max);
    return text || undefined;
  };
  const attribution: LeadAttribution = {
    utmSource: pick("utmSource"),
    utmMedium: pick("utmMedium"),
    utmCampaign: pick("utmCampaign"),
    utmTerm: pick("utmTerm"),
    utmContent: pick("utmContent"),
    gclid: pick("gclid"),
    gbraid: pick("gbraid"),
    wbraid: pick("wbraid"),
    fbclid: pick("fbclid"),
    fbc: pick("fbc"),
    fbp: pick("fbp"),
    landingPath: pick("landingPath", 500),
    landingUrl: pick("landingUrl", 500),
    referrer: pick("referrer", 500),
    device: raw.device === "mobile" || raw.device === "desktop" ? raw.device : undefined,
    timeframe: pick("timeframe", 80),
    firstTimeBuyer: raw.firstTimeBuyer === true ? true : raw.firstTimeBuyer === false ? false : undefined,
    preApproved: raw.preApproved === true ? true : raw.preApproved === false ? false : undefined,
  };
  return Object.fromEntries(
    Object.entries(attribution).filter(([, entry]) => entry !== undefined && entry !== "")
  ) as LeadAttribution;
}

/** Keep the first click ids. Later visits fill only the fields that are still empty. */
export function firstTouchAttribution(
  stored: LeadAttribution | undefined,
  incoming: LeadAttribution | undefined
): LeadAttribution {
  return sanitizeAttribution({ ...sanitizeAttribution(incoming), ...sanitizeAttribution(stored) });
}

export function attributionSummary(attribution: LeadAttribution | undefined): string {
  if (!attribution) return "";
  const campaign = [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign]
    .filter(Boolean)
    .join(" / ");
  return [
    campaign ? `Campaign: ${campaign}` : "",
    attribution.utmTerm ? `Term: ${attribution.utmTerm}` : "",
    attribution.utmContent ? `Content: ${attribution.utmContent}` : "",
    adChannel(attribution) ? `Channel: ${adChannel(attribution)}` : "",
    attribution.gclid ? `gclid: ${attribution.gclid}` : "",
    attribution.gbraid ? `gbraid: ${attribution.gbraid}` : "",
    attribution.wbraid ? `wbraid: ${attribution.wbraid}` : "",
    attribution.fbclid ? `fbclid: ${attribution.fbclid}` : "",
    attribution.fbc ? `fbc: ${attribution.fbc}` : "",
    attribution.fbp ? `fbp: ${attribution.fbp}` : "",
    attribution.landingUrl ? `Landing URL: ${attribution.landingUrl}` : "",
    attribution.landingPath ? `Landing: ${attribution.landingPath}` : "",
    attribution.referrer ? `Referrer: ${attribution.referrer}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
}

export function newLeadId(): string {
  return `lead-${crypto.randomUUID()}`;
}

function acceptableId(value: string): boolean {
  return /^lead-[A-Za-z0-9_-]{6,80}$/.test(value);
}

export function sanitizeLeadInput(
  body: unknown,
  options: { assignedTo: string; now?: string }
): { ok: true; lead: SanitizedLead } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Enter your contact details to continue." };
  }
  const raw = body as Record<string, unknown>;
  if (cleanText(raw.website, 200)) {
    return { ok: false, message: "honeypot" };
  }

  const source = cleanText(raw.source, 40);
  if (!SOURCE_SET.has(source)) {
    return { ok: false, message: "Choose how we should help you." };
  }
  const captureSource = source as CaptureSource;
  const name = cleanText(raw.name, 80);
  const email = cleanText(raw.email, 160).toLowerCase();
  const phone = cleanText(raw.phone, 40);
  const strict =
    captureSource === "buyer_signup" ||
    captureSource === "seller_signup" ||
    captureSource === "home_valuation";
  const needsConsent =
    strict ||
    captureSource === "registration" ||
    captureSource === "search_alert" ||
    captureSource === "showing_request" ||
    captureSource === "ask_question" ||
    captureSource === "photo_gate";

  if (name.length < 2) {
    return { ok: false, message: "Enter your full name." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Enter a valid email address." };
  }
  const digits = phone.replace(/\D/g, "");
  if (strict && digits.length < 7) {
    return { ok: false, message: "Enter a phone number so an agent can reach you." };
  }
  if (needsConsent && raw.consent !== true) {
    return { ok: false, message: "Consent is required before we can contact you." };
  }

  const requestedId = cleanText(raw.id, 90);
  const createdAt = options.now ?? new Date().toISOString();
  return {
    ok: true,
    lead: {
      id: acceptableId(requestedId) ? requestedId : newLeadId(),
      name,
      email,
      phone,
      smsOptIn: raw.smsOptIn === true || raw.smsOptIn === "on",
      source: captureSource,
      intent: intentFor(captureSource, cleanText(raw.intent, 20)),
      propertyAddress: cleanText(raw.propertyAddress, 180) || undefined,
      propertyId: cleanText(raw.propertyId, 40) || undefined,
      searchLabel: cleanText(raw.searchLabel, 180) || undefined,
      notes: cleanText(raw.notes, 4000),
      consent: raw.consent === true || (!strict && raw.consent !== false),
      consentText: raw.consent === true ? LEAD_CONSENT_TEXT : undefined,
      attribution: sanitizeAttribution(raw.attribution),
      assignedTo: cleanText(options.assignedTo, 80) || "Casey Archibald",
      createdAt,
    },
  };
}

export function readStoredAttribution(): LeadAttribution | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = sessionStorage.getItem("gvhs-attribution");
    if (!raw) return undefined;
    return sanitizeAttribution(JSON.parse(raw));
  } catch {
    return undefined;
  }
}

const CAPTURE_LABEL: Record<string, string> = {
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

const GOOGLE_SOURCES = /^(google|adwords|googleads|google-ads)$/i;
const META_SOURCES = /^(facebook|meta|instagram|ig|fb|fbads)$/i;

export function adChannel(attribution?: LeadAttribution): "Google Ads" | "Meta" | "" {
  if (!attribution) return "";
  const source = (attribution.utmSource || "").trim();
  if (attribution.gclid || attribution.gbraid || attribution.wbraid || GOOGLE_SOURCES.test(source)) return "Google Ads";
  if (attribution.fbclid || attribution.fbc || attribution.fbp || META_SOURCES.test(source)) return "Meta";
  return "";
}

/** Office-facing source. Keeps the request type and names Google or Meta when the click ids say so. */
export function officeLeadSource(source: string, attribution?: LeadAttribution): string {
  const label = source === "registration" ? "IDX Registration" : CAPTURE_LABEL[source] || source;
  const channel = adChannel(attribution);
  return channel ? `${channel} · ${label}` : label;
}

export function cleanArea(value: string | undefined | null): string {
  return String(value || "")
    .replace(/[^\p{L}\p{N}\s.'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

function usablePlace(value: string): string {
  if (value.length < 2) return "";
  if (/\b(home|house|sale|buy|realtor|listing|condo|search|http)\b/i.test(value)) return "";
  return value;
}

export function areaFromParams(params: Record<string, string | string[] | undefined>): string {
  const pick = (key: string) => {
    const raw = params[key];
    return cleanArea(Array.isArray(raw) ? raw[0] : raw);
  };
  return pick("area") || pick("city") || usablePlace(pick("utm_term"));
}

export function landingHeadline(area: string): string {
  return area ? `Find your next home in ${area}` : "Find your next home in Greater Vancouver";
}

export function matchedSearchPath(area: string): string {
  const params = new URLSearchParams();
  if (area) params.set("city", area);
  params.set("sort", "newest");
  return `/search?${params.toString()}`;
}

export function formatPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (digits.length < 4) return digits;
  if (digits.length < 7) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function normalizeEmailForAds(email: string): string {
  return email.trim().toLowerCase();
}

export function normalizePhoneForAds(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return digits ? `+${digits}` : "";
}

export async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function claimConversion(
  leadId: string | undefined,
  seen: Set<string>,
  read: (key: string) => string | null,
  write: (key: string, value: string) => void
): boolean {
  if (!leadId) return false;
  if (seen.has(leadId)) return false;
  const key = `gvhs-ads-lead:${leadId}`;
  try {
    if (read(key)) return false;
    write(key, "1");
  } catch {
    // Storage can be blocked. The in-memory set still stops a second call.
  }
  seen.add(leadId);
  return true;
}

type AdsWindow = Window & {
  __gvhsAds?: { meta?: string; google?: string; ga4?: string; label?: string };
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

const firedLeadIds = new Set<string>();

function adsCookiesAllowed(): boolean {
  return consentGrantedInBrowser();
}

/** Fires only after a lead is actually stored. Hashes are sent; raw contact details are not. */
export async function trackLeadConversion(
  source?: string,
  leadId?: string,
  contact?: { email?: string; phone?: string }
) {
  if (typeof window === "undefined") return;
  if (
    !claimConversion(
      leadId,
      firedLeadIds,
      (key) => sessionStorage.getItem(key),
      (key, value) => sessionStorage.setItem(key, value)
    )
  ) {
    return;
  }
  const email = contact?.email ? normalizeEmailForAds(contact.email) : "";
  const phone = contact?.phone ? normalizePhoneForAds(contact.phone) : "";
  const emailHash = email.includes("@") ? await sha256Hex(email) : "";
  const phoneHash = phone ? await sha256Hex(phone) : "";
  const ads = (window as AdsWindow).__gvhsAds;
  const allowed = adsCookiesAllowed();
  const fbq = (window as AdsWindow).fbq;
  if (allowed && typeof fbq === "function" && source && ads?.meta) {
    if (emailHash || phoneHash) {
      fbq("init", ads.meta, {
        ...(emailHash ? { em: emailHash } : {}),
        ...(phoneHash ? { ph: phoneHash } : {}),
      });
    }
    for (const item of pixelEventsForLead(source)) {
      fbq("track", item.event, item.params, { eventID: leadId });
    }
  }
  const gtag = (window as AdsWindow).gtag;
  if (typeof gtag !== "function" || !source || !pixelEventsForLead(source).some((item) => item.event === "Lead")) return;
  if (allowed && (emailHash || phoneHash)) {
    gtag("set", "user_data", {
      ...(emailHash ? { sha256_email_address: emailHash } : {}),
      ...(phoneHash ? { sha256_phone_number: phoneHash } : {}),
    });
  }
  const google = ads?.google || googleAdsId();
  const label = ads?.label || googleAdsLeadLabel();
  if (ads?.ga4) gtag("event", "generate_lead", { send_to: ads.ga4 });
  if (google && label) {
    gtag("event", "conversion", {
      send_to: `${google}/${label}`,
      value: 1.0,
      currency: "CAD",
      transaction_id: leadId,
    });
  }
}
