import { DEMO_LISTINGS } from "./demo-listings";
import { MARKET_AREAS } from "./cinc-lists";

export type SuggestKind = "City" | "Neighbourhood" | "Postal" | "MLS" | "Address" | "Keyword";

export type SuggestHit = { kind: SuggestKind; label: string };

const CITIES = new Set(["Vancouver", "North Vancouver", "West Vancouver", "Burnaby"]);
const KEYWORDS = ["waterfront", "view", "renovated", "suite", "new construction", "garden", "laneway", "family home"];

export function suggestSearch(query: string, limit = 8): SuggestHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 1) return [];
  const hits: SuggestHit[] = [];
  const seen = new Set<string>();
  const push = (kind: SuggestKind, label: string) => {
    const key = `${kind}:${label.toLowerCase()}`;
    if (seen.has(key) || hits.length >= limit) return;
    if (!label.toLowerCase().includes(q)) return;
    seen.add(key);
    hits.push({ kind, label });
  };
  for (const area of MARKET_AREAS) {
    if (area === "Combined") continue;
    push(CITIES.has(area) ? "City" : "Neighbourhood", area);
  }
  for (const listing of DEMO_LISTINGS) {
    push("Postal", listing.postal);
    push("MLS", listing.mls);
    push("Address", listing.address);
  }
  for (const word of KEYWORDS) push("Keyword", word);
  return hits;
}

export function chipValue(hit: SuggestHit): string {
  return `${hit.kind}: ${hit.label}`;
}
