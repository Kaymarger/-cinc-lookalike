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

function row(label: string, value: string): string {
  return `<tr>
<td valign="top" style="padding:8px 12px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#6b7280;width:88px;">${escapeHtml(label)}</td>
<td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.4;color:#1c1c1c;">${escapeHtml(value)}</td>
</tr>`;
}

export function agentAlertEmail(lead: SanitizedLead): { subject: string; text: string; html: string } {
  const origin = siteOrigin();
  const type = INTENT_LABEL[lead.intent] || "New lead";
  const source = SOURCE_LABEL[lead.source] || lead.source;
  const message = lead.notes.trim() || "No message.";
  const phone = lead.phone.trim() || "No phone";
  const open = `${origin}/agent/leads/${encodeURIComponent(lead.id)}`;
  const subject = `New lead: ${lead.name} — ${type}`;
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
</head>
<body style="margin:0;padding:0;background:#f4f1ec;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f1ec;">${escapeHtml(`${lead.name} · ${type} · ${source}`)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td style="padding:22px 28px;background:#04427d;font-family:Arial,Helvetica,sans-serif;">
<p style="margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#d6e4f0;">${escapeHtml(SITE.company)}</p>
<h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;font-weight:bold;color:#ffffff;">New lead</h1>
<p style="margin:6px 0 0;font-size:14px;line-height:1.4;color:#d6e4f0;">Assigned to ${escapeHtml(lead.assignedTo)}</p>
</td></tr>
<tr><td height="3" bgcolor="#e11b22" style="font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:22px 28px 8px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Name", lead.name)}
${row("Email", lead.email)}
${row("Phone", phone)}
${row("Type", type)}
${row("Source", source)}
<tr>
<td valign="top" style="padding:8px 12px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.4;color:#6b7280;">Message</td>
<td valign="top" style="padding:8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1c;">${escapeHtml(message)}</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:8px 28px 28px;">
<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(open)}" style="height:46px;v-text-anchor:middle;width:180px;" arcsize="8%" strokecolor="#04427d" fillcolor="#04427d"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">Open lead</center></v:roundrect><![endif]-->
<!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#04427d" style="border-radius:4px;"><a href="${escapeHtml(open)}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:18px;color:#ffffff;text-decoration:none;font-weight:bold;">Open lead</a></td></tr></table><!--<![endif]-->
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
  return { subject, text, html };
}
