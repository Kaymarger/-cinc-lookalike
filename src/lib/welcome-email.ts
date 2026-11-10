import { SITE } from "./site";

function siteOrigin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://vancouverpropertysearch.ca";
}

export function registrationWelcome(lead: { name: string; email: string }): { subject: string; text: string; html: string } {
  const first = lead.name.split(" ")[0] || "there";
  const origin = siteOrigin();
  const search = `${origin}/search`;
  const unsubscribe = `${origin}/unsubscribe?email=${encodeURIComponent(lead.email)}`;
  const subject = `Welcome to ${SITE.name}`;
  const text = [
    `Hi ${first},`,
    "",
    `Welcome to ${SITE.company}. Your home search is ready.`,
    "",
    "Next steps:",
    `1. Search Greater Vancouver homes: ${search}`,
    "2. Save a search when you want email alerts for new matches.",
    "3. Open a listing and request a showing when you want to visit.",
    `4. Selling? Start a home estimate: ${origin}/seller/homeestimate/homevaluation`,
    "",
    SITE.agent,
    SITE.company,
    SITE.phoneDisplay,
    SITE.addressLine,
    SITE.cityLine,
    "",
    `Unsubscribe: ${unsubscribe}`,
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fb;font-family:Lato,Arial,sans-serif;color:#1f2930;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:24px 12px;"><tr><td align="center">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr><td style="background:#04427d;padding:28px 24px;color:#ffffff;">
  <p style="margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">${SITE.company}</p>
  <h1 style="margin:8px 0 0;font-size:28px;line-height:1.2;font-weight:500;">Welcome, ${first}.</h1>
  </td></tr>
  <tr><td style="padding:24px;">
  <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Your Greater Vancouver home search is ready. Here is a simple way to use it.</p>
  <p style="margin:0 0 8px;"><a href="${search}" style="display:inline-block;background:#1976d2;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-weight:700;">Search homes</a></p>
  <ol style="margin:16px 0;padding-left:18px;line-height:1.6;">
  <li>Filter by neighbourhood, price, beds, and the map.</li>
  <li>Save a search when you want alerts for new matches.</li>
  <li>Open a listing to request a showing.</li>
  <li>If you are selling, request a home estimate.</li>
  </ol>
  <p style="margin:0;font-size:15px;line-height:1.5;">${SITE.agent}<br>${SITE.company}<br>${SITE.phoneDisplay}<br>${SITE.addressLine}, ${SITE.cityLine}</p>
  </td></tr>
  <tr><td style="padding:0 24px 24px;font-size:12px;color:#667;"><a href="${unsubscribe}">Unsubscribe</a></td></tr>
  </table></td></tr></table></body></html>`;
  return { subject, text, html };
}
