/** Public lead-site Meta Pixel. The env value wins; this is the site's own pixel. */
export const META_PIXEL_FALLBACK = "1412153377363377";

const LEAD_CATEGORY: Record<string, string> = {
  registration: "signup",
  buyer_signup: "signup",
  seller_signup: "signup",
  general: "contact",
  ask_question: "contact",
  showing_request: "showing",
  home_valuation: "home_value",
};

const FULL_SIGNUP = new Set(["registration", "buyer_signup", "seller_signup"]);

export function resolveMetaPixelId(envValue?: string | null): string {
  const value = (envValue || "").trim();
  if (/^\d{8,20}$/.test(value)) return value;
  return META_PIXEL_FALLBACK;
}

export function metaPixelId(): string {
  return resolveMetaPixelId(
    process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || ""
  );
}

export function isPublicLeadPath(pathname: string): boolean {
  return !pathname.startsWith("/agent") && !pathname.startsWith("/dashboard");
}

/** Events for a stored form. No names, emails, or phone numbers. */
export function pixelEventsForLead(source: string): { event: "Lead" | "CompleteRegistration"; params: Record<string, string> }[] {
  const category = LEAD_CATEGORY[source];
  if (!category) return [];
  const events: { event: "Lead" | "CompleteRegistration"; params: Record<string, string> }[] = [
    { event: "Lead", params: { content_category: category } },
  ];
  if (FULL_SIGNUP.has(source)) {
    events.push({ event: "CompleteRegistration", params: { content_name: "signup" } });
  }
  return events;
}

export function safeSearchString(value: string): string {
  const cleaned = value.replace(/\S+@\S+/g, "").replace(/\s+/g, " ").trim().slice(0, 100);
  return cleaned || "homes";
}
