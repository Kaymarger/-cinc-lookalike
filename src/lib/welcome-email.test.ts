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
  assert.match(message.subject, /Welcome/);
  assert.match(message.text, /Search Greater Vancouver homes/);
  assert.match(message.html, /Search homes/);
  assert.match(message.html, /Archibald Real Estate Group/);
  assert.doesNotMatch(message.text + message.html, /password/i);
  assert.doesNotMatch(message.text + message.html, /testimonial|ranked|top 1%/i);
});
