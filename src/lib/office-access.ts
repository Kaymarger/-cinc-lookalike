/** Roles and lead visibility shared by the office API and the CRM screens. */

import {
  CINC_PROPERTY_TYPES,
  DAYS_ON_SITE,
  ENGAGEMENTS,
  FIREPLACES,
  LISTING_STATUSES,
  OWNERSHIP_TYPES,
  SEARCH_TAGS,
  SPACE_OPTIONS,
  STORIES_EXACT,
  STORIES_MIN,
} from "./cinc-options";

export const OFFICE_ROLES = ["admin", "broker", "agent", "isa", "lender"] as const;

export type OfficeRole = (typeof OFFICE_ROLES)[number];

export type AccessViewer = {
  id: string;
  name: string;
  role: OfficeRole;
};

export type AccessLead = {
  assignedTo?: string | null;
  assignedUserId?: string | null;
  partnerName?: string | null;
  partnerUserId?: string | null;
};

export function isOfficeRole(value: string): value is OfficeRole {
  return (OFFICE_ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: OfficeRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "broker":
      return "Broker";
    case "agent":
      return "Agent";
    case "isa":
      return "ISA";
    case "lender":
      return "Lender";
  }
}

export function canonicalName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function seesAllLeads(role: OfficeRole): boolean {
  return role === "admin" || role === "broker";
}

export function canManageUsers(role: OfficeRole): boolean {
  return role === "admin" || role === "broker";
}

/** Admins, brokers, and ISAs route leads. Agents and lenders do not. */
export function canReassignLeads(role: OfficeRole): boolean {
  return role === "admin" || role === "broker" || role === "isa";
}

function sameName(left: string | null | undefined, right: string): boolean {
  const name = canonicalName(left || "");
  return Boolean(name) && name === canonicalName(right);
}

function unassigned(value: string | null | undefined): boolean {
  const name = canonicalName(value || "");
  return !name || name === "unassigned";
}

export function leadVisibleTo(viewer: AccessViewer, lead: AccessLead): boolean {
  if (seesAllLeads(viewer.role)) return true;
  const mine =
    (Boolean(lead.assignedUserId) && lead.assignedUserId === viewer.id) ||
    sameName(lead.assignedTo, viewer.name);
  if (viewer.role === "agent") return mine;
  if (viewer.role === "isa") return mine || unassigned(lead.assignedTo);
  if (viewer.role === "lender") {
    return (
      (Boolean(lead.partnerUserId) && lead.partnerUserId === viewer.id) ||
      (!unassigned(lead.partnerName) && sameName(lead.partnerName, viewer.name))
    );
  }
  return false;
}

export const ALERT_FREQUENCIES = ENGAGEMENTS;
export type AlertFrequency = (typeof ENGAGEMENTS)[number];

export const SEARCH_PROPERTY_TYPES = CINC_PROPERTY_TYPES;
export const SEARCH_STATUSES = LISTING_STATUSES;
export const SEARCH_GARAGES = SPACE_OPTIONS;

export type SearchCriteria = {
  location: string;
  taxMin: number | null;
  taxMax: number | null;
  minAcreage: string;
  maxAcreage: string;
  minLotSqft: string;
  maxLotSqft: string;
  status: string;
  daysOnSite: string;
  garage: string;
  parking: string;
  carport: string;
  yearMin: number | null;
  yearMax: number | null;
  storiesMin: string;
  storiesExact: string;
  fireplaces: string;
  style: string;
  sqftMin: number | null;
  sqftMax: number | null;
  ownership: string;
  tags: string[];
  places: string[];
};

export const EMPTY_CRITERIA: SearchCriteria = {
  location: "",
  taxMin: null,
  taxMax: null,
  minAcreage: "",
  maxAcreage: "",
  minLotSqft: "",
  maxLotSqft: "",
  status: "",
  daysOnSite: "Any",
  garage: "Any",
  parking: "Any",
  carport: "Any",
  yearMin: null,
  yearMax: null,
  storiesMin: "Any",
  storiesExact: "Any",
  fireplaces: "Any",
  style: "",
  sqftMin: null,
  sqftMax: null,
  ownership: "",
  tags: [],
  places: [],
};

