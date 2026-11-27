import assert from "node:assert/strict";
import test from "node:test";
import { consentGrantedFromHeader } from "./ads-consent.ts";
import {
  buildMetaLeadEvent,
  buildMetaPageViewEvent,
  metaEventsBody,
  metaPhoneDigits,
  normalizeCity,
  sha256Hex,
  splitPersonName,
} from "./meta-capi.ts";

const LEAD_ID = "lead-abc12345";

test("lead and page view share an event id and the lead body is hashed", () => {
  const lead = buildMetaLeadEvent({
    eventId: LEAD_ID,
    eventTime: 1_700_000_000,
    sourceUrl: "https://vancouverpropertysearch.ca/start?fbclid=click1",
    ip: "203.0.113.8",
    userAgent: "TestAgent",
    email: "  Alex@Example.com ",
    phone: "(604) 555-0100",
    name: "Alex Morgan",
    city: "North Vancouver",
    fbclid: "click1",
    externalId: LEAD_ID,
  });
  const page = buildMetaPageViewEvent({
    eventId: LEAD_ID,
    eventTime: 1_700_000_000,
    sourceUrl: "https://vancouverpropertysearch.ca/start?fbclid=click1",
    fbclid: "click1",
  });
  assert.ok(lead);
  assert.ok(page);
  assert.equal(lead.event_id, LEAD_ID);
  assert.equal(page.event_id, LEAD_ID);
  assert.equal(lead.event_name, "Lead");
  assert.equal(page.event_name, "PageView");
  assert.equal(lead.action_source, "website");
  assert.equal(lead.user_data.em, sha256Hex("alex@example.com"));
  assert.equal(lead.user_data.ph, sha256Hex(metaPhoneDigits("(604) 555-0100")));
  assert.equal(metaPhoneDigits("(604) 555-0100"), "16045550100");
  assert.equal(lead.user_data.fn, sha256Hex("alex"));
  assert.equal(lead.user_data.ln, sha256Hex("morgan"));
  assert.equal(normalizeCity("North Vancouver"), "northvancouver");
  assert.equal(lead.user_data.ct, sha256Hex("northvancouver"));
  assert.equal(lead.user_data.country, sha256Hex("ca"));
  assert.equal(lead.user_data.external_id, sha256Hex(LEAD_ID));
  assert.match(lead.user_data.fbc || "", /^fb\.1\.\d+\.click1$/);
  assert.equal(lead.user_data.client_ip_address, "203.0.113.8");
  const raw = JSON.stringify(lead);
  assert.equal(raw.includes("Alex@Example.com"), false);
  assert.equal(raw.includes("6045550100"), false);
  assert.equal(raw.includes("alex@example.com"), false);
  assert.equal("test_event_code" in lead, false);
});

test("production event bodies omit test_event_code unless a dry run passes one", () => {
  const lead = buildMetaLeadEvent({
    eventId: LEAD_ID,
    eventTime: 1_700_000_000,
    sourceUrl: "https://vancouverpropertysearch.ca/start",
    email: "alex@example.com",
    name: "Alex",
  });
  assert.ok(lead);
  const live = metaEventsBody([lead]);
  assert.equal(live.test_event_code, undefined);
  assert.equal(JSON.stringify(live).includes("test_event_code"), false);
  const dry = metaEventsBody([lead], "TEST123");
  assert.equal(dry.test_event_code, "TEST123");
});

test("names, empty contact fields, and consent follow the same rules", () => {
  assert.deepEqual(splitPersonName("  Mary Jane Watson "), { fn: "mary", ln: "watson" });
  assert.deepEqual(splitPersonName("Alex"), { fn: "alex" });
  const lead = buildMetaLeadEvent({
    eventId: LEAD_ID,
    sourceUrl: "https://vancouverpropertysearch.ca/start",
    name: "Alex",
    email: "not-an-email",
    phone: "12",
  });
  assert.ok(lead);
  assert.equal(lead.user_data.fn, sha256Hex("alex"));
  assert.equal(lead.user_data.ln, undefined);
  assert.equal(lead.user_data.em, undefined);
  assert.equal(lead.user_data.ph, undefined);
  assert.equal(buildMetaLeadEvent({ eventId: "", sourceUrl: "https://vancouverpropertysearch.ca/start" }), null);
  assert.equal(consentGrantedFromHeader(null), true);
  assert.equal(consentGrantedFromHeader("gvhs-cookies=essential"), false);
  assert.equal(consentGrantedFromHeader("gvhs-cookies=opt-out"), false);
  assert.equal(consentGrantedFromHeader("other=1; gvhs-cookies=all"), true);
});
