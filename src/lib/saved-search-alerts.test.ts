import assert from "node:assert/strict";
import test from "node:test";
import { EMPTY_CRITERIA, type LeadSavedSearch } from "./office-access.ts";
import { alertIsDue, listingMatchesSearch, newMatchesForSearch, publicSavedSearch, zonedDay } from "./saved-search-alerts.ts";
import { isTestLeadEmail } from "./test-lead.ts";
import type { Property } from "./types.ts";

function at(iso: string) {
  return new Date(iso);
}

test("example.com addresses are test leads", () => {
  assert.equal(isTestLeadEmail("ads-check-827874@example.com"), true);
  assert.equal(isTestLeadEmail("Buyer@Example.COM"), true);
  assert.equal(isTestLeadEmail("a@mail.example.com"), true);
  assert.equal(isTestLeadEmail("buyer@greatervancouverhomesearch.com"), false);
  assert.equal(isTestLeadEmail("not-an-email"), false);
});

test("alert cadence uses Vancouver weekdays", () => {
  const tuesday = at("2026-11-03T16:00:00.000Z");
  assert.equal(zonedDay(tuesday).weekday, "Tue");
  assert.equal(alertIsDue("Daily (Best for default search)", null, tuesday), true);
  assert.equal(alertIsDue("T/Th (Best for personalized search)", null, tuesday), true);
  assert.equal(alertIsDue("M/W/F", null, tuesday), false);
  assert.equal(alertIsDue("Weekends", null, tuesday), false);
  assert.equal(alertIsDue("Tuesday", null, tuesday), true);
  assert.equal(alertIsDue("Never", null, tuesday), false);
  assert.equal(alertIsDue("Daily (Best for default search)", tuesday.toISOString(), tuesday), false);
  const twoWeeksLater = at("2026-11-17T16:00:00.000Z");
  assert.equal(alertIsDue("Bi-Weekly", tuesday.toISOString(), at("2026-11-10T16:00:00.000Z")), false);
  assert.equal(alertIsDue("Bi-Weekly", tuesday.toISOString(), twoWeeksLater), true);
  assert.equal(alertIsDue("Monthly", tuesday.toISOString(), at("2026-11-20T16:00:00.000Z")), false);
  assert.equal(alertIsDue("Monthly", tuesday.toISOString(), at("2026-12-03T16:00:00.000Z")), true);
});

function home(overrides: Partial<Property> = {}): Property {
  return {
    id: "p1",
    mlsNumber: "R1",
    price: 900_000,
    address: "10 Main St",
    city: "Vancouver",
    province: "BC",
    postalCode: "V6B 1A1",
    beds: 2,
    baths: 2,
    sqft: 900,
    propertyType: "Condo",
    yearBuilt: 2010,
    description: "",
    features: [],
    images: [],
    status: "Active",
    listedDaysAgo: 0,
    brokerage: "Office",
    lat: 0,
    lng: 0,
    neighborhood: "Yaletown",
    ...overrides,
  };
}

function search(overrides: Partial<LeadSavedSearch> = {}): LeadSavedSearch {
  return {
    id: "s1",
    leadId: "lead-1",
    leadEmail: "buyer@greatervancouverhomesearch.com",
    name: "Vancouver condos",
    city: "Vancouver",
    minPrice: null,
    maxPrice: 1_000_000,
    beds: 2,
    baths: null,
    propertyType: "Condominium",
    frequency: "Daily (Best for default search)",
    criteria: { ...EMPTY_CRITERIA },
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

test("new listings respect price, type, and already sent ids", () => {
  const now = at("2026-11-03T16:00:00.000Z");
  const listings = [
    home(),
    home({ id: "old", listedDaysAgo: 10 }),
    home({ id: "house", propertyType: "House" }),
    home({ id: "pricey", price: 2_000_000 }),
    home({ id: "sent", listedDaysAgo: 0 }),
  ];
  const matches = newMatchesForSearch(search(), listings, new Set(["sent"]), now, null);
  assert.deepEqual(matches.map((item) => item.id), ["p1"]);
  assert.equal(listingMatchesSearch(search({ propertyType: "Land/Lot" }), home()), false);
});

test("a public save becomes a daily search", () => {
  const saved = publicSavedSearch("Buyer@Site.ca", "Kitsilano", {
    city: "Vancouver",
    maxPrice: 1200000,
    beds: 2,
    propertyType: "Condo",
  });
  assert.ok(saved);
  assert.equal(saved?.propertyType, "Condominium");
  assert.equal(saved?.frequency, "Daily (Best for default search)");
  assert.equal(saved?.leadEmail, "buyer@site.ca");
});
