/** Gmail-style plus tags share one mailbox. Used only to find an existing lead. */
export function mailboxKey(email: string): string {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf("@");
  if (at <= 0) return normalized;
  const local = normalized.slice(0, at).split("+")[0];
  const domain = normalized.slice(at + 1);
  return `${local}@${domain}`;
}

export function sameMailbox(left: string, right: string): boolean {
  const key = mailboxKey(left);
  return key.includes("@") && key === mailboxKey(right);
}

/** True when the name is just the address or its handle, not a person's name. */
export function nameIsEmailHandle(name: string, email: string): boolean {
  const label = name.trim().toLowerCase();
  const normalized = email.trim().toLowerCase();
  const local = normalized.split("@")[0] || "";
  return label === normalized || label === local || label === local.split("+")[0];
}

/** Keep a real name already on the lead. Do not replace it with an email handle. */
export function preferredLeadName(storedName: string, incomingName: string, email: string): string {
  const stored = storedName.trim();
  const incoming = incomingName.trim();
  if (stored && nameIsEmailHandle(incoming, email) && !nameIsEmailHandle(stored, email)) return stored;
  if (stored && !incoming) return stored;
  return incoming || stored;
}

export const WELCOME_SOURCES = new Set([
  "buyer_signup",
  "seller_signup",
  "registration",
  "home_valuation",
]);
