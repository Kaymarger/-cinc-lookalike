import { randomUUID } from "node:crypto";
import { officeDb } from "./leads-db";
import { channelMessage, publicOrigin, sendOfficeMail, sendOfficeSms, startOfficeCall } from "./office-mail";
import { EMPTY_SETTINGS, rate, sanitizeSettings, type OfficeSettings } from "./office-settings";

export type { OfficeSettings };
export { EMPTY_SETTINGS };

export type Vendor = {
  id: string;
  name: string;
  type: string;
  preferred: boolean;
  phone: string;
  notes: string;
  firstName: string;
  lastName: string;
  company: string;
  cell: string;
  officePhone: string;
  email: string;
  email2: string;
  description: string;
};

export type TrackStats = {
  sent: number;
  opens: number;
  clicks: number;
  leads: number;
  touches: number;
  openRate: number | null;
  clickRate: number | null;
};

function clip(value: unknown, max: number): string {
  return String(value ?? "").slice(0, max);
}

export async function readSettings(): Promise<OfficeSettings> {
  const sql = await officeDb();
  if (!sql) return EMPTY_SETTINGS;
  const rows = await sql<{ document: OfficeSettings | string }[]>`SELECT document FROM office_settings WHERE id = 'default'`;
  const value = rows[0]?.document;
  if (!value) return EMPTY_SETTINGS;
  if (typeof value === "string") {
    try {
      return sanitizeSettings(JSON.parse(value));
    } catch {
      return EMPTY_SETTINGS;
    }
  }
  return sanitizeSettings(value);
}

export async function writeSettings(input: unknown): Promise<OfficeSettings> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const document = sanitizeSettings(input);
  await sql`
    INSERT INTO office_settings (id, document, updated_at)
    VALUES ('default', ${sql.json(JSON.parse(JSON.stringify(document)))}, now())
    ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = now()
  `;
  return document;
}

