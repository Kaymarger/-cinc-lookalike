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

const OFFICE_PREFIXES = [
  "/agent",
  "/dashboard/spa",
  "/dashboard/sellersuite",
  "/dashboard/landing",
  "/dashboard/settings",
  "/dashboard/pages",
];

/** Lead site, including /agents. The agent office and its /dashboard aliases are excluded. */
export function isPublicLeadPath(pathname: string): boolean {
  const path = (pathname || "/").split("?")[0] || "/";
  return !OFFICE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
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
