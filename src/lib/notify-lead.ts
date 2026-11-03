import { randomUUID } from "node:crypto";
import { attributionSummary, type SanitizedLead } from "@/lib/lead-intake";
import { officeDb } from "@/lib/leads-db";
import { sendOfficeSms } from "@/lib/office-mail";
import { SITE } from "@/lib/site";
import { isTestLeadEmail } from "@/lib/test-lead";

export type AlertChannel = "sent" | "skipped" | "failed";

export type AlertReport = {
  email: AlertChannel;
  sms: AlertChannel;
};

const INTENT_LABEL: Record<SanitizedLead["intent"], string> = {
  buyer: "Buyer signup",
  seller: "Seller signup",
  valuation: "Home valuation",
  inquiry: "Inquiry",
};

function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://vancouverpropertysearch.ca";
}

function leadText(lead: SanitizedLead): string {
  const campaign = attributionSummary(lead.attribution);
  return [
    `New ${INTENT_LABEL[lead.intent]} for ${lead.assignedTo}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${lead.phone || "—"}`,
    `Text opt-in: ${lead.smsOptIn ? "yes" : "no"}`,
    `Source: ${lead.source}`,
    lead.propertyAddress ? `Property: ${lead.propertyAddress}` : "",
    lead.searchLabel ? `Search: ${lead.searchLabel}` : "",
    lead.notes ? `Notes: ${lead.notes}` : "",
    campaign ? campaign : "",
    `CRM: ${siteOrigin()}/agent/leads`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendEmail(lead: SanitizedLead): Promise<AlertChannel> {
  const to = process.env.AGENT_ALERT_EMAIL?.trim();
  if (!to) return "skipped";
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.LEAD_ALERT_FROM_EMAIL?.trim() ||
    "";
  if (!resendKey && !sendgridKey) return "skipped";
  if (!from) return "skipped";

  const subject = `New lead: ${lead.name} — ${INTENT_LABEL[lead.intent]}`;
  const text = leadText(lead);
  try {
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(8000),
      });
      return response.ok ? "sent" : "failed";
    }
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: SITE.company },
        subject,
        content: [{ type: "text/plain", value: text }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    console.error("[leads] email alert failed");
    return "failed";
  }
}

export function assignedAgentName(): string {
  return process.env.AGENT_ALERT_NAME?.trim() || SITE.agent;
}

export async function sendLeadEmail(toRaw: string, subject: string, text: string): Promise<AlertChannel> {
  const to = toRaw.trim();
  if (!to) return "skipped";
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.LEAD_ALERT_FROM_EMAIL?.trim() ||
    "";
  if ((!resendKey && !sendgridKey) || !from) return "skipped";
  try {
    if (resendKey) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [to], subject, text }),
        signal: AbortSignal.timeout(8000),
      });
      return response.ok ? "sent" : "failed";
    }
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${sendgridKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: SITE.company },
        subject,
        content: [{ type: "text/plain", value: text }],
      }),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    console.error("[leads] lead email failed");
    return "failed";
  }
}

export async function sendLeadSms(phone: string, body: string): Promise<AlertChannel> {
  return sendOfficeSms(phone, body);
}

export async function sendWelcomeAndAlert(lead: SanitizedLead): Promise<AlertReport> {
  if (isTestLeadEmail(lead.email)) return { email: "skipped", sms: "skipped" };
  const first = lead.name.split(" ")[0] || "there";
  const origin = siteOrigin();
  const unsubscribe = `Unsubscribe: ${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const savedSearch = lead.source === "search_alert";
  const subject = savedSearch
    ? `Saved search: ${lead.searchLabel || "Greater Vancouver homes"}`
    : `Welcome to ${SITE.name}`;
  const welcome = savedSearch
    ? [
        `Hi ${first},`,
        "",
        `Your saved search is on: ${lead.searchLabel || "Greater Vancouver homes"}.`,
        "We'll email you when homes that match are listed.",
        unsubscribe,
        "",
        SITE.agent,
        SITE.phoneDisplay,
      ].join("\n")
    : [
        `Hi ${first},`,
        "",
        `Thanks for registering with ${SITE.company}.`,
        "You can search homes and save a search for alerts.",
        lead.searchLabel ? `Your saved search: ${lead.searchLabel}` : "",
        unsubscribe,
        "",
        SITE.agent,
        SITE.phoneDisplay,
      ]
        .filter((line) => line !== undefined)
        .join("\n")
        .replace(/\n{3,}/g, "\n\n");
  const email = await sendLeadEmail(lead.email, subject, welcome);
  const sms = lead.smsOptIn
    ? await sendLeadSms(lead.phone, `${SITE.company}: you're signed up for home alerts. Reply STOP to opt out.`)
    : "skipped";
  return { email, sms };
}

async function recordOfficeAlert(kind: string, title: string, body: string): Promise<void> {
  const sql = await officeDb();
  if (!sql) return;
  await sql`
    INSERT INTO office_notifications (id, kind, title, body)
    VALUES (${`note-${randomUUID().slice(0, 8)}`}, ${kind.slice(0, 80)}, ${title.slice(0, 160)}, ${body.slice(0, 2000)})
  `;
}

export async function listOfficeAlerts(limit = 30): Promise<{ id: string; kind: string; title: string; body: string; createdAt: string }[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<{ id: string; kind: string; title: string; body: string; created_at: Date | string }[]>`
    SELECT id, kind, title, body, created_at
    FROM office_notifications
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
  }));
}

export async function notifyAssignedAgent(lead: SanitizedLead): Promise<AlertReport> {
  if (isTestLeadEmail(lead.email)) return { email: "skipped", sms: "skipped" };
  const email = await sendEmail(lead);
  await recordOfficeAlert("New Leads", `New lead: ${lead.name}`, leadText(lead)).catch(() => undefined);
  return { email, sms: "skipped" };
}
