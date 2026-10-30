import { MARKET_AREAS } from "./cinc-lists";

export type DemoListing = {
  mls: string;
  address: string;
  city: string;
  area: string;
  postal: string;
  price: number;
  beds: number;
  baths: number;
  type: string;
  sqft: number;
  status: "Active" | "Active Under Contract";
  daysOnSite: number;
  keywords: string[];
};

const STREETS = ["Main St", "Oak St", "Cambie St", "Dunbar St", "Lonsdale Ave", "Marine Dr", "Granville St", "Fraser St", "King Edward Ave", "41st Ave"];
const TYPES = ["Condominium", "Single Family", "Townhouse", "Multi-Family"] as const;
const KEYWORD_SETS = [
  ["view", "renovated"],
  ["suite", "family home"],
  ["waterfront", "view"],
  ["laneway", "garden"],
  ["new construction"],
];

const CITY_OF: Record<string, string> = {
  Vancouver: "Vancouver",
  "North Vancouver": "North Vancouver",
  "West Vancouver": "West Vancouver",
  Kitsilano: "Vancouver",
  "Lynn Valley": "North Vancouver",
  "Vancouver West": "Vancouver",
  "East Vancouver": "Vancouver",
  "Point Grey": "Vancouver",
  Southlands: "Vancouver",
  Cambie: "Vancouver",
  "Coal Harbour": "Vancouver",
  "Mount Pleasant": "Vancouver",
  "South Vancouver": "Vancouver",
  Yaletown: "Vancouver",
  "Lower Lonsdale": "North Vancouver",
  Shaughnessy: "Vancouver",
  Dunbar: "Vancouver",
  Edgemont: "North Vancouver",
  "West End": "Vancouver",
  UBC: "Vancouver",
  Fairview: "Vancouver",
  Arbutus: "Vancouver",
  "False Creek": "Vancouver",
  "Queen Mary": "North Vancouver",
  Kerrisdale: "Vancouver",
  "Upper Lonsdale": "North Vancouver",
  Metrotown: "Burnaby",
  Killarney: "Vancouver",
  "Marine Drive": "Vancouver",
  "Renfrew Heights": "Vancouver",
  "Canyon Heights": "North Vancouver",
};

const POSTAL: Record<string, string> = {
  Vancouver: "V6B",
  "North Vancouver": "V7L",
  "West Vancouver": "V7T",
  Burnaby: "V5H",
};

export const DEMO_LISTINGS: DemoListing[] = MARKET_AREAS.filter((area) => area !== "Combined").flatMap((area, index) => {
  const city = CITY_OF[area] ?? "Vancouver";
  const prefix = POSTAL[city] ?? "V6B";
  return [0, 1].map((copy) => {
    const n = index * 2 + copy;
    return {
      mls: `R3${String(10000 + n)}`,
      address: `${800 + n * 12} ${STREETS[n % STREETS.length]}`,
      city,
      area,
      postal: `${prefix} ${String(1 + (n % 9))}${String.fromCharCode(65 + (n % 26))}${1 + (n % 8)}`,
      price: 640000 + index * 85000 + copy * 45000,
      beds: 1 + (n % 5),
      baths: 1 + (n % 3),
      type: TYPES[n % TYPES.length],
      sqft: 680 + n * 35,
      status: copy === 0 ? "Active" : "Active Under Contract",
      daysOnSite: 1 + (n % 24),
      keywords: KEYWORD_SETS[n % KEYWORD_SETS.length],
    };
  });
});

export type ListingQuery = {
  places?: string[];
  city?: string;
  location?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  beds?: number | null;
  baths?: number | null;
  propertyType?: string;
  status?: string;
  sqftMin?: number | null;
  sqftMax?: number | null;
  daysOnSite?: string;
};

function daysLimit(value: string | undefined): number | null {
  if (!value || value === "Any") return null;
  if (value.startsWith("New")) return 1;
  const match = value.match(/<\s*(\d+)\s*(day|month)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return /month/i.test(match[2]) ? amount * 30 : amount;
}

function chip(value: string): { kind: string; label: string } {
  const split = value.indexOf(": ");
  if (split === -1) return { kind: "Keyword", label: value };
  return { kind: value.slice(0, split), label: value.slice(split + 2) };
}

export function filterDemoListings(query: ListingQuery): DemoListing[] {
  const places = (query.places ?? []).map(chip);
  const loose = (query.location || "").trim().toLowerCase();
  const limit = daysLimit(query.daysOnSite);
  return DEMO_LISTINGS.filter((listing) => {
    if (query.city && listing.city.toLowerCase() !== query.city.toLowerCase() && listing.area.toLowerCase() !== query.city.toLowerCase()) return false;
    if (query.minPrice != null && listing.price < query.minPrice) return false;
    if (query.maxPrice != null && listing.price > query.maxPrice) return false;
    if (query.beds != null && listing.beds < query.beds) return false;
    if (query.baths != null && listing.baths < query.baths) return false;
    if (query.propertyType && listing.type !== query.propertyType) return false;
    if (query.status && listing.status !== query.status) return false;
    if (query.sqftMin != null && listing.sqft < query.sqftMin) return false;
    if (query.sqftMax != null && listing.sqft > query.sqftMax) return false;
    if (limit != null && listing.daysOnSite > limit) return false;
    if (places.length) {
      const ok = places.some(({ kind, label }) => {
        const text = label.toLowerCase();
        if (kind === "City") return listing.city.toLowerCase() === text || listing.area.toLowerCase() === text;
        if (kind === "Neighbourhood") return listing.area.toLowerCase() === text;
        if (kind === "Postal") return listing.postal.toLowerCase().startsWith(text);
        if (kind === "MLS") return listing.mls.toLowerCase() === text;
        if (kind === "Address") return listing.address.toLowerCase().includes(text);
        return listing.keywords.some((word) => word.toLowerCase().includes(text)) || listing.address.toLowerCase().includes(text);
      });
      if (!ok) return false;
    }
    if (loose) {
      const blob = `${listing.address} ${listing.city} ${listing.area} ${listing.postal} ${listing.mls} ${listing.keywords.join(" ")}`.toLowerCase();
      if (!blob.includes(loose)) return false;
    }
    return true;
  });
}
