import { sanitizeSavedSearch, type AlertFrequency, type LeadSavedSearch } from "./office-access";
import type { Property } from "./types";

const ZONE = "America/Vancouver";

const OFFICE_TYPE: Record<string, string> = {
  condo: "Condominium",
  apartment: "Condominium",
  house: "Single Family",
  "half duplex": "Single Family",
  townhouse: "Townhouse",
};

const LISTING_TYPES: Record<string, string[]> = {
  condominium: ["condo", "apartment"],
  "single family": ["house", "half duplex"],
  townhouse: ["townhouse"],
  "multi-family": ["apartment"],
};

export type ZonedDay = {
  weekday: string;
  year: number;
  month: number;
  day: number;
  key: string;
};

export function zonedDay(date: Date, timeZone = ZONE): ZonedDay {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return {
    weekday: parts.weekday || "",
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    key: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** True when this search should be checked on this run. */
export function alertIsDue(frequency: string, lastAlertAt: string | null, now: Date): boolean {
  if (frequency === "Never") return false;
  if (frequency === "Instant") return true;
  const today = zonedDay(now);
  if (lastAlertAt) {
    const last = zonedDay(new Date(lastAlertAt));
    if (last.key === today.key) return false;
  }
  const day = today.weekday;
  switch (frequency) {
    case "Daily (Best for default search)":
      return true;
    case "T/Th (Best for personalized search)":
      return day === "Tue" || day === "Thu";
    case "M/W/F":
      return day === "Mon" || day === "Wed" || day === "Fri";
    case "Weekdays":
      return day !== "Sat" && day !== "Sun";
    case "Weekends":
      return day === "Sat" || day === "Sun";
    case "Sunday":
    case "Monday":
    case "Tuesday":
    case "Wednesday":
    case "Thursday":
    case "Friday":
    case "Saturday":
      return day === frequency.slice(0, 3);
    case "Weekly":
      if (!lastAlertAt) return true;
      return now.getTime() - new Date(lastAlertAt).getTime() >= 7 * 86_400_000;
    case "Bi-Weekly":
      if (!lastAlertAt) return true;
      return now.getTime() - new Date(lastAlertAt).getTime() >= 14 * 86_400_000;
    case "Monthly":
      if (!lastAlertAt) return true;
      {
        const last = zonedDay(new Date(lastAlertAt));
        return last.year !== today.year || last.month !== today.month;
      }
    default:
      return false;
  }
}

export function newListingWindowDays(frequency: string, lastAlertAt: string | null, now: Date): number {
  if (lastAlertAt) {
    const elapsed = Math.ceil((now.getTime() - new Date(lastAlertAt).getTime()) / 86_400_000);
    return Math.min(45, Math.max(1, elapsed));
  }
  if (frequency === "Bi-Weekly") return 14;
  if (frequency === "Monthly") return 31;
  return 1;
}

function daysLimit(label: string): number | null {
  switch (label) {
    case "New Listings (since yesterday)":
      return 1;
    case "< 3 days":
      return 2;
    case "< 7 days":
      return 6;
    case "< 14 days":
      return 13;
    case "< 30 days":
      return 29;
    case "< 90 days":
      return 89;
    case "< 6 months":
      return 182;
    case "< 12 months":
      return 364;
    default:
      return null;
  }
}

function typeMatches(wanted: string, property: Property): boolean {
  if (!wanted) return true;
  const value = wanted.trim().toLowerCase();
  if (property.propertyType.toLowerCase() === value) return true;
  const group = LISTING_TYPES[value];
  if (!group) return false;
  return group.includes(property.propertyType.toLowerCase());
}

function placeMatches(property: Property, places: string[]): boolean {
  if (!places.length) return true;
  const city = property.city.toLowerCase();
  const area = (property.neighborhood || "").toLowerCase();
  const address = property.address.toLowerCase();
  return places.some((place) => {
    const needle = place.trim().toLowerCase();
    if (!needle) return false;
    return city === needle || city.includes(needle) || area.includes(needle) || address.includes(needle);
  });
}

export function listingMatchesSearch(
  search: Pick<LeadSavedSearch, "city" | "minPrice" | "maxPrice" | "beds" | "baths" | "propertyType" | "criteria">,
  property: Property
): boolean {
  if (search.city && property.city.toLowerCase() !== search.city.toLowerCase()) return false;
  if (search.minPrice != null && property.price < search.minPrice) return false;
  if (search.maxPrice != null && property.price > search.maxPrice) return false;
  if (search.beds != null && property.beds < search.beds) return false;
  if (search.baths != null && property.baths < search.baths) return false;
  if (!typeMatches(search.propertyType, property)) return false;
  const criteria = search.criteria;
  if (criteria.sqftMin != null && property.sqft < criteria.sqftMin) return false;
  if (criteria.sqftMax != null && property.sqft > criteria.sqftMax) return false;
  if (criteria.yearMin != null && property.yearBuilt < criteria.yearMin) return false;
  if (criteria.yearMax != null && property.yearBuilt > criteria.yearMax) return false;
  if (criteria.status === "Active" && property.status !== "Active") return false;
  if (criteria.status === "Active Under Contract" && property.status !== "Pending") return false;
  const cap = daysLimit(criteria.daysOnSite);
  if (cap != null && property.listedDaysAgo > cap) return false;
  if (criteria.tags.length) {
    const tags = new Set([...(property.tags ?? []), ...property.features].map((tag) => tag.toLowerCase()));
    if (!criteria.tags.every((tag) => tags.has(tag.toLowerCase()))) return false;
  }
  if (!placeMatches(property, criteria.places)) return false;
  if (criteria.location) {
    const needle = criteria.location.toLowerCase();
    const hay = `${property.address} ${property.city} ${property.neighborhood || ""} ${property.postalCode}`.toLowerCase();
    if (!hay.includes(needle)) return false;
  }
  return true;
}

export function newMatchesForSearch(
  search: Pick<
    LeadSavedSearch,
    "city" | "minPrice" | "maxPrice" | "beds" | "baths" | "propertyType" | "criteria" | "frequency"
  >,
  listings: Property[],
  alreadySent: ReadonlySet<string>,
  now: Date,
  lastAlertAt: string | null
): Property[] {
  const windowDays = newListingWindowDays(search.frequency, lastAlertAt, now);
  return listings
    .filter((property) => property.status !== "Sold")
    .filter((property) => !alreadySent.has(property.id))
    .filter((property) => property.listedDaysAgo <= windowDays)
    .filter((property) => listingMatchesSearch(search, property))
    .sort((a, b) => a.listedDaysAgo - b.listedDaysAgo || a.price - b.price)
    .slice(0, 12);
}

function officePropertyType(value: unknown): string {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return OFFICE_TYPE[text.toLowerCase()] || text;
}

/** Turns a public save-search into a stored search. Empty filters are still a valid area-wide search. */
export function publicSavedSearch(email: string, name: string, raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const filters = raw as Record<string, unknown>;
  const parsed = sanitizeSavedSearch({
    name: name.slice(0, 80) || "Saved search",
    leadEmail: email,
    city: filters.city,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    beds: filters.beds,
    baths: filters.baths,
    propertyType: officePropertyType(filters.propertyType),
    frequency: "Daily (Best for default search)" satisfies AlertFrequency,
    location: filters.q,
  });
  return parsed.ok ? parsed.value : null;
}
