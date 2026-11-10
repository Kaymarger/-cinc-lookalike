import assert from "node:assert/strict";
import test from "node:test";
import { nextCompare, type ComparedHome } from "./compare-state";

function home(id: string): ComparedHome {
  return {
    id,
    mlsNumber: id,
    price: 1000000,
    address: `${id} Test Street`,
    city: "Vancouver",
    province: "BC",
    postalCode: "V6H 3X5",
    beds: 3,
    baths: 2,
    sqft: 1500,
    propertyType: "House",
    yearBuilt: 0,
    listedDaysAgo: 4,
    brokerage: "RE/MAX Crest Realty",
  };
}

test("compare keeps three homes, blocks a fourth, and replaces after a removal", () => {
  let homes: ComparedHome[] = [];
  homes = nextCompare(homes, home("a")).homes;
  homes = nextCompare(homes, home("b")).homes;
  homes = nextCompare(homes, home("c")).homes;
  assert.deepEqual(homes.map((item) => item.id), ["a", "b", "c"]);
  const blocked = nextCompare(homes, home("d"));
  assert.equal(blocked.ok, false);
  assert.deepEqual(blocked.homes.map((item) => item.id), ["a", "b", "c"]);
  homes = nextCompare(blocked.homes, home("a")).homes;
  homes = nextCompare(homes, home("d")).homes;
  assert.deepEqual(homes.map((item) => item.id), ["b", "c", "d"]);
});
