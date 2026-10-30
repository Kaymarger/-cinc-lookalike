import assert from "node:assert/strict";
import test from "node:test";
import { isRoutingCandidate, nextPoolUser } from "./lead-routing-pick.ts";

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

test("a hidden admin is not a routing candidate", () => {
  assert.equal(isRoutingCandidate({ active: true, role: "admin", routingHidden: true }), false);
  assert.equal(isRoutingCandidate({ active: true, role: "admin", routingHidden: false }), true);
  assert.equal(isRoutingCandidate({ active: false, role: "agent" }), false);
});
