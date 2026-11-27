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

function realListingPhoto(url: string | undefined): string {
  if (!url || !url.startsWith("http") || /unsplash\.com/i.test(url)) return "";
  return url;
}

const FEATURES: { icon: string; color: string; label: string; rest: string; path: string }[] = [
  { icon: "&#8981;", color: "#04427d", label: "Create a Custom Search", rest: " for the neighbourhoods, price range, and features that matter to you.", path: "/search" },
  { icon: "&#10084;", color: "#e11b22", label: "Save your favourites", rest: " by clicking the heart on any listing you want to come back to.", path: "/saved" },
  { icon: "&#8644;", color: "#04427d", label: "Compare Properties", rest: " to see your top picks side by side.", path: "/compare" },
  { icon: "&#9998;", color: "#04427d", label: "Add Notes", rest: " to any property and revisit them in the Notes section. It's a handy way to remember which home had the great layout or the extra storage you wanted.", path: "/notebook" },
  { icon: "&#128197;", color: "#04427d", label: "Request a Showing", rest: " when you find a home you'd like to see in person.", path: "/contact" },
];

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
  const contact = `${origin}/contact#inquiry`;
  const unsubscribe = `${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const logo = `${origin}/brand/archibald-logo.png`;
  const photo = `${origin}/brand/casey.jpg`;
  const subject = `Welcome, ${first}, your Vancouver home search is ready`;
  const preheader = "Your home search portal is ready to explore.";
  const cards = listings
    .map((home) => ({ ...home, image: realListingPhoto(home.image) }))
    .filter((home) => home.image)
    .slice(0, 3);
  const featureText = FEATURES.map((item) => `${item.label}${item.rest}\n${origin}${item.path}`).join("\n\n");
  const listingText = cards.length
    ? cards.map((home) => `${home.address}, ${home.city} — ${formatPrice(home.price)}\n${home.href.startsWith("http") ? home.href : origin + home.href}`).join("\n\n")
    : "";
  const text = [
    `Hi ${first},`,
    "",
    "Thanks for connecting with us! Your home search portal is ready to explore. Here are some key features to help you with your search:",
    "",
    featureText,
    "",
    "We'll send you new listings as they come up that match your search, and someone from our team will reach out soon to learn more about what you're looking for.",
    "",
    "Happy house hunting!",
    "",
    "Talk soon",
    "Casey Archibald & the Archibald Real Estate Group team",
    "",
    `Browse homes: ${search}`,
    listingText,
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
  ].filter((line) => line !== undefined).join("\n");

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
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f4f1ec;">${escapeHtml(preheader)}</div>
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
<p style="margin:0;">Thanks for connecting with us! Your home search portal is ready to explore. Here are some key features to help you with your search:</p>
</td></tr>
<tr><td style="padding:16px 28px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${FEATURES.map((item) => `<tr>
<td width="44" valign="top" style="padding:0 12px 16px 0;">
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="32" height="32" align="center" valign="middle" bgcolor="#e7f2f8" style="width:32px;height:32px;border-radius:16px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:32px;color:${item.color};">${item.icon}</td></tr></table>
</td>
<td valign="top" style="padding:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#1c1c1c;">
<a href="${escapeHtml(origin + item.path)}" style="color:#04427d;font-weight:bold;text-decoration:underline;">${escapeHtml(item.label)}</a>${escapeHtml(item.rest)}
</td>
</tr>`).join("")}</table>
</td></tr>
<tr><td style="padding:4px 28px 0;font-family:Arial,Helvetica,sans-serif;color:#1c1c1c;font-size:16px;line-height:1.55;">
<p style="margin:0;">We'll send you new listings as they come up that match your search, and someone from our team will reach out soon to learn more about what you're looking for.</p>
<p style="margin:16px 0 0;">Happy house hunting!</p>
<p style="margin:16px 0 0;">Talk soon</p>
<p style="margin:4px 0 0;font-weight:bold;">Casey Archibald &amp; the Archibald Real Estate Group team</p>
</td></tr>
<tr><td style="padding:24px 28px 8px;">
${button(search, "Browse homes")}
</td></tr>
${cards.length ? `<tr><td style="padding:20px 28px 0;font-family:Arial,Helvetica,sans-serif;">
<h2 style="margin:0 0 14px;font-size:18px;line-height:1.3;font-weight:bold;color:#1c1c1c;">Homes to start with</h2>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardHtml}</table>
</td></tr>` : ""}
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

  return { subject, text, html, preheader };
}
