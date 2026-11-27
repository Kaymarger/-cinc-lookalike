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

function titleCaseAddress(address: string): string {
  return address.split(/\s+/).map((word) => {
    if (/^\d/.test(word) || (word.length <= 2 && word === word.toUpperCase())) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(" ");
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

function button(href: string, label: string, outline = false): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  const fill = outline ? "#ffffff" : NAVY;
  const ink = outline ? NAVY : "#ffffff";
  const border = outline ? `border:1px solid ${NAVY};` : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="btn"><tr><td align="center" bgcolor="${fill}" height="48" style="height:48px;border-radius:8px;${border}box-shadow:0 1px 2px rgba(27,48,64,0.12);"><a href="${safeHref}" style="display:block;padding:14px 16px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:600;color:${ink};text-decoration:none;border-radius:8px;-webkit-text-size-adjust:100%;">${safeLabel}</a></td></tr></table>`;
}

function eyebrow(label: string): string {
  return `<p style="margin:0 0 12px;font-family:${FONT};font-size:11px;line-height:16px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#8a909a;-webkit-text-size-adjust:100%;">${escapeHtml(label)}</p>`;
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
  const unsubscribe = `${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const logo = `${origin}/brand/archibald-logo.png`;
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
        return `${formatPrice(home.price)}\n${titleCaseAddress(home.address)}, ${home.city}${facts ? `\n${facts}` : ""}\n${home.href.startsWith("http") ? home.href : origin + home.href}`;
      })].filter(Boolean).join("\n")
    : "";
  const text = [
    `Hi ${first},`,
    "",
    "Thanks for connecting with us!",
    "",
    "Your home search portal is ready to explore.",
    "",
    `${block.ctaLabel}: ${block.ctaHref.startsWith("http") ? block.ctaHref : origin + block.ctaHref}`,
    "",
    "Here are some key features to help you with your search:",
    "",
    featureText,
    "",
    "We'll send you new listings as they come up that match your search, and someone from our team will reach out soon to learn more about what you're looking for.",
    "",
    "Happy house hunting!",
    "",
    listingText,
    "",
    "Talk soon",
    "",
    "Casey Archibald | Vancouver Real Estate",
    "",
    "REMAX Crest Realty Westside",
    "#300 - 1195 W Broadway",
    "Vancouver, BC, V6H 3X5",
    "",
    "604-363-7858 | https://www.caseyarchibald.com",
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
        ? `<a href="${escapeHtml(href)}"><img src="${escapeHtml(image)}" alt="" width="520" height="346" style="display:block;width:100%;height:180px;object-fit:cover;border:0;border-radius:12px 12px 0 0;" /></a>`
        : "";
      const facts = [home.beds ? `${home.beds} bd` : "", home.baths ? `${home.baths} ba` : "", home.sqft ? `${home.sqft.toLocaleString("en-CA")} sqft` : ""].filter(Boolean).join(" · ");
      const address = titleCaseAddress(home.address);
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8eaee;border-radius:12px;background:#ffffff;"><tr><td style="padding:0;border-radius:12px 12px 0 0;">${photoRow}</td></tr><tr><td style="padding:16px;font-family:${FONT};background:#ffffff;"><p style="margin:0;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(formatPrice(home.price))}</p><p style="margin:8px 0 0;font-family:${FONT};font-size:16px;line-height:1.5;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(address)}</p><p style="margin:2px 0 0;font-family:${FONT};font-size:15px;line-height:1.5;color:#5b6370;-webkit-text-size-adjust:100%;">${escapeHtml(home.city)}</p>${facts ? `<p style="margin:6px 0 0;font-family:${FONT};font-size:13px;line-height:1.5;color:#8a909a;-webkit-text-size-adjust:100%;">${escapeHtml(facts)}</p>` : ""}<p style="margin:16px 0 0;">${button(href, "View home", true)}</p></td></tr></table>`;
    })
    .join("|||");
  const cardList = cardHtml ? cardHtml.split("|||") : [];
  const homeRows: string[] = [];
  for (let i = 0; i < cardList.length; i += 2) {
    const right = cardList[i + 1]
      ? `<td class="home-col" width="50%" valign="top" style="width:50%;padding:0 0 24px 12px;">${cardList[i + 1]}</td>`
      : `<td class="home-gap" width="50%" style="width:50%;"></td>`;
    homeRows.push(`<tr><td class="home-col" width="50%" valign="top" style="width:50%;padding:0 12px 24px 0;">${cardList[i]}</td>${right}</tr>`);
  }
  const featureRows: string[] = [];
  for (let i = 0; i < FEATURES.length; i += 2) {
    const cell = (item: (typeof FEATURES)[number] | undefined, index: number) => item
      ? `<td class="feature-col" width="50%" valign="top" style="width:50%;padding:0 16px 24px 0;font-family:${FONT};"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="24" height="24" align="center" valign="middle" bgcolor="${NAVY}" style="width:24px;height:24px;border-radius:12px;font-family:${FONT};font-size:12px;line-height:24px;font-weight:700;color:#ffffff;">${index}</td></tr></table><p style="margin:12px 0 0;font-family:${FONT};font-size:16px;line-height:1.4;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(item.label)}</p><p class="copy" style="margin:6px 0 0;font-family:${FONT};font-size:15px;line-height:1.55;color:#5b6370;-webkit-text-size-adjust:100%;">${escapeHtml(item.rest)}</p><p style="margin:8px 0 0;font-family:${FONT};font-size:13px;line-height:1.4;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(origin + item.path)}" style="font-family:${FONT};font-size:13px;color:${NAVY};text-decoration:none;">Open →</a></p></td>`
      : `<td class="feature-gap" width="50%"></td>`;
    featureRows.push(`<tr>${cell(FEATURES[i], i + 1)}${cell(FEATURES[i + 1], i + 2)}</tr>`);
  }
  const chips = block.summary
    .split(" · ")
    .filter(Boolean)
    .map((part) => `<span style="display:inline-block;margin:0 8px 8px 0;padding:6px 12px;background:#eef1f4;border-radius:999px;font-family:${FONT};font-size:13px;line-height:18px;color:#1a1a1a;-webkit-text-size-adjust:100%;">${escapeHtml(part)}</span>`)
    .join("");
  const headshot = `${origin}/brand/casey.jpg`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
