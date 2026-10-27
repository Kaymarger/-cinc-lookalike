import assert from "node:assert/strict";
import test from "node:test";
import { attributionSummary, sanitizeAttribution, sanitizeLeadInput } from "./lead-intake.ts";

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
  assert.match(attributionSummary(attribution), /google \/ cpc \/ spring-buyers/);
  assert.match(attributionSummary(attribution), /gclid: abc123/);
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
