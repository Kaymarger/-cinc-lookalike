import type { SearchFilters } from "./types";

/** What a new lead asked for, taken from a saved search or from signup text. */
export type WelcomeCriteria = {
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  propertyType?: string;
};

export type MatchFit = "exact" | "similar" | "newest";

export type MatchStep = {
  fit: MatchFit;
  heading: string;
  summary: string;
  queries: SearchFilters[];
};

const CITIES = [
  "north vancouver",
  "west vancouver",
  "port coquitlam",
  "port moody",
  "new westminster",
  "pitt meadows",
  "white rock",
  "maple ridge",
  "bowen island",
  "lions bay",
  "vancouver",
  "burnaby",
  "richmond",
  "surrey",
  "coquitlam",
  "delta",
  "langley",
  "anmore",
  "belcarra",
];

const NEARBY: Record<string, string[]> = {
  "north vancouver": ["west vancouver", "vancouver"],
  "west vancouver": ["north vancouver", "vancouver"],
  vancouver: ["burnaby", "north vancouver", "richmond"],
  burnaby: ["vancouver", "new westminster", "coquitlam"],
  richmond: ["vancouver", "delta"],
  surrey: ["delta", "langley", "white rock"],
  coquitlam: ["port coquitlam", "port moody", "burnaby"],
  "port coquitlam": ["coquitlam", "port moody"],
  "port moody": ["coquitlam", "burnaby"],
  "new westminster": ["burnaby", "surrey"],
  delta: ["richmond", "surrey"],
  langley: ["surrey"],
  "white rock": ["surrey"],
  "maple ridge": ["pitt meadows"],
  "pitt meadows": ["maple ridge"],
};

