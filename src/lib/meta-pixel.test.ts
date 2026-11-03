import assert from "node:assert/strict";
import test from "node:test";
import {
  META_PIXEL_FALLBACK,
  isPublicLeadPath,
  pixelEventsForLead,
  resolveMetaPixelId,
  safeSearchString,
} from "./meta-pixel.ts";

test("the site pixel is the fallback when the env value is empty or invalid", () => {
  assert.equal(resolveMetaPixelId(""), META_PIXEL_FALLBACK);
  assert.equal(resolveMetaPixelId("not-a-pixel"), META_PIXEL_FALLBACK);
  assert.equal(resolveMetaPixelId("1412153377363377"), "1412153377363377");
});

test("signup, contact, showing, and home value map to events without personal fields", () => {
  assert.deepEqual(pixelEventsForLead("registration"), [
    { event: "Lead", params: { content_category: "signup" } },
    { event: "CompleteRegistration", params: { content_name: "signup" } },
  ]);
  assert.deepEqual(pixelEventsForLead("showing_request"), [
    { event: "Lead", params: { content_category: "showing" } },
  ]);
  assert.deepEqual(pixelEventsForLead("home_valuation"), [
    { event: "Lead", params: { content_category: "home_value" } },
  ]);
  assert.deepEqual(pixelEventsForLead("search_alert"), []);
  assert.equal(safeSearchString("ada@example.com Kitsilano"), "Kitsilano");
});

test("the pixel stays off the agent office", () => {
  assert.equal(isPublicLeadPath("/"), true);
  assert.equal(isPublicLeadPath("/search"), true);
  assert.equal(isPublicLeadPath("/agent"), false);
  assert.equal(isPublicLeadPath("/agent/leads"), false);
  assert.equal(isPublicLeadPath("/dashboard/spa"), false);
});