export async function listVendors(): Promise<Vendor[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<{
    id: string; name: string; vendor_type: string; preferred: boolean; phone: string; notes: string;
    first_name: string; last_name: string; company: string; cell_phone: string; office_phone: string; email: string; email2: string; description: string;
  }[]>`
    SELECT id, name, vendor_type, preferred, phone, notes, first_name, last_name, company, cell_phone, office_phone, email, email2, description
    FROM office_vendors ORDER BY name
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.vendor_type,
    preferred: row.preferred,
    phone: row.phone,
    notes: row.notes,
    firstName: row.first_name,
    lastName: row.last_name,
    company: row.company,
    cell: row.cell_phone,
    officePhone: row.office_phone,
    email: row.email,
    email2: row.email2,
    description: row.description,
  }));
}

export function sanitizeVendor(input: unknown, id = ""): Vendor | { error: string } {
  const raw = (input && typeof input === "object" ? input : {}) as Partial<Vendor>;
  const firstName = clip(raw.firstName, 80).trim();
  const lastName = clip(raw.lastName, 80).trim();
  const type = clip(raw.type, 80).trim();
  const email = clip(raw.email, 160).trim();
  if (!type) return { error: "Enter a vendor type." };
  if (!firstName || !lastName) return { error: "Enter a first and last name." };
  if (!email) return { error: "Enter a primary email address." };
  const name = `${firstName} ${lastName}`.trim();
  return {
    id: id || `vendor-${randomUUID().slice(0, 8)}`,
    name,
    type,
    preferred: Boolean(raw.preferred),
    phone: clip(raw.cell || raw.phone, 40),
    notes: clip(raw.notes, 500),
    firstName,
    lastName,
    company: clip(raw.company, 120),
    cell: clip(raw.cell, 40),
    officePhone: clip(raw.officePhone, 40),
    email,
    email2: clip(raw.email2, 160),
    description: clip(raw.description, 1000),
  };
}

export async function saveVendor(input: unknown, id = ""): Promise<Vendor> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const vendor = sanitizeVendor(input, id);
  if ("error" in vendor) throw new Error(vendor.error);
  await sql`
    INSERT INTO office_vendors (id, name, vendor_type, preferred, phone, notes, first_name, last_name, company, cell_phone, office_phone, email, email2, description, created_at, updated_at)
    VALUES (${vendor.id}, ${vendor.name}, ${vendor.type}, ${vendor.preferred}, ${vendor.phone}, ${vendor.notes}, ${vendor.firstName}, ${vendor.lastName}, ${vendor.company}, ${vendor.cell}, ${vendor.officePhone}, ${vendor.email}, ${vendor.email2}, ${vendor.description}, now(), now())
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      vendor_type = EXCLUDED.vendor_type,
      preferred = EXCLUDED.preferred,
      phone = EXCLUDED.phone,
      notes = EXCLUDED.notes,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      company = EXCLUDED.company,
      cell_phone = EXCLUDED.cell_phone,
      office_phone = EXCLUDED.office_phone,
      email = EXCLUDED.email,
      email2 = EXCLUDED.email2,
      description = EXCLUDED.description,
      updated_at = now()
  `;
  return vendor;
}

export async function deleteVendor(id: string): Promise<void> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  await sql`DELETE FROM office_vendors WHERE id = ${id}`;
}

export async function saveUserPhoto(userId: string, contentType: string, bytes: Buffer): Promise<void> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(contentType)) throw new Error("Upload a PNG, JPEG, WEBP, or GIF.");
  if (bytes.length > 1_500_000) throw new Error("Photos must be 1.5 MB or smaller.");
  await sql`
    INSERT INTO office_user_photos (user_id, content_type, bytes, updated_at)
    VALUES (${userId}, ${contentType}, ${bytes}, now())
    ON CONFLICT (user_id) DO UPDATE SET content_type = EXCLUDED.content_type, bytes = EXCLUDED.bytes, updated_at = now()
  `;
}

export async function readUserPhoto(userId: string): Promise<{ contentType: string; bytes: Buffer } | null> {
  const sql = await officeDb();
  if (!sql) return null;
  const rows = await sql<{ content_type: string; bytes: Buffer }[]>`
    SELECT content_type, bytes FROM office_user_photos WHERE user_id = ${userId}
  `;
  const row = rows[0];
  return row ? { contentType: row.content_type, bytes: row.bytes } : null;
}

export async function recordSend(input: {
  channel: "email" | "sms" | "voice";
  to: string;
  subject?: string;
  body: string;
  autotrackId?: string;
}): Promise<{ ok: true; id: string } | { ok: false; status: number; message: string }> {
  const connected = input.channel === "email"
    ? (await import("./office-mail")).channelStatus().email
    : input.channel === "sms"
      ? (await import("./office-mail")).channelStatus().sms
      : (await import("./office-mail")).channelStatus().voice;
  if (!connected) return { ok: false, status: 409, message: channelMessage(input.channel) };
  const id = `send-${randomUUID().slice(0, 8)}`;
  const origin = publicOrigin();
  let result: "sent" | "skipped" | "failed" = "failed";
  let provider = "";
  if (input.channel === "email") {
    const text = `${input.body}\n\n${origin}/api/office/track/click/${id}`;
    result = await sendOfficeMail(input.to, input.subject || "Message", text);
    provider = process.env.RESEND_API_KEY ? "resend" : "sendgrid";
  } else if (input.channel === "sms") {
    result = await sendOfficeSms(input.to, input.body);
    provider = "twilio";
  } else {
    result = await startOfficeCall(input.to);
    provider = "twilio";
  }
  if (result === "skipped") return { ok: false, status: 409, message: channelMessage(input.channel) };
  if (result !== "sent") return { ok: false, status: 502, message: "The provider rejected that send. Nothing was counted." };
  const sql = await officeDb();
  if (sql) {
    await sql`
      INSERT INTO office_sends (id, channel, status, provider, to_address, subject, autotrack_id)
      VALUES (${id}, ${input.channel}, 'sent', ${provider}, ${input.to.slice(0, 200)}, ${(input.subject || "").slice(0, 200)}, ${input.autotrackId || ""})
    `;
  }
  return { ok: true, id };
}

export async function trackEvent(sendId: string, kind: "open" | "click"): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) return false;
  const found = await sql<{ id: string }[]>`SELECT id FROM office_sends WHERE id = ${sendId} AND status = 'sent' LIMIT 1`;
  if (!found.length) return false;
  await sql`
    INSERT INTO office_send_events (id, send_id, kind) VALUES (${`evt-${randomUUID().slice(0, 8)}`}, ${sendId}, ${kind})
  `;
  return true;
}

export async function statsByTrack(): Promise<Record<string, TrackStats>> {
  const sql = await officeDb();
  if (!sql) return {};
  const sends = await sql<{ autotrack_id: string; sent: number; leads: number }[]>`
    SELECT autotrack_id, count(*)::int AS sent, count(DISTINCT to_address)::int AS leads
    FROM office_sends
    WHERE status = 'sent' AND autotrack_id <> ''
    GROUP BY autotrack_id
  `;
  const events = await sql<{ autotrack_id: string; kind: string; n: number }[]>`
    SELECT s.autotrack_id, e.kind, count(*)::int AS n
    FROM office_send_events e
    JOIN office_sends s ON s.id = e.send_id
    WHERE s.autotrack_id <> ''
    GROUP BY s.autotrack_id, e.kind
  `;
  const stats: Record<string, TrackStats> = {};
  for (const row of sends) {
    stats[row.autotrack_id] = { sent: row.sent, leads: row.leads, opens: 0, clicks: 0, touches: row.sent, openRate: null, clickRate: null };
  }
  for (const row of events) {
    const current = stats[row.autotrack_id] ?? { sent: 0, leads: 0, opens: 0, clicks: 0, touches: 0, openRate: null, clickRate: null };
    if (row.kind === "open") current.opens = row.n;
    if (row.kind === "click") current.clicks = row.n;
    current.openRate = rate(current.opens, current.sent);
    current.clickRate = rate(current.clicks, current.sent);
    stats[row.autotrack_id] = current;
  }
  return stats;
}

export async function marketingReport(year: number, month: number): Promise<{
  locations: { location: string; leads: number; cost: number | null }[];
  totalLeads: number;
  searchBudget: number;
  listcastBudget: number;
}> {
  const settings = await readSettings();
  const sql = await officeDb();
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  if (!sql) {
    return { locations: [], totalLeads: 0, searchBudget: settings.searchBudget, listcastBudget: settings.listcastBudget };
  }
  const rows = await sql<{ location: string; leads: number }[]>`
    SELECT COALESCE(NULLIF(search_label, ''), NULLIF(source, ''), 'Unknown') AS location, count(*)::int AS leads
    FROM captured_leads
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY 1
    ORDER BY count(*) DESC
  `;
  const totalLeads = rows.reduce((sum, row) => sum + row.leads, 0);
  const locations = rows.map((row) => ({
    location: row.location,
    leads: row.leads,
    cost: settings.searchBudget > 0 && row.leads > 0 ? Math.round(settings.searchBudget / row.leads) : null,
  }));
  return { locations, totalLeads, searchBudget: settings.searchBudget, listcastBudget: settings.listcastBudget };
}

export async function loadLeadFields(leadId: string): Promise<Record<string, string>> {
  const sql = await officeDb();
  if (!sql) return {};
  const rows = await sql<{ document: Record<string, string> }[]>`SELECT document FROM office_lead_fields WHERE lead_id = ${leadId}`;
  return rows[0]?.document ?? {};
}

export async function saveLeadFields(leadId: string, document: Record<string, string>): Promise<string | null> {
  const sql = await officeDb();
  if (!sql) return "Office data is not connected.";
  const current = await loadLeadFields(leadId);
  const clean: Record<string, string> = { ...current };
  for (const [key, value] of Object.entries(document)) clean[key.slice(0, 40)] = String(value ?? "").slice(0, 4000);
  await sql`
    INSERT INTO office_lead_fields (lead_id, document, updated_at)
    VALUES (${leadId.slice(0, 80)}, ${sql.json(clean)}, now())
    ON CONFLICT (lead_id) DO UPDATE SET document = EXCLUDED.document, updated_at = now()
  `;
  return null;
}
