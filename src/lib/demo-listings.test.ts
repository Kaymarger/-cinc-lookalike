import assert from "node:assert/strict";
import test from "node:test";
import { DEMO_LISTINGS, filterDemoListings } from "./demo-listings.ts";

test("demo listings cover the marketing areas and filter", () => {
  assert.ok(DEMO_LISTINGS.length >= 32);
  const kits = filterDemoListings({ places: ["Neighbourhood: Kitsilano"] });
  assert.ok(kits.length > 0);
  assert.ok(kits.every((row) => row.area === "Kitsilano"));
  const priced = filterDemoListings({ city: "Vancouver", minPrice: 1, maxPrice: 700000 });
  assert.ok(priced.every((row) => row.price >= 1 && row.price <= 700000));
  assert.ok(filterDemoListings({}).length === DEMO_LISTINGS.length);
});
