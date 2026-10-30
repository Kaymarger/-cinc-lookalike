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
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "https://cinc-lookalike.vercel.app";
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

export function channelStatus(): { email: boolean; sms: boolean; voice: boolean } {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromNumber = process.env.TWILIO_FROM_NUMBER?.trim();
  const twilio = Boolean(sid && token && fromNumber);
  const email = Boolean(fromAddress() && (process.env.RESEND_API_KEY?.trim() || process.env.SENDGRID_API_KEY?.trim()));
  return { email, sms: twilio, voice: twilio };
}

export function channelMessage(channel: "email" | "sms" | "voice"): string {
  if (channel === "email") return "Email is not connected. Add RESEND_API_KEY or SENDGRID_API_KEY, plus RESEND_FROM_EMAIL or SENDGRID_FROM_EMAIL.";
  if (channel === "sms") return "Texting is not connected. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.";
  return "Calling is not connected. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.";
}

export async function startOfficeCall(toRaw: string): Promise<"sent" | "skipped" | "failed"> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromRaw = process.env.TWILIO_FROM_NUMBER?.trim() || "";
  if (!sid || !token || !fromRaw || !toRaw) return "skipped";
  const to = toE164(toRaw);
  const from = toE164(fromRaw);
  if (!to || !from) return "failed";
  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const payload = new URLSearchParams({
      To: to,
      From: from,
      Twiml: "<Response><Say>This is a call from your real estate office.</Say></Response>",
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Calls.json`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: payload,
      signal: AbortSignal.timeout(8000),
    });
    return response.ok ? "sent" : "failed";
  } catch {
    console.error("[office] call failed");
    return "failed";
  }
}

export async function sendOfficeSms(toRaw: string, body: string): Promise<"sent" | "skipped" | "failed"> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const fromRaw = process.env.TWILIO_FROM_NUMBER?.trim() || "";
  if (!sid || !token || !fromRaw || !toRaw) return "skipped";
  const to = toE164(toRaw);
  const from = toE164(fromRaw);
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
    console.error("[office] sms failed");
    return "failed";
  }
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
