/** Stand-in lists. Replace these arrays when the exact CINC capture arrives. */
export const PLACEHOLDER_VENDOR_TYPES = [
  "Placeholder — Inspector",
  "Placeholder — Lender",
  "Placeholder — Other",
] as const;

export const PLACEHOLDER_LEAD_SOURCES = [
  "Placeholder — Website",
  "Placeholder — Google",
  "Placeholder — Referral",
] as const;

export const PLACEHOLDER_AI_ALERTS = [
  { id: "Placeholder — AI Summary", description: "Replace with the captured AI alert name." },
] as const;

export const PLACEHOLDER_COMMUNICATION_ALERTS = [
  { id: "Placeholder — New Email", description: "Replace with the captured communication alert name." },
  { id: "Placeholder — New Text", description: "Replace with the captured communication alert name." },
] as const;

export const PLACEHOLDER_BEHAVIORAL_ALERTS = [
  { id: "Placeholder — Behavioral Message", description: "Replace with the captured behavioral alert name." },
] as const;
