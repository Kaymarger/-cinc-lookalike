import assert from "node:assert/strict";
import test from "node:test";
import { activeMlsFromFeaturedHtml, activeMlsFromFeaturedPages } from "./featured-source";

test("featured HTML keeps active MLS numbers and skips sold cards", () => {
  const html = `
    <li class="mrp-listing-result status-ACTIVE" data-share-url="https://example.com/listing.r3181182-address.1/">ok</li>
    <li class="mrp-listing-result status-SOLD" data-share-url="https://example.com/listing.r3000001-sold.2/">sold</li>
    <li class="mrp-listing-result status-ACTIVE NEW-BANNER" data-share-url="https://example.com/listing.r3180415-other.3/">ok</li>
  `;
  assert.deepEqual(activeMlsFromFeaturedHtml(html), ["R3181182", "R3180415"]);
});

test("later featured pages add active cards and ignore a repeated page", () => {
  const pageOne = `<li class="status-ACTIVE" data-share-url="https://example.com/listing.r3181182-a.1/">a</li>`;
  const pageTwo = `
    <li class="status-ACTIVE" data-share-url="https://example.com/listing.r3110554-b.2/">b</li>
    <li class="status-SOLD SOLD-BANNER" data-share-url="https://example.com/listing.r3177590-c.3/">c</li>
  `;
  assert.deepEqual(activeMlsFromFeaturedPages([pageOne, pageTwo, pageOne]), ["R3181182", "R3110554"]);
});
