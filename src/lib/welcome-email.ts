import type { LeadIntent } from "./lead-intake";
import { formatPrice } from "./search";
import { SITE } from "./site";

export type WelcomeListing = {
  address: string;
  city: string;
  price: number;
  beds?: number;
  baths?: number;
  sqft?: number;
  href: string;
  image?: string;
};

export type WelcomeHomesBlock = {
  heading: string;
  summary: string;
  editHref: string;
  ctaLabel: string;
  ctaHref: string;
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

const FONT = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const NAVY = "#1b3040";

const FEATURES: { label: string; rest: string; path: string; link: string }[] = [
  { label: "Create a Custom Search", rest: "for the neighbourhoods, price range, and features that matter to you.", path: "/search", link: "Search" },
  { label: "Save your favourites", rest: "by clicking the heart on any listing you want to come back to.", path: "/saved", link: "Saved homes" },
  { label: "Compare Properties", rest: "to see your top picks side by side.", path: "/compare", link: "Compare" },
  { label: "Add Notes", rest: "to any property and revisit them in the Notes section. It's a handy way to remember which home had the great layout or the extra storage you wanted.", path: "/notebook", link: "Notes" },
  { label: "Request a Showing", rest: "when you find a home you'd like to see in person.", path: "/contact", link: "Contact" },
];

function button(href: string, label: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="btn"><tr><td align="center" bgcolor="${NAVY}" height="48" style="height:48px;border-radius:8px;"><a href="${safeHref}" style="display:block;padding:14px 16px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;-webkit-text-size-adjust:100%;">${safeLabel}</a></td></tr></table>`;
}

function para(text: string, extra = ""): string {
  return `<p class="copy" style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:400;color:#1a1a1a;-webkit-text-size-adjust:100%;${extra}">${text}</p>`;
}

export function registrationWelcome(
  lead: { name: string; email: string; intent?: LeadIntent },
  listings: WelcomeListing[] = [],
  homes?: WelcomeHomesBlock,
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
    .slice(0, 4);
  const block: WelcomeHomesBlock = homes ?? {
    heading: "Homes to start with",
    summary: "",
    editHref: search,
    ctaLabel: "Browse homes",
    ctaHref: search,
  };
  const featureText = FEATURES.map((item) => `${item.label} ${item.rest}\n${origin}${item.path}`).join("\n\n");
  const listingText = cards.length
    ? [block.heading, block.summary, ...cards.map((home) => {
        const facts = [home.beds ? `${home.beds} bd` : "", home.baths ? `${home.baths} ba` : "", home.sqft ? `${home.sqft.toLocaleString("en-CA")} sqft` : ""].filter(Boolean).join(" · ");
        return `${formatPrice(home.price)}\n${home.address}, ${home.city}${facts ? `\n${facts}` : ""}\n${home.href.startsWith("http") ? home.href : origin + home.href}`;
      })].filter(Boolean).join("\n")
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
    `${block.ctaLabel}: ${block.ctaHref.startsWith("http") ? block.ctaHref : origin + block.ctaHref}`,
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
        ? `<tr><td style="padding:0;"><a href="${escapeHtml(href)}"><img src="${escapeHtml(image)}" alt="" width="552" style="display:block;width:100%;max-width:100%;height:auto;border:0;" /></a></td></tr>`
        : "";
      const facts = [home.beds ? `${home.beds} bd` : "", home.baths ? `${home.baths} ba` : "", home.sqft ? `${home.sqft.toLocaleString("en-CA")} sqft` : ""].filter(Boolean).join(" · ");
      return `<tr><td style="padding:0 0 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ececec;border-radius:8px;">${photoRow}<tr><td style="padding:16px;font-family:${FONT};"><p style="margin:0;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(formatPrice(home.price))}</p><p style="margin:8px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:400;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(home.address)}</p><p style="margin:4px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:#4a4a4a;-webkit-text-size-adjust:100%;">${escapeHtml(home.city)}</p>${facts ? `<p style="margin:4px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;color:#6b6b6b;-webkit-text-size-adjust:100%;">${escapeHtml(facts)}</p>` : ""}<p style="margin:16px 0 0;">${button(href, "View home")}</p></td></tr></table></td></tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
<style>
  html, body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  @media only screen and (max-width: 600px) {
    .frame, .outer { background: #ffffff !important; padding: 0 !important; }
    .container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
    h1 { font-size: 26px !important; }
    .copy, p.copy { font-size: 17px !important; line-height: 1.65 !important; }
    .btn a { display: block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${escapeHtml(preheader)}</div>
<table role="presentation" class="frame" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f6f6;">
<tr><td align="center" class="outer" style="padding:40px 16px;background:#f6f6f6;">
<table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#ffffff;">
<tr><td style="padding:36px 24px 0;background:#ffffff;"><img src="${escapeHtml(logo)}" alt="${escapeHtml(SITE.company)}" width="168" height="39" style="display:block;width:168px;max-width:60%;height:auto;border:0;" /></td></tr>
<tr><td style="padding:32px 24px 0;background:#ffffff;">
<h1 style="margin:0 0 20px;font-family:${FONT};font-size:28px;line-height:1.3;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">Hi ${escapeHtml(first)},</h1>
${para("Thanks for connecting with us!")}
${para("Your home search portal is ready to explore.")}
${para("Here are some key features to help you with your search:", "margin-bottom:0;")}
</td></tr>
<tr><td style="padding:28px 24px 0;background:#ffffff;">
${button(block.ctaHref.startsWith("http") ? block.ctaHref : origin + block.ctaHref, block.ctaLabel)}
</td></tr>
<tr><td style="padding:36px 24px 0;"><div style="border-top:1px solid #ececec;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
<tr><td style="padding:32px 24px 12px;background:#ffffff;">
${FEATURES.map((item) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:0 0 20px;font-family:${FONT};">
<p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(item.label)}</p>
<p class="copy" style="margin:6px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:400;color:#4a4a4a;-webkit-text-size-adjust:100%;">${escapeHtml(item.rest)}</p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(origin + item.path)}" style="font-family:${FONT};font-size:14px;line-height:1.65;color:${NAVY};text-decoration:underline;-webkit-text-size-adjust:100%;">${escapeHtml(item.link)}</a></p>
</td></tr></table>`).join("")}
</td></tr>
<tr><td style="padding:16px 24px 0;"><div style="border-top:1px solid #ececec;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
<tr><td style="padding:32px 24px 36px;background:#ffffff;">
${para("We'll send you new listings as they come up that match your search, and someone from our team will reach out soon to learn more about what you're looking for.")}
${para("Happy house hunting!")}
${para("Talk soon")}
<p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">Casey Archibald &amp; the Archibald Real Estate Group team</p>
</td></tr>
${cards.length ? `<tr><td style="padding:0 24px;"><div style="border-top:1px solid #ececec;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
<tr><td style="padding:32px 24px 12px;background:#ffffff;">
<h2 style="margin:0 0 12px;font-family:${FONT};font-size:20px;line-height:1.35;font-weight:600;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(block.heading)}</h2>
${block.summary ? `<p class="copy" style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:1.65;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(block.summary)}</p><p style="margin:0 0 24px;font-family:${FONT};font-size:14px;line-height:1.65;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(block.editHref.startsWith("http") ? block.editHref : origin + block.editHref)}" style="font-family:${FONT};font-size:14px;line-height:1.65;color:${NAVY};text-decoration:underline;">Edit search</a></p>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cardHtml}</table>
</td></tr>` : ""}
<tr><td style="padding:8px 24px 0;"><div style="border-top:1px solid #ececec;font-size:1px;line-height:1px;">&nbsp;</div></td></tr>
<tr><td style="padding:32px 24px 8px;background:#ffffff;">
<img src="${escapeHtml(photo)}" alt="${escapeHtml(SITE.agent)}" width="64" height="64" style="display:block;width:64px;height:64px;border:0;border-radius:32px;" />
<p style="margin:16px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(SITE.agent)}</p>
<p class="copy" style="margin:4px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:#4a4a4a;-webkit-text-size-adjust:100%;">${escapeHtml(SITE.company)}</p>
<p class="copy" style="margin:0;font-family:${FONT};font-size:16px;line-height:1.65;color:#4a4a4a;-webkit-text-size-adjust:100%;">RE/MAX Crest Realty</p>
<p class="copy" style="margin:12px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(SITE.addressLine)}<br />${escapeHtml(SITE.cityLine)}</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:16px;line-height:1.65;-webkit-text-size-adjust:100%;"><a href="tel:${escapeHtml(SITE.phoneTel)}" style="font-family:${FONT};font-size:16px;line-height:1.65;color:${NAVY};text-decoration:none;">${escapeHtml(SITE.phoneDisplay)}</a></p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:14px;line-height:1.65;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(contact)}" style="font-family:${FONT};font-size:14px;color:${NAVY};text-decoration:underline;">Contact Casey</a></p>
</td></tr>
<tr><td style="padding:32px 24px 40px;background:#ffffff;">
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.65;color:#6b6b6b;-webkit-text-size-adjust:100%;">${escapeHtml(SITE.company)}, RE/MAX Crest Realty, Vancouver.</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:1.65;color:#6b6b6b;-webkit-text-size-adjust:100%;">You received this email because you signed up at vancouverpropertysearch.ca.</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:1.65;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(unsubscribe)}" style="font-family:${FONT};font-size:13px;line-height:1.65;color:#6b6b6b;text-decoration:underline;">Unsubscribe or manage alerts</a></p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:13px;line-height:1.65;color:#6b6b6b;-webkit-text-size-adjust:100%;">Sent from ${escapeHtml(SENDER)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html, preheader };
}
