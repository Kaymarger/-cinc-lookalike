import postgres from "postgres";
import {
  attributionSummary,
  type LeadAttribution,
  type LeadIntent,
  type SanitizedLead,
} from "@/lib/lead-intake";
import type { OfficeRole } from "@/lib/office-access";
import { seesAllLeads } from "@/lib/office-access";

export type StoredLead = SanitizedLead & {
  status: "new";
  activityBody: string;
  assignedUserId: string | null;
  partnerName: string;
  partnerUserId: string | null;
  listingAgent: string;
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
  assigned_user_id: string | null;
  partner_user_id: string | null;
  partner_name: string | null;
  listing_agent: string | null;
  created_at: Date | string;
};

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS captured_leads (
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
  assigned_user_id text,
  partner_user_id text,
  partner_name text,
  listing_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS assigned_user_id text`,
  `ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS partner_user_id text`,
  `ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS partner_name text`,
  `ALTER TABLE captured_leads ADD COLUMN IF NOT EXISTS listing_agent text`,
  `CREATE TABLE IF NOT EXISTS office_users (
  id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  cell text NOT NULL DEFAULT '',
  home_phone text NOT NULL DEFAULT '',
  office_phone text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  license_number text NOT NULL DEFAULT '',
  loan_url text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  signature text NOT NULL DEFAULT '',
  subdomain text NOT NULL DEFAULT '',
  facebook text NOT NULL DEFAULT '',
  google text NOT NULL DEFAULT '',
  pinterest text NOT NULL DEFAULT '',
  twitter text NOT NULL DEFAULT '',
  instagram text NOT NULL DEFAULT '',
  youtube text NOT NULL DEFAULT '',
  linkedin text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  bootstrap boolean NOT NULL DEFAULT false,
  must_set_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `ALTER TABLE office_users ADD COLUMN IF NOT EXISTS must_set_password boolean NOT NULL DEFAULT false`,
  `ALTER TABLE office_users ADD COLUMN IF NOT EXISTS preferences jsonb NOT NULL DEFAULT '{}'::jsonb`,
  `CREATE TABLE IF NOT EXISTS office_access_tokens (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  kind text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE INDEX IF NOT EXISTS office_access_tokens_user_idx ON office_access_tokens (user_id)`,
  `CREATE TABLE IF NOT EXISTS lead_routing (
  id text PRIMARY KEY,
  mode text NOT NULL,
  fixed_user_id text,
  pool_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  rr_cursor integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS lead_saved_searches (
  id text PRIMARY KEY,
  lead_id text NOT NULL,
  lead_email text NOT NULL,
  name text NOT NULL,
  city text NOT NULL DEFAULT '',
  min_price integer,
  max_price integer,
  beds integer,
  baths integer,
  property_type text NOT NULL DEFAULT '',
  frequency text NOT NULL DEFAULT 'Daily',
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `ALTER TABLE lead_saved_searches ADD COLUMN IF NOT EXISTS criteria jsonb NOT NULL DEFAULT '{}'::jsonb`,
  `CREATE INDEX IF NOT EXISTS lead_saved_searches_email_idx ON lead_saved_searches (lower(lead_email))`,
  `CREATE INDEX IF NOT EXISTS lead_saved_searches_lead_idx ON lead_saved_searches (lead_id)`,
  `CREATE TABLE IF NOT EXISTS autotracks (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  document jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS autotrack_files (
  id text PRIMARY KEY,
  track_id text NOT NULL,
  step_id text NOT NULL,
  name text NOT NULL,
  content_type text NOT NULL,
  size_bytes integer NOT NULL,
  bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE INDEX IF NOT EXISTS autotrack_files_step_idx ON autotrack_files (step_id)`,
  `CREATE TABLE IF NOT EXISTS autotrack_hidden (
  id text PRIMARY KEY
)`,
  `CREATE TABLE IF NOT EXISTS office_settings (
  id text PRIMARY KEY,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS office_vendors (
  id text PRIMARY KEY,
  name text NOT NULL,
  vendor_type text NOT NULL DEFAULT '',
  preferred boolean NOT NULL DEFAULT false,
  phone text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS office_user_photos (
  user_id text PRIMARY KEY,
  content_type text NOT NULL,
  bytes bytea NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE TABLE IF NOT EXISTS office_sends (
  id text PRIMARY KEY,
  channel text NOT NULL,
  status text NOT NULL,
  provider text NOT NULL DEFAULT '',
  to_address text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  autotrack_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE INDEX IF NOT EXISTS office_sends_track_idx ON office_sends (autotrack_id)`,
  `CREATE TABLE IF NOT EXISTS office_send_events (
  id text PRIMARY KEY,
  send_id text NOT NULL,
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
)`,
  `CREATE INDEX IF NOT EXISTS office_send_events_send_idx ON office_send_events (send_id)`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS first_name text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS company text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS cell_phone text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS office_phone text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS email2 text NOT NULL DEFAULT ''`,
  `ALTER TABLE office_vendors ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS office_lead_fields (
  lead_id text PRIMARY KEY,
  document jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
];

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

export type DatabaseStatus = {
  connected: boolean;
  configured: boolean;
  message: string;
};

export async function databaseStatus(): Promise<DatabaseStatus> {
  if (!leadsDatabaseConfigured()) {
    return {
      connected: false,
      configured: false,
      message:
        "Database is not connected. In Vercel, open Storage, create a Neon database, then redeploy. The app uses DATABASE_URL or POSTGRES_URL.",
    };
  }
  try {
    await listLeads(1);
    return {
      connected: true,
      configured: true,
      message: "Database connected. New leads from the public site are saved here.",
    };
  } catch {
    console.error("[leads] database status check failed");
    return {
      connected: false,
      configured: true,
      message:
        "A database URL is set, but the office could not reach it. Check DATABASE_URL or POSTGRES_URL in Vercel, then redeploy.",
    };
  }
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
    const pending = (async () => {
      for (const statement of SCHEMA_STATEMENTS) {
        await sql.unsafe(statement);
      }
    })();
    globalSql.__gvhsSchema = pending;
    pending.catch(() => {
      if (globalSql.__gvhsSchema === pending) globalSql.__gvhsSchema = undefined;
    });
  }
  await globalSql.__gvhsSchema;
  return sql;
}

export async function officeDb() {
  return ready();
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
    assignedUserId: row.assigned_user_id,
    partnerName: row.partner_name || "Unassigned",
    partnerUserId: row.partner_user_id,
    listingAgent: row.listing_agent || "Unassigned",
    createdAt,
    status: "new",
    activityBody: [notes, summary].filter(Boolean).join("\n"),
  };
}

export async function insertLead(
  lead: SanitizedLead & { assignedUserId?: string | null }
): Promise<StoredLead> {
  const sql = await ready();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<LeadRow[]>`
    INSERT INTO captured_leads (
      id, name, email, phone, sms_opt_in, source, intent, status,
      property_address, property_id, search_label, notes, consent, consent_text,
      attribution, assigned_to, assigned_user_id, partner_name, listing_agent,
      created_at, updated_at
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
      ${lead.assignedUserId ?? null},
      'Unassigned',
      'Unassigned',
      ${lead.createdAt},
      ${lead.createdAt}
    )
    ON CONFLICT (id) DO UPDATE SET updated_at = captured_leads.updated_at
    RETURNING *
  `;
  return rowToStoredLead(rows[0]);
}

export type LeadScope = {
  role: OfficeRole;
  userId: string;
  name: string;
};

export async function getLead(id: string): Promise<StoredLead | null> {
  const sql = await ready();
  if (!sql) return null;
  const rows = await sql<LeadRow[]>`
    SELECT * FROM captured_leads WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? rowToStoredLead(rows[0]) : null;
}

export async function listLeads(limit = 500, scope?: LeadScope | null): Promise<StoredLead[]> {
  const sql = await ready();
  if (!sql) return [];
  const name = (scope?.name || "").trim().toLowerCase();
  const rows = !scope || seesAllLeads(scope.role)
    ? await sql<LeadRow[]>`
        SELECT * FROM captured_leads ORDER BY created_at DESC LIMIT ${limit}
      `
    : scope.role === "agent"
      ? await sql<LeadRow[]>`
          SELECT * FROM captured_leads
          WHERE assigned_user_id = ${scope.userId} OR lower(assigned_to) = ${name}
          ORDER BY created_at DESC LIMIT ${limit}
        `
      : scope.role === "isa"
        ? await sql<LeadRow[]>`
            SELECT * FROM captured_leads
            WHERE assigned_user_id = ${scope.userId}
              OR lower(assigned_to) = ${name}
              OR assigned_to IS NULL
              OR btrim(assigned_to) = ''
              OR lower(assigned_to) = 'unassigned'
            ORDER BY created_at DESC LIMIT ${limit}
          `
        : scope.role === "lender"
          ? await sql<LeadRow[]>`
              SELECT * FROM captured_leads
              WHERE partner_user_id = ${scope.userId} OR lower(partner_name) = ${name}
              ORDER BY created_at DESC LIMIT ${limit}
            `
          : [];
  return rows.map(rowToStoredLead);
}

export async function assignCapturedLead(
  id: string,
  assign: {
    agent: string;
    agentUserId: string | null;
    partner: string;
    partnerUserId: string | null;
    listing: string;
  }
): Promise<StoredLead | null> {
  const sql = await ready();
  if (!sql) return null;
  const rows = await sql<LeadRow[]>`
    UPDATE captured_leads
    SET assigned_to = ${assign.agent},
        assigned_user_id = ${assign.agentUserId},
        partner_name = ${assign.partner},
        partner_user_id = ${assign.partnerUserId},
        listing_agent = ${assign.listing},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? rowToStoredLead(rows[0]) : null;
}
