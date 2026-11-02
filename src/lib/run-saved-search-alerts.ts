import { ddfConfigured } from "@/lib/ddf/credentials";
import { ddfListingsForAlert } from "@/lib/ddf/db";
import { alertHits, listAlertSearches, markAlertChecked } from "@/lib/lead-searches-db";
import { leadsDatabaseConfigured } from "@/lib/leads-db";
import { propertyHref } from "@/lib/listing-url";
import { sendLeadEmail, type AlertChannel } from "@/lib/notify-lead";
import { properties } from "@/lib/properties";
import { alertIsDue, newListingWindowDays, newMatchesForSearch } from "@/lib/saved-search-alerts";
import { formatPrice } from "@/lib/search";
import { SITE } from "@/lib/site";
import { isTestLeadEmail } from "@/lib/test-lead";

export type AlertRunReport = {
  ok: true;
  database: boolean;
  due: number;
  sent: number;
  empty: number;
  skipped: number;
  failed: number;
  ignored: number;
  email: AlertChannel | "idle";
};

function origin() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  return "https://vancouverpropertysearch.ca";
}

function message(
  leadName: string,
  searchName: string,
  email: string,
  listings: { address: string; city: string; price: number; beds: number; baths: number; href: string }[]
) {
  const first = leadName.split(" ")[0] || "there";
  const count = listings.length;
  const lines = listings.map(
    (home) =>
      `${home.address}, ${home.city} — ${formatPrice(home.price)} — ${home.beds} bd / ${home.baths} ba\n${origin()}${home.href}`
  );
  return [
    `Hi ${first},`,
    "",
    `${count} new ${count === 1 ? "home matches" : "homes match"} "${searchName}".`,
    "",
    lines.join("\n\n"),
    "",
    `Unsubscribe: ${origin()}/unsubscribe?email=${encodeURIComponent(email)}`,
    "",
    SITE.agent,
    SITE.phoneDisplay,
  ].join("\n");
}

export async function runSavedSearchAlerts(now = new Date()): Promise<AlertRunReport> {
  const report: AlertRunReport = {
    ok: true,
    database: leadsDatabaseConfigured(),
    due: 0,
    sent: 0,
    empty: 0,
    skipped: 0,
    failed: 0,
    ignored: 0,
    email: "idle",
  };
  if (!report.database) return report;

  const searches = await listAlertSearches();
  for (const search of searches) {
    if (isTestLeadEmail(search.contactEmail) || !search.contactEmail || search.unsubscribed || search.frequency === "Never") {
      report.ignored += 1;
      continue;
    }
    if (!alertIsDue(search.frequency, search.lastAlertAt, now)) continue;
    report.due += 1;
    const already = await alertHits(search.id);
    const matches = ddfConfigured()
      ? await ddfListingsForAlert({
          city: search.city,
          minPrice: search.minPrice,
          maxPrice: search.maxPrice,
          beds: search.beds,
          baths: search.baths,
          propertyType: search.propertyType,
          windowDays: newListingWindowDays(search.frequency, search.lastAlertAt, now),
          exclude: [...already],
        })
      : newMatchesForSearch(search, properties, already, now, search.lastAlertAt);
    if (!matches.length) {
      report.empty += 1;
      await markAlertChecked(search.id, [], now);
      continue;
    }
    const email = await sendLeadEmail(
      search.contactEmail,
      `${matches.length} new ${matches.length === 1 ? "home" : "homes"} for ${search.name}`,
      message(
        search.leadName,
        search.name,
        search.contactEmail,
        matches.map((property) => ({
          address: property.address,
          city: property.city,
          price: property.price,
          beds: property.beds,
          baths: property.baths,
          href: propertyHref(property),
        }))
      )
    );
    report.email = email;
    if (email === "skipped") {
      report.skipped += 1;
      break;
    }
    if (email === "failed") {
      report.failed += 1;
      continue;
    }
    await markAlertChecked(search.id, matches.map((property) => property.id), now);
    report.sent += 1;
  }
  return report;
}