<style>
  :root { color-scheme: light only; }
  html, body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; max-width: 100% !important; }
    h1 { font-size: 28px !important; }
    .lead, p.lead { font-size: 18px !important; }
    .feature-col, .home-col { display: block !important; width: 100% !important; max-width: 100% !important; padding-right: 0 !important; padding-left: 0 !important; }
    .feature-gap, .home-gap { display: none !important; }
    .btn a { display: block !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#ffffff;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#ffffff;">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background:#ffffff;">
<tr><td align="center" style="padding:0 16px;background:#ffffff;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
<tr><td style="padding:28px 8px 20px;border-bottom:1px solid #ececec;background:#ffffff;">
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:16px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#3a3f45;-webkit-text-size-adjust:100%;">Archibald Real Estate Group</p>
</td></tr>
<tr><td style="padding:32px 8px 8px;background:#ffffff;">
<h1 style="margin:0 0 16px;font-family:${FONT};font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-0.3px;color:#1a1a1a;-webkit-text-size-adjust:100%;">Hi ${escapeHtml(first)},</h1>
<p class="lead" style="margin:0 0 12px;font-family:${FONT};font-size:18px;line-height:1.55;color:#3d4451;-webkit-text-size-adjust:100%;">Thanks for connecting with us!</p>
<p class="lead" style="margin:0 0 28px;font-family:${FONT};font-size:18px;line-height:1.55;color:#3d4451;-webkit-text-size-adjust:100%;">Your home search portal is ready to explore.</p>
${button(block.ctaHref.startsWith("http") ? block.ctaHref : origin + block.ctaHref, block.ctaLabel)}
</td></tr>
<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="#f6f7f9" style="padding:32px 28px;background:#f6f7f9;border-radius:12px;">
<p class="lead" style="margin:0 0 24px;font-family:${FONT};font-size:18px;line-height:1.55;color:#3d4451;-webkit-text-size-adjust:100%;">Here are some key features to help you with your search:</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${featureRows.join("")}</table>
</td></tr>
<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td bgcolor="#f6f7f9" style="padding:32px 28px;background:#f6f7f9;border-radius:12px;">
${eyebrow("Your search")}
${para("We'll send you new listings as they come up that match your search, and someone from our team will reach out soon to learn more about what you're looking for.")}
${para("Happy house hunting!", "margin-bottom:0;")}
${cards.length ? `<div style="height:32px;font-size:0;line-height:0;">&nbsp;</div>${eyebrow("Homes for you")}${chips ? `<p style="margin:0 0 8px;">${chips}</p><p style="margin:0 0 24px;font-family:${FONT};font-size:13px;line-height:1.4;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(block.editHref.startsWith("http") ? block.editHref : origin + block.editHref)}" style="font-family:${FONT};font-size:13px;color:${NAVY};text-decoration:underline;">Edit search</a></p>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${homeRows.join("")}</table>` : ""}
</td></tr>
<tr><td style="height:24px;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:8px 8px 8px;background:#ffffff;">
<p class="copy" style="margin:0 0 20px;font-family:${FONT};font-size:17px;line-height:1.65;color:#1a1a1a;-webkit-text-size-adjust:100%;">Talk soon</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="padding:0 16px 0 0;"><img src="${escapeHtml(headshot)}" alt="${escapeHtml(SITE.agent)}" width="56" height="56" style="display:block;width:56px;height:56px;border:0;border-radius:28px;" /></td>
<td valign="top">
<div style="width:40px;height:2px;background:${NAVY};font-size:0;line-height:0;margin:0 0 12px;">&nbsp;</div>
<p style="margin:0;font-family:${FONT};font-size:16px;line-height:1.4;font-weight:700;color:#1a1a1a;-webkit-text-size-adjust:100%;">Casey Archibald</p>
<p style="margin:2px 0 0;font-family:${FONT};font-size:15px;line-height:1.4;color:#5b6370;-webkit-text-size-adjust:100%;">Vancouver Real Estate</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:1.55;color:#5b6370;-webkit-text-size-adjust:100%;">REMAX Crest Realty Westside<br />#300 - 1195 W Broadway<br />Vancouver, BC, V6H 3X5</p>
<p style="margin:12px 0 0;font-family:${FONT};font-size:14px;line-height:1.55;-webkit-text-size-adjust:100%;"><a href="tel:6043637858" style="font-family:${FONT};font-size:14px;color:${NAVY};text-decoration:none;">604-363-7858</a> <span style="color:#8a909a;">|</span> <a href="https://www.caseyarchibald.com" style="font-family:${FONT};font-size:14px;color:${NAVY};text-decoration:underline;">www.caseyarchibald.com</a></p>
</td></tr></table>
</td></tr>
<tr><td style="padding:40px 8px 32px;background:#ffffff;" align="center">
<p style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a909a;text-align:center;-webkit-text-size-adjust:100%;">${escapeHtml(SITE.company)}, RE/MAX Crest Realty, Vancouver.</p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a909a;text-align:center;-webkit-text-size-adjust:100%;">You received this email because you signed up at vancouverpropertysearch.ca.</p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;text-align:center;-webkit-text-size-adjust:100%;"><a href="${escapeHtml(unsubscribe)}" style="font-family:${FONT};font-size:12px;color:#8a909a;text-decoration:underline;">Unsubscribe or manage alerts</a></p>
<p style="margin:8px 0 0;font-family:${FONT};font-size:12px;line-height:1.6;color:#8a909a;text-align:center;-webkit-text-size-adjust:100%;">Sent from ${escapeHtml(SENDER)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html, preheader };
}
