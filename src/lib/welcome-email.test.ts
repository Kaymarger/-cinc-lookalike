import assert from "node:assert/strict";
import test from "node:test";
import { registrationWelcome } from "./welcome-email";

test("the registration welcome is branded and does not invent claims or include a password", () => {
  const message = registrationWelcome({
    id: "lead-test",
    name: "QA Local",
    email: "qa-local@example.com",
    phone: "6045550100",
    smsOptIn: false,
    source: "registration",
    intent: "buyer",
    notes: "",
    consent: true,
    attribution: {},
    assignedTo: "Unassigned",
    createdAt: "2026-11-10T00:00:00.000Z",
  });
  assert.match(message.subject, /Welcome, QA, your Vancouver home search is ready/);
  assert.match(message.text, /Browse Greater Vancouver homes/);
  assert.match(message.html, /Browse homes/);
  assert.match(message.html, /Archibald Real Estate Group/);
  assert.match(message.html, /RE\/MAX Crest Realty/);
  assert.match(message.html, /display:none/);
  assert.doesNotMatch(message.text + message.html, /password/i);
  assert.doesNotMatch(message.text + message.html, /opt in|consent you gave/i);
  assert.doesNotMatch(message.text + message.html, /testimonial|ranked|top 1%/i);
});

test("welcome copy changes for a seller", () => {
  const message = registrationWelcome({ name: "Alex Morgan", email: "preview@example.com", intent: "seller" });
  assert.match(message.subject, /Welcome, Alex, let's talk about selling/);
  assert.match(message.text, /seller/);
  assert.doesNotMatch(message.text, /You’re set up as a buyer/);
});
