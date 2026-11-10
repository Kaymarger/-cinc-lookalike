import assert from "node:assert/strict";
import test from "node:test";
import { distanceKm, insideCircle } from "./geo";

test("a point inside the drawn circle matches and one outside does not", () => {
  const circle = { lat: 49.25, lng: -123.1, km: 2 };
  assert.equal(insideCircle({ lat: 49.252, lng: -123.1 }, circle), true);
  assert.ok(distanceKm(49.25, -123.1, 49.3, -123.1) > 2);
  assert.equal(insideCircle({ lat: 49.3, lng: -123.1 }, circle), false);
});