export function hasWelcomeCriteria(criteria: WelcomeCriteria): boolean {
  return Boolean(
    criteria.area ||
      criteria.minPrice != null ||
      criteria.maxPrice != null ||
      criteria.beds != null ||
      criteria.baths != null ||
      criteria.propertyType,
  );
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isCity(area: string): boolean {
  return CITIES.includes(area.trim().toLowerCase());
}

function money(value: number): string {
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    const text = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(/\.0$/, "");
    return `$${text}M`;
  }
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${value}`;
}

export function summarizeCriteria(criteria: WelcomeCriteria): string {
  const parts: string[] = [];
  if (criteria.area) parts.push(titleCase(criteria.area));
  if (criteria.minPrice != null && criteria.maxPrice != null) parts.push(`${money(criteria.minPrice)}–${money(criteria.maxPrice)}`);
  else if (criteria.minPrice != null) parts.push(`${money(criteria.minPrice)}+`);
  else if (criteria.maxPrice != null) parts.push(`up to ${money(criteria.maxPrice)}`);
  if (criteria.beds != null) parts.push(`${criteria.beds}+ beds`);
  if (criteria.baths != null) parts.push(`${criteria.baths}+ baths`);
  if (criteria.propertyType) parts.push(criteria.propertyType);
  return parts.join(" · ");
}

function parseAmount(raw: string, unit?: string): number | undefined {
  const value = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const mark = (unit || "").toLowerCase();
  if (mark === "m") return Math.round(value * 1_000_000);
  if (mark === "k") return Math.round(value * 1000);
  if (value < 1000) return Math.round(value * 1000);
  return Math.round(value);
}

export function criteriaFromText(text: string): WelcomeCriteria {
  const source = text.replace(/\s+/g, " ").trim();
  if (!source) return {};
  const lower = source.toLowerCase();
  const criteria: WelcomeCriteria = {};
  const city = CITIES.find((name) => lower.includes(name));
  if (city) criteria.area = titleCase(city);

  const range = lower.match(/\$?\s*(\d[\d,.]*)\s*([km])?\s*(?:-|–|—|to)\s*\$?\s*(\d[\d,.]*)\s*([km])?/i);
  if (range) {
    const maxUnit = range[4] || range[2];
    criteria.minPrice = parseAmount(range[1], range[2] || (maxUnit === "m" && Number(range[1]) < 100 ? "m" : undefined));
    criteria.maxPrice = parseAmount(range[3], maxUnit);
  } else {
    const under = lower.match(/under\s+\$?\s*(\d[\d,.]*)\s*([km])?/i);
    const plus = lower.match(/\$?\s*(\d[\d,.]*)\s*([km])\s*\+/i);
    if (under) criteria.maxPrice = parseAmount(under[1], under[2]);
    else if (plus) criteria.minPrice = parseAmount(plus[1], plus[2]);
  }

  const beds = lower.match(/(\d+)\s*\+?\s*(?:bed|beds|bd|br|bedroom|bedrooms)\b/);
  if (beds) criteria.beds = Number(beds[1]);
  const baths = lower.match(/(\d+)\s*\+?\s*(?:bath|baths|ba|bathroom|bathrooms)\b/);
  if (baths) criteria.baths = Number(baths[1]);

  if (/\bduplex\b/.test(lower)) criteria.propertyType = "Duplex";
  else if (/\btown(?:house|home)s?\b/.test(lower)) criteria.propertyType = "Townhouse";
  else if (/\bcondo(?:minium)?s?\b|\bapartment\b/.test(lower)) criteria.propertyType = "Condo";
  else if (/\b(?:house|detached|single family)\b/.test(lower)) criteria.propertyType = "House";

  return criteria;
}

export function criteriaFromSavedSearch(search: {
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  beds?: number | null;
  baths?: number | null;
  propertyType?: string | null;
  criteria?: { location?: string; places?: string[] };
}): WelcomeCriteria {
  const place = (search.criteria?.places ?? [])
    .map((item) => item.replace(/^(City|Neighbourhood):\s*/i, "").trim())
    .find(Boolean);
  const area = search.city?.trim() || place || search.criteria?.location?.trim() || undefined;
  return {
    area: area || undefined,
    minPrice: search.minPrice ?? undefined,
    maxPrice: search.maxPrice ?? undefined,
    beds: search.beds ?? undefined,
    baths: search.baths ?? undefined,
    propertyType: search.propertyType?.trim() || undefined,
  };
}

export function mergeCriteria(primary: WelcomeCriteria, extra: WelcomeCriteria): WelcomeCriteria {
  return {
    area: primary.area || extra.area,
    minPrice: primary.minPrice ?? extra.minPrice,
    maxPrice: primary.maxPrice ?? extra.maxPrice,
    beds: primary.beds ?? extra.beds,
    baths: primary.baths ?? extra.baths,
    propertyType: primary.propertyType || extra.propertyType,
  };
}

function widenPrice(criteria: WelcomeCriteria): WelcomeCriteria {
  return {
    ...criteria,
    minPrice: criteria.minPrice != null ? Math.floor(criteria.minPrice * 0.9) : undefined,
    maxPrice: criteria.maxPrice != null ? Math.ceil(criteria.maxPrice * 1.1) : undefined,
  };
}

function easeBeds(criteria: WelcomeCriteria): WelcomeCriteria {
  if (criteria.beds == null) return criteria;
  return { ...criteria, beds: criteria.beds > 1 ? criteria.beds - 1 : undefined };
}

function filtersFor(criteria: WelcomeCriteria, area?: string): SearchFilters {
  const place = (area ?? criteria.area)?.trim();
  const city = place && isCity(place) ? titleCase(place) : undefined;
  return {
    city,
    q: place && !city ? place : undefined,
    minPrice: criteria.minPrice,
    maxPrice: criteria.maxPrice,
    beds: criteria.beds,
    baths: criteria.baths,
    propertyType: criteria.propertyType,
    sort: "newest",
  };
}

export function matchSteps(criteria: WelcomeCriteria): MatchStep[] {
  if (!hasWelcomeCriteria(criteria)) {
    return [{
      fit: "newest",
      heading: "Newest homes in Greater Vancouver",
      summary: "",
      queries: [{ sort: "newest" }],
    }];
  }
  const summary = summarizeCriteria(criteria);
  const exact: MatchStep = {
    fit: "exact",
    heading: "Homes matching your search",
    summary,
    queries: [filtersFor(criteria)],
  };
  const priced = widenPrice(criteria);
  const bedEase = easeBeds(priced);
  const nearby = (criteria.area && isCity(criteria.area) ? NEARBY[criteria.area.toLowerCase()] : undefined) ?? [];
  const similarQueries = nearby.length
    ? nearby.map((city) => filtersFor(bedEase, city))
    : [filtersFor({ ...bedEase, area: undefined })];
  return [
    exact,
    {
      fit: "similar",
      heading: "Homes similar to your search",
      summary,
      queries: [filtersFor(priced)],
    },
    {
      fit: "similar",
      heading: "Homes similar to your search",
      summary,
      queries: [filtersFor(bedEase)],
    },
    {
      fit: "similar",
      heading: "Homes similar to your search",
      summary,
      queries: similarQueries,
    },
  ];
}

export type WelcomeHome = {
  id: string;
  address: string;
  city: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  href: string;
  image?: string;
};

export async function pickWelcomeHomes(
  criteria: WelcomeCriteria,
  search: (filters: SearchFilters) => Promise<WelcomeHome[]>,
): Promise<{ step: MatchStep; homes: WelcomeHome[] }> {
  const steps = matchSteps(criteria);
  for (const step of steps) {
    const batches = await Promise.all(step.queries.map((query) => search(query).catch(() => [])));
    const seen = new Set<string>();
    const homes = batches.flat().filter((home) => {
      if (!home.id || seen.has(home.id)) return false;
      seen.add(home.id);
      return true;
    }).slice(0, 4);
    if (homes.length || step.fit === "newest") return { step, homes };
  }
  const last = steps[steps.length - 1];
  return { step: last, homes: [] };
}
