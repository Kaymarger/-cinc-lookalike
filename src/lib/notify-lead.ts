import { attributionSummary, type SanitizedLead } from "@/lib/lead-intake";
import { SITE } from "@/lib/site";

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
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://cinc-lookalike.vercel.app";
}

function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
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

async function sendSms(lead: SanitizedLead): Promise<AlertChannel> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const rawTo = process.env.AGENT_ALERT_PHONE?.trim() || "";
  const rawFrom = process.env.TWILIO_FROM_NUMBER?.trim() || "";
  if (!rawTo && !sid && !token && !rawFrom) return "skipped";
  if (!rawTo || !sid || !token || !rawFrom) return "skipped";
  const to = toE164(rawTo);
  const from = toE164(rawFrom);
  if (!to || !from) return "failed";

  const campaign = [lead.attribution.utmSource, lead.attribution.utmCampaign]
    .filter(Boolean)
    .join("/");
  const body = [
    `New lead: ${lead.name}`,
    INTENT_LABEL[lead.intent],
    lead.phone || lead.email,
    campaign,
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 320);

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const payload = new URLSearchParams({ To: to, From: from, Body: body });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: payload,
        signal: AbortSignal.timeout(8000),
      }
    );
    return response.ok ? "sent" : "failed";
  } catch {
    console.error("[leads] sms alert failed");
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
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const rawFrom = process.env.TWILIO_FROM_NUMBER?.trim() || "";
  if (!sid || !token || !rawFrom || !phone) return "skipped";
  const to = toE164(phone);
  const from = toE164(rawFrom);
  if (!to || !from) return "failed";
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const payload = new URLSearchParams({ To: to, From: from, Body: body.slice(0, 320) });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    console.error("[leads] lead sms failed");
    return "failed";
  }
}

export async function sendWelcomeAndAlert(lead: SanitizedLead): Promise<AlertReport> {
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

export async function notifyAssignedAgent(lead: SanitizedLead): Promise<AlertReport> {
  const [email, sms] = await Promise.all([sendEmail(lead), sendSms(lead)]);
  return { email, sms };
}
