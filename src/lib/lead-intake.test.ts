import assert from "node:assert/strict";
import test from "node:test";
import {
  adChannel,
  areaFromParams,
  attributionSummary,
  claimConversion,
  formatPhoneInput,
  landingHeadline,
  matchedSearchPath,
  normalizeEmailForAds,
  normalizePhoneForAds,
  officeLeadSource,
  firstTouchAttribution,
  sanitizeAttribution,
  sanitizeLeadInput,
  sha256Hex,
} from "./lead-intake.ts";

test("rejects a landing lead without consent", () => {
  const result = sanitizeLeadInput(
    {
      name: "Alex Morgan",
      email: "alex@example.com",
      phone: "6045550100",
      source: "buyer_signup",
      consent: false,
    },
    { assignedTo: "Casey Archibald", now: "2026-10-27T00:00:00.000Z" }
  );
  assert.equal(result.ok, false);
});

test("keeps UTM fields and drops empty ones", () => {
  const attribution = sanitizeAttribution({
    utmSource: "google",
    utmMedium: "cpc",
    utmCampaign: "spring-buyers",
    gclid: "abc123",
    landingPath: "/start?utm_source=google",
    utmTerm: "",
  });
  assert.equal(attribution.utmSource, "google");
  assert.equal(attribution.utmTerm, undefined);
  const flags = sanitizeAttribution({ firstTimeBuyer: false, preApproved: true, device: "mobile" });
  assert.equal(flags.firstTimeBuyer, false);
  assert.equal(flags.preApproved, true);
  assert.equal(flags.device, "mobile");
  assert.match(attributionSummary(attribution), /google \/ cpc \/ spring-buyers/);
  assert.match(attributionSummary(attribution), /gclid: abc123/);
  assert.equal(adChannel(attribution), "Google Ads");
  const meta = sanitizeAttribution({
    fbclid: "fb1",
    fbc: "fb.1.1",
    fbp: "fb.1.2",
    gbraid: "gb",
    wbraid: "wb",
    landingUrl: "https://vancouverpropertysearch.ca/start?fbclid=fb1",
  });
  assert.equal(meta.gbraid, "gb");
  assert.equal(meta.fbp, "fb.1.2");
  assert.equal(adChannel(meta), "Google Ads");
  assert.equal(adChannel({ fbclid: "fb1" }), "Meta");
  assert.equal(officeLeadSource("buyer_signup", { fbclid: "fb1" }), "Meta · Buyer signup");
  const first = firstTouchAttribution(
    { utmSource: "google", gclid: "first-click", fbclid: "fb-first" },
    { utmSource: "newsletter", gclid: "later-click", utmCampaign: "spring" }
  );
  assert.equal(first.gclid, "first-click");
  assert.equal(first.fbclid, "fb-first");
  assert.equal(first.utmSource, "google");
  assert.equal(first.utmCampaign, "spring");
});

test("a saved lead fires a conversion once, and a missing id does not fire", () => {
  const seen = new Set<string>();
  const store = new Map<string, string>();
  const read = (key: string) => store.get(key) ?? null;
  const write = (key: string, value: string) => {
    store.set(key, value);
  };
  assert.equal(claimConversion(undefined, seen, read, write), false);
  assert.equal(claimConversion("lead-1", seen, read, write), true);
  assert.equal(claimConversion("lead-1", seen, read, write), false);
  assert.equal(store.get("gvhs-ads-lead:lead-1"), "1");
});

test("area variants, phone format, and ad hashes stay free of raw contact text", async () => {
  assert.equal(areaFromParams({ area: "North Vancouver" }), "North Vancouver");
  assert.equal(landingHeadline("North Vancouver"), "Find your next home in North Vancouver");
  assert.equal(matchedSearchPath("North Vancouver"), "/search?city=North+Vancouver&sort=newest");
  assert.equal(areaFromParams({ utm_term: "homes for sale" }), "");
  assert.equal(formatPhoneInput("6045550100"), "(604) 555-0100");
  assert.equal(normalizePhoneForAds("(604) 555-0100"), "+16045550100");
  assert.equal(normalizeEmailForAds("  Alex@Example.com "), "alex@example.com");
  const hash = await sha256Hex("alex@example.com");
  assert.equal(hash.length, 64);
  assert.equal(hash.includes("alex@example.com"), false);
});

test("accepts a consented seller lead and ignores a filled honeypot", () => {
  const good = sanitizeLeadInput(
    {
      id: "lead-abc12345",
      name: "Sam Patel",
      email: "Sam@Example.com",
      phone: "(604) 555-0199",
      source: "home_valuation",
      consent: true,
      smsOptIn: true,
      propertyAddress: "123 Main St",
      notes: "Selling before summer",
      attribution: { utmSource: "facebook", utmMedium: "paid" },
    },
    { assignedTo: "Casey Archibald", now: "2026-10-27T00:00:00.000Z" }
  );
  assert.equal(good.ok, true);
  if (good.ok) {
    assert.equal(good.lead.email, "sam@example.com");
    assert.equal(good.lead.intent, "valuation");
    assert.equal(good.lead.id, "lead-abc12345");
    assert.equal(good.lead.consentText?.includes("STOP"), true);
  }

  const bot = sanitizeLeadInput(
    {
      name: "Bot",
      email: "bot@example.com",
      phone: "6045550100",
      source: "buyer_signup",
      consent: true,
      website: "http://spam.example",
    },
    { assignedTo: "Casey Archibald" }
  );
  assert.equal(bot.ok, false);
  if (!bot.ok) assert.equal(bot.message, "honeypot");
});
