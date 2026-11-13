import assert from "node:assert/strict";
import test from "node:test";
import { isRoutingCandidate, nextPoolUser, pickUniform } from "./lead-routing-pick.ts";

test("round robin walks the active pool in order", () => {
  const pool = ["a", "b", "c"];
  const active = new Set(pool);
  assert.equal(nextPoolUser(pool, 1, active), "a");
  assert.equal(nextPoolUser(pool, 2, active), "b");
  assert.equal(nextPoolUser(pool, 3, active), "c");
  assert.equal(nextPoolUser(pool, 4, active), "a");
});

test("round robin skips inactive agents", () => {
  const pool = ["a", "b", "c"];
  const active = new Set(["a", "c"]);
  assert.equal(nextPoolUser(pool, 1, active), "a");
  assert.equal(nextPoolUser(pool, 2, active), "c");
  assert.equal(nextPoolUser(pool, 3, active), "a");
  assert.equal(nextPoolUser([], 1, active), null);
  assert.equal(nextPoolUser(pool, 0, active), null);
});

test("uniform routing spreads leads evenly", () => {
  const ids = ["a", "b", "c"];
  const counts = { a: 0, b: 0, c: 0 };
  let n = 0;
  const random = () => {
    const value = (n % 3000) / 3000;
    n += 1;
    return value;
  };
  for (let i = 0; i < 3000; i += 1) {
    const picked = pickUniform(ids, random);
    if (picked) counts[picked as "a" | "b" | "c"] += 1;
  }
  assert.equal(counts.a, 1000);
  assert.equal(counts.b, 1000);
  assert.equal(counts.c, 1000);
  assert.equal(pickUniform([], random), null);
});

test("an agent who is out of the office is not eligible", () => {
  assert.equal(isRoutingCandidate({ active: true, role: "agent", inOffice: false }), false);
  assert.equal(isRoutingCandidate({ active: true, role: "agent", inOffice: true }), true);
});

test("a hidden admin is not a routing candidate", () => {
  assert.equal(isRoutingCandidate({ active: true, role: "admin", routingHidden: true }), false);
  assert.equal(isRoutingCandidate({ active: true, role: "admin", routingHidden: false }), true);
  assert.equal(isRoutingCandidate({ active: false, role: "agent" }), false);
});