export type LeadSavedSearch = {
  id: string;
  leadId: string;
  leadEmail: string;
  name: string;
  city: string;
  minPrice: number | null;
  maxPrice: number | null;
  beds: number | null;
  baths: number | null;
  propertyType: string;
  frequency: AlertFrequency;
  criteria: SearchCriteria;
  createdAt: string;
  updatedAt: string;
};

export type SavedSearchInput = {
  name?: unknown;
  city?: unknown;
  minPrice?: unknown;
  maxPrice?: unknown;
  beds?: unknown;
  baths?: unknown;
  propertyType?: unknown;
  frequency?: unknown;
  leadEmail?: unknown;
  location?: unknown;
  taxMin?: unknown;
  taxMax?: unknown;
  minAcreage?: unknown;
  maxAcreage?: unknown;
  minLotSqft?: unknown;
  maxLotSqft?: unknown;
  daysOnSite?: unknown;
  parking?: unknown;
  carport?: unknown;
  storiesMin?: unknown;
  storiesExact?: unknown;
  fireplaces?: unknown;
  style?: unknown;
  sqftMin?: unknown;
  sqftMax?: unknown;
  yearMin?: unknown;
  yearMax?: unknown;
  status?: unknown;
  garage?: unknown;
  ownership?: unknown;
  tags?: unknown;
  places?: unknown;
};

function cleanText(value: unknown, max: number): string {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanCount(value: unknown): number | null {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 20) return null;
  return n;
}

function cleanYear(value: unknown): number | null | "bad" {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1800 || n > 2100) return "bad";
  return n;
}

