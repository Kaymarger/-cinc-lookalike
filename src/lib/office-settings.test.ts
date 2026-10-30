import assert from "node:assert/strict";
import test from "node:test";
import { rate, sanitizeSettings } from "./office-settings.ts";

test("rates stay empty until there is a stored send", () => {
  assert.equal(rate(0, 0), null);
  assert.equal(rate(1, 4), 25);
});

test("office settings keep saved budgets and drop junk", () => {
  const settings = sanitizeSettings({ searchBudget: "1200", listcastBudget: -5, sellerEnabled: true, sellerLabel: "Seller" });
  assert.equal(settings.searchBudget, 1200);
  assert.equal(settings.listcastBudget, 0);
  assert.equal(settings.sellerEnabled, true);
  assert.equal(settings.sellerLabel, "Seller");
});
