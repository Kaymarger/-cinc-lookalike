/** Roles and lead visibility shared by the office API and the CRM screens. */

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

export const ALERT_FREQUENCIES = ["Off", "Instant", "Daily", "Weekly", "Monthly"] as const;
export type AlertFrequency = (typeof ALERT_FREQUENCIES)[number];

export const SEARCH_PROPERTY_TYPES = [
  "Single Family",
  "Condo",
  "Townhouse",
  "Multi-Family",
  "Land",
  "Manufactured",
  "House",
  "Half Duplex",
  "Apartment",
] as const;

export const SEARCH_STATUSES = ["Any", "Active", "Pending", "Coming Soon", "Sold"] as const;
export const SEARCH_GARAGES = ["Any", "1+", "2+", "3+"] as const;

export type SearchCriteria = {
  county: string;
  sqftMin: number | null;
  sqftMax: number | null;
  yearMin: number | null;
  yearMax: number | null;
  status: string;
  garage: string;
  keywords: string;
};

export const EMPTY_CRITERIA: SearchCriteria = {
  county: "",
  sqftMin: null,
  sqftMax: null,
  yearMin: null,
  yearMax: null,
  status: "Any",
  garage: "Any",
  keywords: "",
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
  county?: unknown;
  sqftMin?: unknown;
  sqftMax?: unknown;
  yearMin?: unknown;
  yearMax?: unknown;
  status?: unknown;
  garage?: unknown;
  keywords?: unknown;
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
  const frequency = cleanText(raw.frequency, 20) || "Daily";
  if (!(ALERT_FREQUENCIES as readonly string[]).includes(frequency)) {
    return { ok: false, message: "Choose an email alert frequency." };
  }
  const leadEmail = cleanText(raw.leadEmail, 160).toLowerCase();
  const sqftMin = cleanPrice(raw.sqftMin);
  const sqftMax = cleanPrice(raw.sqftMax);
  const yearMin = cleanYear(raw.yearMin);
  const yearMax = cleanYear(raw.yearMax);
  if (sqftMin === "bad" || sqftMax === "bad") return { ok: false, message: "Enter square feet as a number." };
  if (yearMin === "bad" || yearMax === "bad") return { ok: false, message: "Enter a year between 1800 and 2100." };
  const status = cleanText(raw.status, 40) || "Any";
  if (!(SEARCH_STATUSES as readonly string[]).includes(status)) return { ok: false, message: "Choose a listing status." };
  const garage = cleanText(raw.garage, 20) || "Any";
  if (!(SEARCH_GARAGES as readonly string[]).includes(garage)) return { ok: false, message: "Choose a garage option." };
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
        county: cleanText(raw.county, 80),
        sqftMin: sqftMin,
        sqftMax: sqftMax,
        yearMin,
        yearMax,
        status,
        garage,
        keywords: cleanText(raw.keywords, 120),
      },
    },
  };
}

export function savedSearchSummary(search: Pick<LeadSavedSearch, "city" | "minPrice" | "maxPrice" | "beds" | "baths" | "propertyType" | "frequency" | "criteria">): string {
  const parts: string[] = [];
  if (search.city) parts.push(search.city);
  if (search.criteria?.county) parts.push(search.criteria.county);
  if (search.minPrice != null) parts.push(`from $${search.minPrice.toLocaleString("en-CA")}`);
  if (search.maxPrice != null) parts.push(`to $${search.maxPrice.toLocaleString("en-CA")}`);
  if (search.beds != null) parts.push(`${search.beds}+ beds`);
  if (search.baths != null) parts.push(`${search.baths}+ baths`);
  if (search.propertyType) parts.push(search.propertyType);
  if (search.criteria?.status && search.criteria.status !== "Any") parts.push(search.criteria.status);
  if (search.criteria?.sqftMin != null) parts.push(`${search.criteria.sqftMin}+ sqft`);
  parts.push(search.frequency === "Off" ? "alerts off" : `${search.frequency} email`);
  return parts.join(" · ");
}
