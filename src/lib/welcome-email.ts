import type { LeadIntent } from "./lead-intake";
import { formatPrice } from "./search";
import { SITE } from "./site";

export type WelcomeListing = {
  address: string;
  city: string;
  price: number;
  href: string;
  image?: string;
};

const SENDER = "alerts@vancouverpropertysearch.ca";

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

function firstName(name: string): string {
  const first = name.trim().split(/\s+/)[0];
  return first || "there";
}

function copyFor(intent: LeadIntent | undefined): { subject: string; line: string; preheader: string } {
  if (intent === "seller") {
    return {
      subject: "let's talk about selling your Vancouver home",
      line: "You’re set up as a seller. We’ll look at price, timing, and how the home should be presented.",
      preheader: "Casey Archibald’s team will be in touch about your sale.",
    };
  }
  if (intent === "valuation") {
    return {
      subject: "your home value request is in",
      line: "We have your home valuation request and will follow up with a clear read on your home and nearby sales.",
      preheader: "Casey Archibald’s team will follow up on your home value.",
    };
  }
  if (intent === "inquiry") {
    return {
      subject: "we’re ready when you are",
      line: "Whether you are buying, selling, or watching the market, we have your note.",
      preheader: "Casey Archibald’s team will follow up personally.",
    };
  }
  return {
    subject: "your Vancouver home search is ready",
    line: "You’re set up as a buyer. We’ll watch Greater Vancouver for homes that fit.",
    preheader: "Casey Archibald’s team will be in touch, and matching homes will come to you.",
  };
}

function button(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeHref}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="8%" strokecolor="#04427d" fillcolor="#04427d"><w:anchorlock/><center style="color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:bold;">${safeLabel}</center></v:roundrect><![endif]--><!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="#04427d" style="border-radius:4px;"><a href="${safeHref}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:18px;color:#ffffff;text-decoration:none;font-weight:bold;">${safeLabel}</a></td></tr></table><!--<![endif]-->`;
}

export function registrationWelcome(
  lead: { name: string; email: string; intent?: LeadIntent },
  listings: WelcomeListing[] = [],
): { subject: string; text: string; html: string; preheader: string } {
  const first = firstName(lead.name);
  const origin = siteOrigin();
  const search = `${origin}/search`;
  const saved = `${origin}/account/settings`;
  const contact = `${origin}/contact#inquiry`;
  const unsubscribe = `${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const logo = `${origin}/brand/archibald-logo.png`;
  const photo = `${origin}/brand/casey.jpg`;
  const tone = copyFor(lead.intent);
  const subject = `Welcome, ${first}, ${tone.subject}`;
  const cards = listings.slice(0, 3);
  const listingText = cards.length
    ? cards.map((home) => `${home.address}, ${home.city} — ${formatPrice(home.price)}\n${home.href.startsWith("http") ? home.href : origin + home.href}`).join("\n\n")
    : "Browse Greater Vancouver homes whenever you are ready.";
  const text = [
    `Hi ${first},`,
    "",
    `Thank you for connecting with ${SITE.company}.`,
    tone.line,
    "",
    "What happens next: Casey Archibald’s team will reach out personally, and you’ll get new listings that match your search.",
    "",
    listingText,
    "",
    `Browse homes: ${search}`,
    `Saved searches: ${saved}`,
    "",
    SITE.agent,
    SITE.company,
    "RE/MAX Crest Realty",
    SITE.addressLine,
    SITE.cityLine,
    SITE.phoneDisplay,
    `Contact: ${contact}`,
    "",
    `${SITE.company}, RE/MAX Crest Realty, Vancouver.`,
    "You received this email because you signed up at vancouverpropertysearch.ca.",
    `Unsubscribe or manage alerts: ${unsubscribe}`,
    `Sent from ${SENDER}`,
  ].join("\n");

  const cardHtml = cards
    .map((home) => {
      const href = home.href.startsWith("http") ? home.href : `${origin}${home.href}`;
      const image = home.image ? (home.image.startsWith("http") ? home.image : `${origin}${home.image}`) : "";
      const photoRow = image
        ? `<tr><td style="padding:0;"><a href="${escapeHtml(href)}"><img src="${escapeHtml(image)}" alt="" width="552" style="display:block;width:100%;max-width:552px;height:auto;border:0;" /></a></td></tr>`
        : "";
      return `<tr><td style="padding:0 0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e6e1d8;border-radius:4px;">${photoRow}<tr><td style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;"><p style="margin:0;font-size:18px;line-height:1.3;font-weight:bold;color:#04427d;">${escapeHtml(formatPrice(home.price))}</p><p style="margin:6px 0 0;font-size:15px;line-height:1.4;color:#1c1c1c;">${escapeHtml(home.address)}</p><p style="margin:2px 0 0;font-size:14px;line-height:1.4;color:#5c6570;">${escapeHtml(home.city)}</p><p style="margin:10px 0 0;font-size:14px;"><a href="${escapeHtml(href)}" style="color:#04427d;font-weight:bold;text-decoration:underline;">View this home</a></p></td></tr></table></td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ec;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f1ec;">${escapeHtml(tone.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ec;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td height="4" bgcolor="#04427d" style="font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:22px 28px 18px;background:#ffffff;"><img src="${escapeHtml(logo)}" alt="${escapeHtml(SITE.company)}" width="210" style="display:block;width:210px;max-width:70%;height:auto;border:0;" /></td></tr>
