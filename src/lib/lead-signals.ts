/** Office lead signals shown in the leads table. */

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= 10;
}

/** Buyer unless the lead asked about selling or a home value. */
export function leadSide(input: { intent?: string | null; source?: string | null }): "Buyer" | "Seller" {
  const intent = (input.intent || "").toLowerCase();
  const source = (input.source || "").toLowerCase();
  if (intent === "seller" || intent === "valuation" || source === "seller_signup" || source === "home_valuation") {
    return "Seller";
  }
  return "Buyer";
}

/**
 * Quart score, 0–100. It is a contact-and-intent score, not a credit score.
 * Phone and email raise it, a full signup raises it more, and a property
 * question, showing, valuation, or saved search raises it further.
 */
export function quartScore(input: {
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  intent?: string | null;
  searchLabel?: string | null;
  smsOptIn?: boolean;
}): number {
  let score = 20;
  if (validPhone(input.phone || "")) score += 20;
  if (validEmail(input.email || "")) score += 15;
  const source = (input.source || "").toLowerCase();
  if (source === "registration" || source === "buyer_signup" || source === "seller_signup") score += 15;
  if (source === "showing_request" || source === "ask_question" || source === "photo_gate") score += 15;
  if (source === "home_valuation" || (input.intent || "").toLowerCase() === "seller") score += 10;
  if ((input.searchLabel || "").trim()) score += 10;
  if (input.smsOptIn) score += 5;
  return Math.min(100, score);
}

/** Account checkmark: the visitor finished a signup, not only a one-field form. */
export function accountVerified(source?: string | null): boolean {
  const value = (source || "").toLowerCase();
  return value === "registration" || value === "buyer_signup" || value === "seller_signup";
}
