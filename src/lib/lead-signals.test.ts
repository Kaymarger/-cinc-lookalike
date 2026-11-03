import assert from "node:assert/strict";
import test from "node:test";
import { accountVerified, leadSide, quartScore, validEmail, validPhone } from "./lead-signals.ts";

test("quart score rises with a real phone, email, and a signup", () => {
  const bare = quartScore({ email: "", phone: "", source: "general" });
  const full = quartScore({
    email: "ada@example.com",
    phone: "(604) 555-0100",
    source: "registration",
    searchLabel: "Kitsilano",
    smsOptIn: true,
  });
  assert.ok(full > bare);
  assert.equal(full, 85);
  assert.equal(validEmail("ada@example.com"), true);
  assert.equal(validPhone("555"), false);
});

test("seller comes from a valuation or seller signup", () => {
  assert.equal(leadSide({ source: "home_valuation" }), "Seller");
  assert.equal(leadSide({ intent: "seller", source: "general" }), "Seller");
  assert.equal(leadSide({ source: "showing_request" }), "Buyer");
  assert.equal(accountVerified("registration"), true);
  assert.equal(accountVerified("ask_question"), false);
});
