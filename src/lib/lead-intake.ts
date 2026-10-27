/** Shared lead payload checks. Safe to import from the browser and the server. */

export const LEAD_CONSENT_TEXT =
  "I agree that Archibald Real Estate Group may contact me about this request by phone, email, or text at the number and email I provided. Consent is not a condition of any purchase. Message and data rates may apply. Message frequency varies. Reply STOP to opt out of texts.";

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
  fbclid?: string;
  landingPath?: string;
  referrer?: string;
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
    fbclid: pick("fbclid"),
    landingPath: pick("landingPath", 500),
    referrer: pick("referrer", 500),
  };
  return Object.fromEntries(
    Object.entries(attribution).filter(([, entry]) => entry)
  ) as LeadAttribution;
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
    attribution.gclid ? `gclid: ${attribution.gclid}` : "",
    attribution.fbclid ? `fbclid: ${attribution.fbclid}` : "",
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
  if (strict && raw.consent !== true) {
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

type AdsWindow = Window & {
  __gvhsAds?: { meta?: string; google?: string; label?: string };
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
};

/** Fires only after a lead is actually stored. Missing pixels are a no-op. */
export function trackLeadConversion() {
  if (typeof window === "undefined") return;
  const ads = (window as AdsWindow).__gvhsAds;
  const fbq = (window as AdsWindow).fbq;
  if (typeof fbq === "function") fbq("track", "Lead");
  const gtag = (window as AdsWindow).gtag;
  if (typeof gtag === "function" && ads?.google && ads.label) {
    gtag("event", "conversion", { send_to: `${ads.google}/${ads.label}` });
  }
}
