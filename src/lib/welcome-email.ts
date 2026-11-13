import { formatPrice } from "./search";
import { SITE } from "./site";

export type WelcomeListing = {
  address: string;
  city: string;
  price: number;
  href: string;
  image?: string;
};

function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://vancouverpropertysearch.ca";
}

export function registrationWelcome(
  lead: { name: string; email: string },
  listings: WelcomeListing[] = []
): { subject: string; text: string; html: string } {
  const first = lead.name.split(" ")[0] || "there";
  const origin = siteOrigin();
  const search = `${origin}/search`;
  const saved = `${origin}/account/settings`;
  const contact = `${origin}/contact#inquiry`;
  const unsubscribe = `${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const logo = `${origin}/brand/archibald-logo.png`;
  const photo = `${origin}/brand/casey.jpg`;
  const subject = `Welcome to ${SITE.name}`;
  const listingText = listings.length
    ? listings.map((home) => `${home.address}, ${home.city} — ${formatPrice(home.price)}\n${origin}${home.href}`).join("\n\n")
    : "Search Greater Vancouver homes and save the ones you want to revisit.";
  const text = [
    `Hi ${first},`,
    "",
    `Welcome to ${SITE.company}. Your home search is ready.`,
    "",
    listingText,
    "",
    `Search homes: ${search}`,
    `Saved searches: ${saved}`,
    `Book a call: ${contact}`,
    "",
    SITE.agent,
    SITE.company,
    SITE.phoneDisplay,
    SITE.addressLine,
    SITE.cityLine,
    "",
    `Unsubscribe: ${unsubscribe}`,
  ].join("\n");
  const cards = listings
    .slice(0, 3)
    .map((home) => {
      const image = home.image ? (home.image.startsWith("http") ? home.image : `${origin}${home.image}`) : "";
      const photoCell = image
        ? `<img src="${image}" alt="" width="180" height="120" style="display:block;width:180px;height:120px;border:0;" />`
        : "";
      return [
        `<tr><td style="padding:0 0 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e5e5;"><tr>`,
        `<td width="180">${photoCell}</td>`,
        `<td style="padding:12px 14px;font-family:Arial,sans-serif;">`,
        `<p style="margin:0;font-size:16px;font-weight:700;color:#04427d;">${formatPrice(home.price)}</p>`,
        `<p style="margin:4px 0 0;font-size:14px;color:#1f2930;">${home.address}</p>`,
        `<p style="margin:2px 0 8px;font-size:13px;color:#555;">${home.city}</p>`,
        `<a href="${origin}${home.href}" style="color:#1976d2;font-size:14px;">View this home</a>`,
        `</td></tr></table></td></tr>`,
      ].join("");
    })
    .join("");
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f4f7fb;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;"><tr><td align="center" style="padding:24px 12px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
    <tr><td style="background:#04427d;padding:20px 24px;"><img src="${logo}" alt="${SITE.company}" width="210" height="49" style="display:block;width:210px;height:auto;border:0;" /></td></tr>
    <tr><td style="padding:28px 24px 8px;font-family:Arial,sans-serif;color:#1f2930;">
      <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#1976d2;">${SITE.company}</p>
      <h1 style="margin:8px 0 0;font-size:32px;line-height:1.2;font-weight:500;">Hi ${first}, your search is ready.</h1>
      <p style="margin:12px 0 0;font-size:16px;line-height:1.5;">Welcome. The consent you gave at registration covers follow-up about homes. You do not need to opt in again.</p>
    </td></tr>
    <tr><td style="padding:16px 24px;font-family:Arial,sans-serif;">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:8px;"><a href="${search}" style="display:inline-block;background:#1976d2;color:#ffffff;text-decoration:none;padding:12px 16px;font-weight:700;">Search homes</a></td>
        <td style="padding-right:8px;"><a href="${saved}" style="display:inline-block;border:1px solid #04427d;color:#04427d;text-decoration:none;padding:11px 16px;">View saved searches</a></td>
        <td><a href="${contact}" style="display:inline-block;border:1px solid #04427d;color:#04427d;text-decoration:none;padding:11px 16px;">Book a call</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:8px 24px 0;font-family:Arial,sans-serif;">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;">Homes to start with</h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards || `<tr><td style="padding-bottom:16px;font-size:15px;">Search Greater Vancouver homes and save a search when you want alerts.</td></tr>`}</table>
    </td></tr>
    <tr><td style="padding:8px 24px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7fafc;border:1px solid #e5e5e5;"><tr>
        <td width="88" style="padding:16px;"><img src="${photo}" alt="${SITE.agent}" width="72" height="72" style="display:block;width:72px;height:72px;object-fit:cover;border:0;" /></td>
        <td style="padding:16px 16px 16px 0;font-family:Arial,sans-serif;color:#1f2930;">
          <p style="margin:0;font-size:16px;font-weight:700;">${SITE.agent}</p>
          <p style="margin:4px 0;font-size:14px;">${SITE.company}</p>
          <p style="margin:0;font-size:14px;"><a href="tel:${SITE.phoneTel}" style="color:#04427d;">${SITE.phoneDisplay}</a></p>
          <p style="margin:8px 0 0;font-size:14px;"><a href="${contact}" style="color:#1976d2;">Contact Casey</a></p>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:0 24px 24px;font-family:Arial,sans-serif;font-size:12px;color:#667;">
      <a href="${unsubscribe}" style="color:#667;">Unsubscribe</a>
    </td></tr>
  </table>
  </td></tr></table></body></html>`;
  return { subject, text, html };
}
