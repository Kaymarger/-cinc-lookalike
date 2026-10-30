import assert from "node:assert/strict";
import test from "node:test";
import { AUTO_LABELS, LEAD_SOURCES, MARKET_AREAS, TEMPLATE_GROUPS } from "./cinc-lists.ts";

test("captured option lists have the recorded lengths", () => {
  assert.equal(LEAD_SOURCES.length, 67);
  assert.equal(AUTO_LABELS.length, 32);
  assert.equal(TEMPLATE_GROUPS.Uncategorized.length, 4);
  assert.equal(TEMPLATE_GROUPS["Shared Templates"].length, 16);
  assert.equal(TEMPLATE_GROUPS["CINC Templates"].length, 54);
  assert.equal(MARKET_AREAS.length, 32);
  assert.equal(LEAD_SOURCES.includes("[REDACTED]"), true);
  assert.equal(TEMPLATE_GROUPS["CINC Templates"].includes("Email- Ready to Look at Houses..."), true);
});
