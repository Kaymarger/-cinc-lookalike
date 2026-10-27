import postgres from "postgres";
import {
  attributionSummary,
  type LeadAttribution,
  type LeadIntent,
  type SanitizedLead,
} from "@/lib/lead-intake";

export type StoredLead = SanitizedLead & {
  status: "new";
  activityBody: string;
};

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  sms_opt_in: boolean;
  source: SanitizedLead["source"];
  intent: LeadIntent | null;
  status: string;
  property_address: string | null;
  property_id: string | null;
  search_label: string | null;
  notes: string;
  consent: boolean;
  consent_text: string | null;
  attribution: LeadAttribution | string | null;
  assigned_to: string | null;
  created_at: Date | string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS captured_leads (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  sms_opt_in boolean NOT NULL DEFAULT false,
  source text NOT NULL,
  intent text,
  status text NOT NULL DEFAULT 'new',
  property_address text,
  property_id text,
  search_label text,
  notes text NOT NULL DEFAULT '',
  consent boolean NOT NULL DEFAULT false,
  consent_text text,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
`;

const globalSql = globalThis as unknown as {
  __gvhsSql?: ReturnType<typeof postgres>;
  __gvhsSchema?: Promise<void>;
};

export function databaseUrl(): string {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ""
  ).trim();
}

export function leadsDatabaseConfigured(): boolean {
  return databaseUrl().length > 0;
}

function client() {
  const url = databaseUrl();
  if (!url) return null;
  if (!globalSql.__gvhsSql) {
    const local = /localhost|127\.0\.0\.1/.test(url);
    globalSql.__gvhsSql = postgres(url, {
      ssl: local ? false : "require",
      max: 1,
      idle_timeout: 20,
      connect_timeout: 15,
      prepare: false,
    });
  }
  return globalSql.__gvhsSql;
}

async function ready() {
  const sql = client();
  if (!sql) return null;
  if (!globalSql.__gvhsSchema) {
    const pending = sql.unsafe(SCHEMA).then(() => undefined);
    globalSql.__gvhsSchema = pending;
    pending.catch(() => {
      if (globalSql.__gvhsSchema === pending) globalSql.__gvhsSchema = undefined;
    });
  }
  await globalSql.__gvhsSchema;
  return sql;
}

function asAttribution(value: LeadAttribution | string | null): LeadAttribution {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as LeadAttribution;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  return value;
}

function iso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function rowToStoredLead(row: LeadRow): StoredLead {
  const attribution = asAttribution(row.attribution);
  const createdAt = iso(row.created_at);
  const notes = row.notes ?? "";
  const summary = attributionSummary(attribution);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    smsOptIn: Boolean(row.sms_opt_in),
    source: row.source,
    intent: row.intent ?? "inquiry",
    propertyAddress: row.property_address ?? undefined,
    propertyId: row.property_id ?? undefined,
    searchLabel: row.search_label ?? undefined,
    notes,
    consent: Boolean(row.consent),
    consentText: row.consent_text ?? undefined,
    attribution,
    assignedTo: row.assigned_to || "Casey Archibald",
    createdAt,
    status: "new",
    activityBody: [notes, summary].filter(Boolean).join("\n"),
  };
}

export async function insertLead(lead: SanitizedLead): Promise<StoredLead> {
  const sql = await ready();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<LeadRow[]>`
    INSERT INTO captured_leads (
      id, name, email, phone, sms_opt_in, source, intent, status,
      property_address, property_id, search_label, notes, consent, consent_text,
      attribution, assigned_to, created_at, updated_at
    ) VALUES (
      ${lead.id},
      ${lead.name},
      ${lead.email},
      ${lead.phone},
      ${lead.smsOptIn},
      ${lead.source},
      ${lead.intent},
      'new',
      ${lead.propertyAddress ?? null},
      ${lead.propertyId ?? null},
      ${lead.searchLabel ?? null},
      ${lead.notes},
      ${lead.consent},
      ${lead.consentText ?? null},
      ${sql.json(lead.attribution)},
      ${lead.assignedTo},
      ${lead.createdAt},
      ${lead.createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = captured_leads.updated_at
    RETURNING *
  `;
  return rowToStoredLead(rows[0]);
}

export async function listLeads(limit = 500): Promise<StoredLead[]> {
  const sql = await ready();
  if (!sql) return [];
  const rows = await sql<LeadRow[]>`
    SELECT *
    FROM captured_leads
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowToStoredLead);
}
