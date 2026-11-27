import assert from "node:assert/strict";
import test from "node:test";
import { criteriaFromSavedSearch, criteriaFromText, hasWelcomeCriteria, matchSteps, mergeCriteria, pickWelcomeHomes, summarizeCriteria } from "./welcome-match.ts";

test("signup text becomes city, price, and bed criteria", () => {
  const criteria = criteriaFromText("North Vancouver, $800K–$1.3M, 2+ beds");
  assert.equal(criteria.area, "North Vancouver");
  assert.equal(criteria.minPrice, 800000);
  assert.equal(criteria.maxPrice, 1300000);
  assert.equal(criteria.beds, 2);
  assert.equal(summarizeCriteria(criteria), "North Vancouver · $800K–$1.3M · 2+ beds");
});

test("an exact miss widens price, then beds, then nearby cities", () => {
  const criteria = criteriaFromText("North Vancouver under $1.2M, 3 beds, 2 baths");
  const steps = matchSteps(criteria);
  assert.equal(steps[0].fit, "exact");
  assert.equal(steps[0].heading, "Homes matching your search");
  assert.equal(steps[0].queries[0].city, "North Vancouver");
  assert.equal(steps[0].queries[0].maxPrice, 1200000);
  assert.equal(steps[0].queries[0].beds, 3);
  assert.equal(steps[0].queries[0].sort, "newest");

  assert.equal(steps[1].fit, "similar");
  assert.equal(steps[1].heading, "Homes similar to your search");
  assert.equal(steps[1].queries[0].maxPrice, 1320000);
  assert.equal(steps[1].queries[0].beds, 3);

  assert.equal(steps[2].queries[0].beds, 2);
  assert.equal(steps[2].queries[0].city, "North Vancouver");

  const nearby = steps[3].queries.map((query) => query.city);
  assert.deepEqual(nearby, ["West Vancouver", "Vancouver"]);
  assert.equal(steps[3].queries[0].beds, 2);
  assert.equal(steps[3].queries[0].maxPrice, 1320000);
});

test("a saved search fills gaps left by the signup note", () => {
  const saved = criteriaFromSavedSearch({
    city: "North Vancouver",
    minPrice: 800000,
    maxPrice: 1300000,
    beds: 2,
    baths: null,
    propertyType: "",
  });
  const note = criteriaFromText("2 baths, townhouse");
  const merged = mergeCriteria(saved, note);
  assert.equal(merged.area, "North Vancouver");
  assert.equal(merged.baths, 2);
  assert.equal(merged.propertyType, "Townhouse");
  assert.equal(hasWelcomeCriteria(merged), true);
});

test("no criteria falls back to the newest Greater Vancouver homes", () => {
  const steps = matchSteps({});
  assert.equal(steps.length, 1);
  assert.equal(steps[0].fit, "newest");
  assert.equal(steps[0].heading, "Newest homes in Greater Vancouver");
  assert.equal(steps[0].summary, "");
  assert.deepEqual(steps[0].queries, [{ sort: "newest" }]);
});

test("the first step with homes is the one the email uses", async () => {
  const criteria = criteriaFromText("North Vancouver, $800K–$1.3M, 2 beds");
  const calls: string[] = [];
  const result = await pickWelcomeHomes(criteria, async (filters) => {
    calls.push(`${filters.city || "any"}:${filters.minPrice || 0}-${filters.maxPrice || 0}`);
    if (filters.minPrice === 720000) {
      return [{ id: "a", address: "1 Sample St", city: "North Vancouver", price: 900000, href: "/h/a" }];
    }
    return [];
  });
  assert.equal(result.step.fit, "similar");
  assert.equal(result.homes[0]?.id, "a");
  assert.deepEqual(calls.slice(0, 2), ["North Vancouver:800000-1300000", "North Vancouver:720000-1430000"]);
});
