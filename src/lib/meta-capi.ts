import { createHash } from "node:crypto";
import { normalizeEmailForAds, normalizePhoneForAds } from "./lead-intake";

export type MetaUserData = {
  em?: string;
  ph?: string;
  fn?: string;
  ln?: string;
  ct?: string;
  country?: string;
  external_id?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
};

export type MetaServerEvent = {
  event_name: "Lead" | "PageView";
  event_time: number;
  event_id: string;
  action_source: "website";
  event_source_url: string;
  user_data: MetaUserData;
};

export type MetaLeadInput = {
  eventId: string;
  eventTime?: number;
  sourceUrl: string;
  ip?: string;
  userAgent?: string;
  email?: string;
  phone?: string;
  name?: string;
  city?: string;
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  externalId?: string;
};

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeNamePart(value: string): string {
  return value.trim().toLowerCase().replace(/[^\p{L}]/gu, "");
}

export function splitPersonName(name: string): { fn?: string; ln?: string } {
  const parts = name
    .trim()
    .split(/\s+/)
    .map(normalizeNamePart)
    .filter(Boolean);
  if (!parts.length) return {};
  if (parts.length === 1) return { fn: parts[0] };
  return { fn: parts[0], ln: parts[parts.length - 1] };
}

export function normalizeCity(city: string): string {
  return city.trim().toLowerCase().replace(/[^\p{L}]/gu, "");
}

export function metaPhoneDigits(phone: string): string {
  const digits = normalizePhoneForAds(phone).replace(/\D/g, "");
  if (digits.length < 10) return "";
  return digits;
}

/** Build fbc from the click id when the Meta cookie is not present yet. */
export function fbcFromClick(fbclid: string | undefined, now = Date.now()): string {
  const click = (fbclid || "").trim();
  if (!click) return "";
  return `fb.1.${now}.${click}`;
}

function hashed(value: string | undefined): string | undefined {
  const text = (value || "").trim();
  if (!text) return undefined;
  return sha256Hex(text);
}

function put(target: MetaUserData, key: keyof MetaUserData, value: string | undefined) {
  if (value) target[key] = value;
}

export function buildMetaLeadEvent(input: MetaLeadInput): MetaServerEvent | null {
  const eventId = input.eventId.trim();
  const sourceUrl = input.sourceUrl.trim();
  if (!eventId || !sourceUrl.startsWith("http")) return null;
  const names = splitPersonName(input.name || "");
  const userData: MetaUserData = {};
  const email = input.email ? normalizeEmailForAds(input.email) : "";
  put(userData, "em", email.includes("@") ? hashed(email) : undefined);
  put(userData, "ph", hashed(metaPhoneDigits(input.phone || "")));
  put(userData, "fn", hashed(names.fn));
  put(userData, "ln", hashed(names.ln));
  put(userData, "ct", hashed(normalizeCity(input.city || "")));
  put(userData, "country", hashed("ca"));
  put(userData, "external_id", hashed(input.externalId || eventId));
  put(userData, "client_ip_address", input.ip?.trim());
  put(userData, "client_user_agent", input.userAgent?.trim().slice(0, 512));
  put(userData, "fbp", input.fbp?.trim());
  put(userData, "fbc", input.fbc?.trim() || fbcFromClick(input.fbclid));
  return {
    event_name: "Lead",
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: userData,
  };
}

export function buildMetaPageViewEvent(input: {
  eventId: string;
  eventTime?: number;
  sourceUrl: string;
  ip?: string;
  userAgent?: string;
  fbc?: string;
  fbp?: string;
  fbclid?: string;
}): MetaServerEvent | null {
  const eventId = input.eventId.trim();
  const sourceUrl = input.sourceUrl.trim();
  if (!eventId || !sourceUrl.startsWith("http")) return null;
  const userData: MetaUserData = {};
  put(userData, "client_ip_address", input.ip?.trim());
  put(userData, "client_user_agent", input.userAgent?.trim().slice(0, 512));
  put(userData, "fbp", input.fbp?.trim());
  put(userData, "fbc", input.fbc?.trim() || fbcFromClick(input.fbclid));
  return {
    event_name: "PageView",
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: "website",
    event_source_url: sourceUrl,
    user_data: userData,
  };
}

/** Request body for the Graph events endpoint. test_event_code is only added when a caller passes one. */
export function metaEventsBody(events: MetaServerEvent[], testEventCode?: string): Record<string, unknown> {
  const body: Record<string, unknown> = { data: events };
  const code = testEventCode?.trim();
  if (code) body.test_event_code = code;
  return body;
}