function cleanPrice(value: unknown): number | null | "bad" {
  if (value === "" || value == null) return null;
  const n = Number(String(value).replace(/[$,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return "bad";
  return Math.round(n);
}

export function sanitizeSavedSearch(
  raw: SavedSearchInput
): { ok: true; value: Omit<LeadSavedSearch, "id" | "leadId" | "createdAt" | "updatedAt"> } | { ok: false; message: string } {
  const name = cleanText(raw.name, 80);
  if (!name) return { ok: false, message: "Name the saved search." };
  const city = cleanText(raw.city, 80);
  const minPrice = cleanPrice(raw.minPrice);
  const maxPrice = cleanPrice(raw.maxPrice);
  if (minPrice === "bad" || maxPrice === "bad") {
    return { ok: false, message: "Enter a price as a number." };
  }
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    return { ok: false, message: "Minimum price is higher than the maximum." };
  }
  const beds = cleanCount(raw.beds);
  const baths = cleanCount(raw.baths);
  if ((raw.beds != null && raw.beds !== "" && beds == null) || (raw.baths != null && raw.baths !== "" && baths == null)) {
    return { ok: false, message: "Beds and baths must be a whole number from 0 to 20." };
  }
  const propertyType = cleanText(raw.propertyType, 40);
  if (propertyType && !(SEARCH_PROPERTY_TYPES as readonly string[]).includes(propertyType)) {
    return { ok: false, message: "Choose a property type from the list." };
  }
  const frequency = cleanText(raw.frequency, 80) || "Daily (Best for default search)";
  if (!(ALERT_FREQUENCIES as readonly string[]).includes(frequency)) {
    return { ok: false, message: "Choose an engagement schedule." };
  }
  const leadEmail = cleanText(raw.leadEmail, 160).toLowerCase();
  const sqftMin = cleanPrice(raw.sqftMin);
  const sqftMax = cleanPrice(raw.sqftMax);
  const taxMin = cleanPrice(raw.taxMin);
  const taxMax = cleanPrice(raw.taxMax);
  const yearMin = cleanYear(raw.yearMin);
  const yearMax = cleanYear(raw.yearMax);
  if (sqftMin === "bad" || sqftMax === "bad" || taxMin === "bad" || taxMax === "bad") {
    return { ok: false, message: "Enter amounts as numbers." };
  }
  if (yearMin === "bad" || yearMax === "bad") return { ok: false, message: "Enter a year between 1800 and 2100." };
  const status = cleanText(raw.status, 40);
  if (status && !(LISTING_STATUSES as readonly string[]).includes(status)) return { ok: false, message: "Choose a listing status." };
  const daysOnSite = cleanText(raw.daysOnSite, 40) || "Any";
  if (!(DAYS_ON_SITE as readonly string[]).includes(daysOnSite)) return { ok: false, message: "Choose days on site." };
  const garage = oneOf(raw.garage, SPACE_OPTIONS, "Any");
  const parking = oneOf(raw.parking, SPACE_OPTIONS, "Any");
  const carport = oneOf(raw.carport, SPACE_OPTIONS, "Any");
  const storiesMin = oneOf(raw.storiesMin, STORIES_MIN, "Any");
  const storiesExact = oneOf(raw.storiesExact, STORIES_EXACT, "Any");
  const fireplaces = oneOf(raw.fireplaces, FIREPLACES, "Any");
  const ownership = cleanText(raw.ownership, 80);
  if (ownership && !(OWNERSHIP_TYPES as readonly string[]).includes(ownership)) {
    return { ok: false, message: "Choose an ownership type." };
  }
  if (garage === "bad" || parking === "bad" || carport === "bad" || storiesMin === "bad" || storiesExact === "bad" || fireplaces === "bad") {
    return { ok: false, message: "Choose an option from the list." };
  }
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((tag) => cleanText(tag, 40)).filter((tag) => (SEARCH_TAGS as readonly string[]).includes(tag))
    : [];
  const places = Array.isArray(raw.places)
    ? raw.places.map((place) => cleanText(place, 80)).filter(Boolean).slice(0, 24)
    : [];
  return {
    ok: true,
    value: {
      leadEmail,
      name,
      city,
      minPrice,
      maxPrice,
      beds,
      baths,
      propertyType,
      frequency: frequency as AlertFrequency,
      criteria: {
        location: cleanText(raw.location, 120),
        taxMin,
        taxMax,
        minAcreage: cleanText(raw.minAcreage, 20),
        maxAcreage: cleanText(raw.maxAcreage, 20),
        minLotSqft: cleanText(raw.minLotSqft, 20),
        maxLotSqft: cleanText(raw.maxLotSqft, 20),
        status,
        daysOnSite,
        garage,
        parking,
        carport,
        yearMin,
        yearMax,
        storiesMin,
        storiesExact,
        fireplaces,
        style: cleanText(raw.style, 200),
        sqftMin,
        sqftMax,
        ownership,
        tags,
        places,
      },
    },
  };
}

function oneOf(value: unknown, allowed: readonly string[], fallback: string): string | "bad" {
  const text = cleanText(value, 40);
  if (!text) return fallback;
  return allowed.includes(text) ? text : "bad";
}

function money(value: number): string {
  return `$${value.toLocaleString("en-CA")}`;
}

export function savedSearchSummary(search: Pick<LeadSavedSearch, "city" | "minPrice" | "maxPrice" | "beds" | "baths" | "propertyType" | "frequency" | "criteria">): string {
  const placeCity = (search.criteria?.places ?? [])
    .filter((place) => place.startsWith("City: ") || place.startsWith("Neighbourhood: "))
    .map((place) => place.split(": ").slice(1).join(": "))
    .filter(Boolean);
  const city = search.city || placeCity[0] || search.criteria?.location || "Any";
  let price = "Any";
  if (search.minPrice != null && search.maxPrice != null) price = `${money(search.minPrice)}–${money(search.maxPrice)}`;
  else if (search.minPrice != null) price = `${money(search.minPrice)}+`;
  else if (search.maxPrice != null) price = `up to ${money(search.maxPrice)}`;
  const extra: string[] = [];
  if (search.beds != null) extra.push(`${search.beds}+ beds`);
  if (search.propertyType) extra.push(search.propertyType);
  const tail = extra.length ? ` · ${extra.join(" · ")}` : "";
  return `Price: ${price}, City: ${city}${tail}`;
}
