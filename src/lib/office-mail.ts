import { SITE } from "@/lib/site";

export function publicOrigin(request?: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (request) {
    const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
    if (forwarded && /^[A-Za-z0-9.:-]+$/.test(forwarded)) return `${proto}://${forwarded}`;
    const url = new URL(request.url);
    return `${url.protocol}//${url.host}`;
  }
  return "https://vancouverpropertysearch.ca";
}

function fromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    process.env.SENDGRID_FROM_EMAIL?.trim() ||
    process.env.LEAD_ALERT_FROM_EMAIL?.trim() ||
    ""
  );
}

function toE164(phone: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

type TwilioCreds = {
  accountSid: string;
  keySid: string;
  keySecret: string;
  from: string;
};

/** API key auth: the key SID and secret sign the request. The account SID is only the URL. */
function twilioCreds(): TwilioCreds | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() || "";
  const keySid = process.env.TWILIO_API_KEY_SID?.trim() || "";
  const keySecret = process.env.TWILIO_API_SECRET?.trim() || "";
  const from = process.env.TWILIO_FROM_NUMBER?.trim() || "";
  if (!accountSid || !keySid || !keySecret || !from) return null;
  return { accountSid, keySid, keySecret, from };
}

async function twilioPost(resource: "Messages.json" | "Calls.json", fields: Record<string, string>): Promise<"sent" | "skipped" | "failed"> {
  const creds = twilioCreds();
  if (!creds) return "skipped";
  try {
    const auth = Buffer.from(`${creds.keySid}:${creds.keySecret}`).toString("base64");
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/${resource}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(fields),
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    return "failed";
  }
}

export function twilioFromDisplay(): string | null {
  const creds = twilioCreds();
  if (!creds) return null;
  const digits = creds.from.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (local.length === 10) return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  return creds.from;
}

/** New-lead email goes here. Empty when that mailbox is not set. */
export function alertInbox(): string | null {
  return process.env.AGENT_ALERT_EMAIL?.trim() || null;
}

export function channelStatus(): { email: boolean; sms: boolean; voice: boolean; gmail: boolean } {
  const twilio = twilioCreds() !== null;
  const email = Boolean(fromAddress() && (process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim()));
  const gmailId = process.env.GMAIL_CLIENT_ID?.trim() || process.env.GOOGLE_CLIENT_ID?.trim();
  const gmailSecret = process.env.GMAIL_CLIENT_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  const gmailToken = process.env.GMAIL_REFRESH_TOKEN?.trim();
  return { email, sms: twilio, voice: twilio, gmail: Boolean(gmailId && gmailSecret && gmailToken) };
}

export function channelMessage(channel: "email" | "sms" | "voice"): string {
  if (channel === "email") return "Email is not connected.";
  if (channel === "sms") return "Texting is not connected.";
  return "Calling is not connected.";
}

export async function startOfficeCall(toRaw: string): Promise<"sent" | "skipped" | "failed"> {
  const creds = twilioCreds();
  if (!creds || !toRaw) return "skipped";
  const to = toE164(toRaw);
  const from = toE164(creds.from);
  if (!to || !from) return "failed";
  const result = await twilioPost("Calls.json", {
    To: to,
    From: from,
    Twiml: "<Response><Say>This is a call from your real estate office.</Say></Response>",
  });
  if (result === "failed") console.error("[office] call failed");
  return result;
}

export async function sendOfficeSms(toRaw: string, body: string): Promise<"sent" | "skipped" | "failed"> {
  const creds = twilioCreds();
  if (!creds || !toRaw) return "skipped";
  const to = toE164(toRaw);
  const from = toE164(creds.from);
  if (!to || !from) return "failed";
  const result = await twilioPost("Messages.json", { To: to, From: from, Body: body.slice(0, 320) });
  if (result === "failed") console.error("[office] sms failed");
  return result;
}

export async function sendOfficeMail(
  to: string,
  subject: string,
  text: string
): Promise<"sent" | "skipped" | "failed"> {
  const from = fromAddress();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  if (!from || !to || (!resendKey && !sendgridKey)) return "skipped";
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
    console.error("[office] email failed");
    return "failed";
  }
}

export function resetEmail(name: string, url: string): { subject: string; text: string } {
  return {
    subject: `Reset your ${SITE.company} password`,
    text: [
      `Hi ${name},`,
      "",
      "A password reset was requested for your office login.",
      "This link works for 1 hour and can be used once:",
      url,
      "",
      "If you did not ask for this, you can ignore the email.",
    ].join("\n"),
  };
}

export function inviteEmail(name: string, url: string): { subject: string; text: string } {
  return {
    subject: `You're invited to ${SITE.company}`,
    text: [
      `Hi ${name},`,
      "",
      `An admin added you to the ${SITE.company} office.`,
      "Set your password with this link. It works for 7 days and can be used once:",
      url,
      "",
      "After that, sign in at the agent office with your email and the password you chose.",
    ].join("\n"),
  };
}
