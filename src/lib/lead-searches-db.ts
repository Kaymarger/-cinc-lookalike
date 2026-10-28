import { officeDb } from "@/lib/leads-db";
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
    county: typeof raw.county === "string" ? raw.county : "",
    keywords: typeof raw.keywords === "string" ? raw.keywords : "",
    status: typeof raw.status === "string" ? raw.status : "Any",
    garage: typeof raw.garage === "string" ? raw.garage : "Any",
  };
}

function iso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function fromRow(row: SearchRow): LeadSavedSearch {
  const frequency = (["Off", "Instant", "Daily", "Weekly", "Monthly"] as const).includes(
    row.frequency as AlertFrequency
  )
    ? (row.frequency as AlertFrequency)
    : "Daily";
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

export async function deleteSearch(leadId: string, searchId: string): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<{ id: string }[]>`
    DELETE FROM lead_saved_searches WHERE id = ${searchId} AND lead_id = ${leadId} RETURNING id
  `;
  return rows.length > 0;
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
