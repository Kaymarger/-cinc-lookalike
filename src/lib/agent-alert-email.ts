import type { SanitizedLead } from "./lead-intake";
import { SITE } from "./site";

const INTENT_LABEL: Record<SanitizedLead["intent"], string> = {
  buyer: "Buyer signup",
  seller: "Seller signup",
  valuation: "Home valuation",
  inquiry: "General inquiry",
};

const SOURCE_LABEL: Record<SanitizedLead["source"], string> = {
  showing_request: "Showing request",
  ask_question: "Question about a home",
  registration: "Registration",
  photo_gate: "Photo gallery",
  search_alert: "Saved search",
  general: "Website",
  buyer_signup: "Buyer signup",
  seller_signup: "Seller signup",
  home_valuation: "Home valuation",
};

function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://vancouverpropertysearch.ca";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const NAVY = "#1b3040";

function row(label: string, value: string): string {
  return `<tr>
<td valign="top" style="padding:10px 16px 10px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#6b7280;width:96px;">${escapeHtml(label)}</td>
<td valign="top" style="padding:10px 0;font-family:${FONT};font-size:16px;line-height:1.6;color:#1a1a1a;">${escapeHtml(value)}</td>
</tr>`;
}

export function agentAlertEmail(
  lead: SanitizedLead,
  options?: { activity?: boolean }
): { subject: string; text: string; html: string } {
  const origin = siteOrigin();
  const type = INTENT_LABEL[lead.intent] || "New lead";
  const source = SOURCE_LABEL[lead.source] || lead.source;
  const message = lead.notes.trim() || "No message.";
  const phone = lead.phone.trim() || "No phone";
  const open = `${origin}/agent/leads/${encodeURIComponent(lead.id)}`;
  const subject = options?.activity
    ? `Activity: ${source} from ${lead.name}`
    : `New lead: ${lead.name} — ${type}`;
  const text = [
    subject,
    `Assigned to ${lead.assignedTo}`,
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Phone: ${phone}`,
    `Type: ${type}`,
    `Source: ${source}`,
    `Message: ${message}`,
    "",
    `Open lead: ${open}`,
  ].join("\n");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
<style>
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .outer { padding: 12px 0 !important; }
    .px { padding-left: 24px !important; padding-right: 24px !important; }
    .btn a { display: block !important; text-align: center !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f5f5f5;">${escapeHtml(`${lead.name}. ${type}. ${source}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
<tr><td align="center" class="outer" style="padding:32px 16px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;">
<tr><td class="px" style="padding:32px 24px 0;font-family:${FONT};">
<p style="margin:0;font-size:13px;line-height:1.6;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;">${escapeHtml(SITE.company)}</p>
<h1 style="margin:8px 0 0;font-family:${FONT};font-size:26px;line-height:1.3;font-weight:600;color:#1a1a1a;">${options?.activity ? "Activity" : "New lead"}</h1>
<p style="margin:6px 0 0;font-family:${FONT};font-size:16px;line-height:1.6;color:#5f6770;">Assigned to ${escapeHtml(lead.assignedTo)}</p>
</td></tr>
<tr><td class="px" style="padding:20px 24px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e7e7e7;border-radius:12px;">
<tr><td style="padding:8px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Name", lead.name)}
${row("Email", lead.email)}
${row("Phone", phone)}
${row("Type", type)}
${row("Source", source)}
<tr>
<td valign="top" style="padding:10px 16px 10px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:#6b7280;">Message</td>
<td valign="top" style="padding:10px 0;font-family:${FONT};font-size:16px;line-height:1.6;color:#1a1a1a;">${escapeHtml(message)}</td>
</tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td class="px" style="padding:20px 24px 32px;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(open)}" style="height:48px;v-text-anchor:middle;width:180px;" arcsize="50%" strokecolor="${NAVY}" fillcolor="${NAVY}"><w:anchorlock/><center style="color:#ffffff;font-family:${FONT};font-size:16px;font-weight:600;">Open lead</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn"><tr><td align="center" bgcolor="${NAVY}" style="border-radius:999px;"><a href="${escapeHtml(open)}" style="display:inline-block;padding:16px 32px;font-family:${FONT};font-size:16px;line-height:1.2;color:#ffffff;text-decoration:none;font-weight:600;border-radius:999px;">Open lead</a></td></tr></table><!--<![endif]-->
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  return { subject, text, html };
}
