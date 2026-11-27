/** Exact address, so plus-tags stay different people. */
export function exactEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** True when the name is just the address or its handle, not a person's name. */
export function nameIsEmailHandle(name: string, email: string): boolean {
  const label = name.trim().toLowerCase();
  const normalized = exactEmail(email);
  const local = normalized.split("@")[0] || "";
  return label === normalized || label === local || label === local.split("+")[0];
}

/** Keep a real stored name. A later signup can fill a name only when the stored one is blank or an email handle. */
export function preferredLeadName(storedName: string, incomingName: string, email: string): string {
  const stored = storedName.trim();
  const incoming = incomingName.trim();
  if (stored && !nameIsEmailHandle(stored, email)) return stored;
  if (incoming && !nameIsEmailHandle(incoming, email)) return incoming;
  return stored || incoming;
}

export const WELCOME_SOURCES = new Set([
  "buyer_signup",
  "seller_signup",
  "registration",
  "home_valuation",
]);
