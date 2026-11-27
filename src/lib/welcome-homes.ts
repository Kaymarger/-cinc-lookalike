import { searchDdfListings } from "@/lib/ddf/db";
import { listSearchesForEmail } from "@/lib/lead-searches-db";
import { propertyHref } from "@/lib/listing-url";
import { filtersToQuery } from "@/lib/search";
import type { Property } from "@/lib/types";
import {
  criteriaFromSavedSearch,
  criteriaFromText,
  hasWelcomeCriteria,
  matchSteps,
  mergeCriteria,
  pickWelcomeHomes,
  type WelcomeCriteria,
  type WelcomeHome,
} from "@/lib/welcome-match";
import type { WelcomeHomesBlock, WelcomeListing } from "@/lib/welcome-email";

function photo(property: Property): string {
  return property.images.find((url) => url.startsWith("http") && !/unsplash\.com/i.test(url)) || "";
}

function asHome(property: Property): WelcomeHome | null {
  const image = photo(property);
  if (!image) return null;
  return {
    id: property.id,
    address: property.address,
    city: property.city,
    price: property.price,
    beds: property.beds || undefined,
    baths: property.baths || undefined,
    sqft: property.sqft || undefined,
    href: propertyHref(property),
    image,
  };
}

export async function welcomeHomesForLead(lead: {
  email: string;
  searchLabel?: string;
  notes?: string;
  attribution?: { landingPath?: string };
}): Promise<{ block: WelcomeHomesBlock; listings: WelcomeListing[] }> {
  const saved = await listSearchesForEmail(lead.email).catch(() => []);
  const fromSaved = saved[0] ? criteriaFromSavedSearch(saved[0]) : {};
  const fromText = criteriaFromText([lead.searchLabel, lead.notes, lead.attribution?.landingPath].filter(Boolean).join("\n"));
  const criteria: WelcomeCriteria = mergeCriteria(fromSaved, fromText);
  const picked = await pickWelcomeHomes(criteria, async (filters) => {
    const result = await searchDdfListings({ ...filters, sort: "newest" }, 4);
    return result.properties.flatMap((property) => {
      const home = asHome(property);
      return home ? [home] : [];
    });
  });
  const original = matchSteps(criteria)[0]?.queries[0] ?? { sort: "newest" as const };
  const editHref = `/search${filtersToQuery(original)}`;
  const matched = hasWelcomeCriteria(criteria) && picked.step.fit !== "newest";
  return {
    block: {
      heading: picked.homes.length ? picked.step.heading : "Homes to start with",
      summary: picked.homes.length ? picked.step.summary : "",
      editHref,
      ctaLabel: matched ? "View your matches" : "Browse homes",
      ctaHref: editHref,
    },
    listings: picked.homes.map(({ id: _id, ...home }) => home),
  };
}