<tr><td height="3" bgcolor="#e11b22" style="font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:32px 28px 8px;font-family:Georgia,'Times New Roman',serif;color:#1c1c1c;">
<h1 style="margin:0;font-size:30px;line-height:1.25;font-weight:normal;">Hi ${escapeHtml(first)},</h1>
</td></tr>
<tr><td style="padding:8px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;font-size:16px;line-height:1.55;">
<p style="margin:0;">Thank you for connecting with ${escapeHtml(SITE.company)}.</p>
<p style="margin:12px 0 0;">${escapeHtml(tone.line)}</p>
<p style="margin:12px 0 0;">Casey Archibald’s team will reach out personally. You’ll also get new listings that match your search.</p>
</td></tr>
<tr><td style="padding:24px 28px 8px;">
${button(search, "Browse homes")}
<p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.4;"><a href="${escapeHtml(saved)}" style="color:#04427d;text-decoration:underline;">Saved searches</a></p>
</td></tr>
<tr><td style="padding:20px 28px 0;font-family:Arial,Helvetica,sans-serif;">
<h2 style="margin:0 0 14px;font-size:18px;line-height:1.3;font-weight:bold;color:#1c1c1c;">Homes to start with</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardHtml || `<tr><td style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#1c1c1c;">Browse Greater Vancouver homes whenever you are ready.</td></tr>`}</table>
</td></tr>
<tr><td style="padding:8px 28px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5f2;">
<tr>
<td width="96" valign="top" style="padding:18px 0 18px 18px;"><img src="${escapeHtml(photo)}" alt="${escapeHtml(SITE.agent)}" width="72" height="72" style="display:block;width:72px;height:72px;border:0;border-radius:36px;" /></td>
<td valign="middle" style="padding:18px 18px 18px 8px;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;">
<p style="margin:0;font-size:16px;line-height:1.3;font-weight:bold;">${escapeHtml(SITE.agent)}</p>
<p style="margin:4px 0 0;font-size:14px;line-height:1.4;">${escapeHtml(SITE.company)}</p>
<p style="margin:2px 0 0;font-size:14px;line-height:1.4;">RE/MAX Crest Realty</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.4;">${escapeHtml(SITE.addressLine)}<br />${escapeHtml(SITE.cityLine)}</p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.4;"><a href="tel:${escapeHtml(SITE.phoneTel)}" style="color:#04427d;text-decoration:none;">${escapeHtml(SITE.phoneDisplay)}</a></p>
<p style="margin:8px 0 0;font-size:14px;line-height:1.4;"><a href="${escapeHtml(contact)}" style="color:#04427d;font-weight:bold;text-decoration:underline;">Contact Casey</a></p>
</td>
</tr>
</table>
</td></tr>
<tr><td style="padding:4px 28px 24px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#6b7280;">
<p style="margin:0;">${escapeHtml(SITE.company)}, RE/MAX Crest Realty, Vancouver.</p>
<p style="margin:8px 0 0;">You received this email because you signed up at vancouverpropertysearch.ca.</p>
<p style="margin:8px 0 0;"><a href="${escapeHtml(unsubscribe)}" style="color:#6b7280;text-decoration:underline;">Unsubscribe or manage alerts</a></p>
<p style="margin:8px 0 0;">Sent from ${escapeHtml(SENDER)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html, preheader: tone.preheader };
}
