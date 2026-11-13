import { officeDb } from "@/lib/leads-db";
import { ENGAGEMENTS } from "./cinc-options";
import {
  EMPTY_CRITERIA,
  type AlertFrequency,
  type LeadSavedSearch,
  type SearchCriteria,
} from "@/lib/office-access";

type SearchRow = {
  id: string;
  lead_id: string;
  lead_email: string;
  name: string;
  city: string;
  min_price: number | null;
  max_price: number | null;
  beds: number | null;
  baths: number | null;
  property_type: string;
  frequency: string;
  criteria: unknown;
  created_at: Date | string;
  updated_at: Date | string;
};

function asCriteria(value: unknown): SearchCriteria {
  const raw = value && typeof value === "object" ? (value as Partial<SearchCriteria>) : {};
  return {
    ...EMPTY_CRITERIA,
    ...raw,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === "string") : [],
    places: Array.isArray(raw.places) ? raw.places.filter((place): place is string => typeof place === "string") : [],
  };
}

function iso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function fromRow(row: SearchRow): LeadSavedSearch {
  const frequency = (ENGAGEMENTS as readonly string[]).includes(row.frequency)
    ? (row.frequency as AlertFrequency)
    : "Daily (Best for default search)";
  return {
    id: row.id,
    leadId: row.lead_id,
    leadEmail: row.lead_email,
    name: row.name,
    city: row.city || "",
    minPrice: row.min_price,
    maxPrice: row.max_price,
    beds: row.beds,
    baths: row.baths,
    propertyType: row.property_type || "",
    frequency,
    criteria: asCriteria(row.criteria),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export async function listSearchesForLead(leadId: string): Promise<LeadSavedSearch[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<SearchRow[]>`
    SELECT * FROM lead_saved_searches WHERE lead_id = ${leadId} ORDER BY created_at DESC
  `;
  return rows.map(fromRow);
}

export async function listSearchesForEmail(email: string): Promise<LeadSavedSearch[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<SearchRow[]>`
    SELECT * FROM lead_saved_searches
    WHERE lower(lead_email) = ${email.trim().toLowerCase()}
    ORDER BY created_at DESC
  `;
  return rows.map(fromRow);
}

export async function insertSearch(
  leadId: string,
  value: Omit<LeadSavedSearch, "id" | "leadId" | "createdAt" | "updatedAt">
): Promise<LeadSavedSearch> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<SearchRow[]>`
    INSERT INTO lead_saved_searches (
      id, lead_id, lead_email, name, city, min_price, max_price, beds, baths,
      property_type, frequency, criteria
    ) VALUES (
      ${crypto.randomUUID()},
      ${leadId},
      ${value.leadEmail},
      ${value.name},
      ${value.city},
      ${value.minPrice},
      ${value.maxPrice},
      ${value.beds},
      ${value.baths},
      ${value.propertyType},
      ${value.frequency},
      ${sql.json(value.criteria)}
    )
    RETURNING *
  `;
  return fromRow(rows[0]);
}

export async function updateSearch(
  leadId: string,
  searchId: string,
  value: Omit<LeadSavedSearch, "id" | "leadId" | "createdAt" | "updatedAt">
): Promise<LeadSavedSearch | null> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<SearchRow[]>`
    UPDATE lead_saved_searches SET
      lead_email = ${value.leadEmail},
      name = ${value.name},
      city = ${value.city},
      min_price = ${value.minPrice},
      max_price = ${value.maxPrice},
      beds = ${value.beds},
      baths = ${value.baths},
      property_type = ${value.propertyType},
      frequency = ${value.frequency},
      criteria = ${sql.json(value.criteria)},
      updated_at = now()
    WHERE id = ${searchId} AND lead_id = ${leadId}
    RETURNING *
  `;
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function updateSearchFrequencyForEmail(email: string, searchId: string, frequency: string): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE lead_saved_searches
    SET frequency = ${frequency}, updated_at = now()
    WHERE id = ${searchId} AND lower(lead_email) = ${email.toLowerCase()}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function deleteSearch(leadId: string, searchId: string): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<{ id: string }[]>`
    DELETE FROM lead_saved_searches WHERE id = ${searchId} AND lead_id = ${leadId} RETURNING id
  `;
  return rows.length > 0;
}

export type AlertSearch = LeadSavedSearch & {
  contactEmail: string;
  leadName: string;
  unsubscribed: boolean;
  lastAlertAt: string | null;
};

type AlertRow = SearchRow & {
  contact_email: string;
  lead_name: string;
  lead_notes: string;
  last_alert_at: Date | string | null;
};

export async function listAlertSearches(): Promise<AlertSearch[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<AlertRow[]>`
    SELECT s.*,
           COALESCE(NULLIF(l.email, ''), s.lead_email) AS contact_email,
           COALESCE(l.name, '') AS lead_name,
           COALESCE(l.notes, '') AS lead_notes
    FROM lead_saved_searches s
    LEFT JOIN captured_leads l ON l.id = s.lead_id
    ORDER BY s.created_at ASC
  `;
  return rows.map((row) => {
    const search = fromRow(row);
    const notes = row.lead_notes || "";
    return {
      ...search,
      contactEmail: (row.contact_email || search.leadEmail).trim().toLowerCase(),
      leadName: row.lead_name || "",
      unsubscribed: notes.toLowerCase().includes("unsubscribed"),
      lastAlertAt: row.last_alert_at ? iso(row.last_alert_at) : null,
    };
  });
}

export async function alertHits(searchId: string): Promise<Set<string>> {
  const sql = await officeDb();
  if (!sql) return new Set();
  const rows = await sql<{ property_id: string }[]>`
    SELECT property_id FROM saved_search_alert_hits WHERE search_id = ${searchId}
  `;
  return new Set(rows.map((row) => row.property_id));
}

export async function markAlertChecked(searchId: string, propertyIds: string[], when: Date): Promise<void> {
  const sql = await officeDb();
  if (!sql) return;
  await sql`
    UPDATE lead_saved_searches SET last_alert_at = ${when.toISOString()}::timestamptz WHERE id = ${searchId}
  `;
  for (const propertyId of propertyIds) {
    await sql`
      INSERT INTO saved_search_alert_hits (search_id, property_id, sent_at)
      VALUES (${searchId}, ${propertyId}, ${when.toISOString()}::timestamptz)
      ON CONFLICT (search_id, property_id) DO NOTHING
    `;
  }
}

export async function deleteSearchForEmail(email: string, searchId: string): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<{ id: string }[]>`
    DELETE FROM lead_saved_searches
    WHERE id = ${searchId} AND lower(lead_email) = ${email.trim().toLowerCase()}
    RETURNING id
  `;
  return rows.length > 0;
}
