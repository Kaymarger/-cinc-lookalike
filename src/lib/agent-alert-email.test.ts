import assert from "node:assert/strict";
import test from "node:test";
import { agentAlertEmail } from "./agent-alert-email";
import type { SanitizedLead } from "./lead-intake";

const sample: SanitizedLead = {
  id: "lead-preview",
  name: "Alex Morgan",
  email: "alex@example.com",
  phone: "6045550100",
  smsOptIn: false,
  source: "buyer_signup",
  intent: "buyer",
  notes: "Looking around Kitsilano.",
  consent: true,
  attribution: {},
  assignedTo: "Casey Archibald",
  createdAt: "2026-11-27T00:00:00.000Z",
};

test("the agent alert is a scannable card and does not include a password", () => {
  const message = agentAlertEmail(sample);
  assert.match(message.subject, /Alex Morgan/);
  assert.match(message.subject, /Buyer signup/);
  assert.match(message.text, /Casey Archibald/);
  assert.match(message.html, /Open lead/);
  assert.match(message.html, /Looking around Kitsilano/);
  assert.match(message.html, /alex@example.com/);
  assert.doesNotMatch(message.html + message.text, /password/i);
  const activity = agentAlertEmail(
    { ...sample, name: "QA Test Lead", source: "showing_request", intent: "inquiry", phone: "" },
    { activity: true }
  );
  assert.equal(activity.subject, "Activity: Showing request from QA Test Lead");
  assert.doesNotMatch(activity.subject, /New lead/);
});
