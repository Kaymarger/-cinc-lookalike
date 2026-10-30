import assert from "node:assert/strict";
import test from "node:test";
import { EMAIL_FOOTER } from "./autotrack.ts";
import { loadCincAutoTracks } from "./cinc-autotrack-catalog.ts";

const tracks = loadCincAutoTracks();

test("the capture seeds 21 tracks with the captured statuses", () => {
  assert.equal(tracks.length, 21);
  assert.equal(new Set(tracks.map((track) => track.id)).size, 21);
  assert.equal(tracks.filter((track) => track.status === "active").length, 14);
  assert.equal(tracks.filter((track) => track.status === "paused").length, 6);
  assert.equal(tracks.filter((track) => track.status === "disabled").length, 1);
  assert.equal(tracks.every((track) => track.category === "General" && track.captured), true);
});

test("repeated tracks are expanded and emails include the shared footer", () => {
  const holidays = tracks.find((track) => track.name === "Denisse-Holidays Spanish");
  const wrong = tracks.find((track) => track.name === "Buyer Wrong Number");
  const seller = tracks.find((track) => track.name === "Seller No Answer - Email Follow-Up Copy");
  const buyer = tracks.find((track) => track.name === "Buyer No Answer - Email Follow-Up");
  assert.equal(holidays?.steps.length, 13);
  assert.equal(wrong?.steps.length, 5);
  assert.match(wrong?.steps[0]?.body ?? "", /wrong number/);
  assert.equal(seller?.steps.length, 5);
  assert.equal(seller?.steps.map((step) => step.day).join(","), "1,2,4,7,10");
  assert.match(seller?.steps[0]?.body ?? "", /selling your home/);
  assert.equal(seller?.steps[1]?.subject, buyer?.steps[1]?.subject);
  assert.equal(seller?.steps[4]?.body, buyer?.steps[4]?.body);
  assert.equal(tracks.filter((track) => track.steps.some((step) => step.action === "email")).every((track) => track.steps.filter((step) => step.action === "email").every((step) => step.body.includes(EMAIL_FOOTER))), true);
});

test("owners, hours, and a reminder schedule survive the parse", () => {
  const spanish = tracks.find((track) => track.name === "LinkedIn-Holidays Spanish");
  const speed = tracks.find((track) => track.name.startsWith("CINC TEMPLATE"));
  const weekly = tracks.find((track) => track.name === "Weekly Reminders");
  const disabled = tracks.find((track) => track.status === "disabled");
  assert.equal(spanish?.visibility, "private");
  assert.equal(spanish?.owner, "Denisse Moran");
  assert.equal(spanish?.steps[0]?.scheduleTime, "6:00");
  assert.equal(speed?.status, "paused");
  assert.equal(speed?.hours, "9 AM - 9 PM, Monday - Sunday");
  assert.equal(speed?.steps.filter((step) => step.action === "text").length, 3);
  assert.equal(speed?.steps[1]?.delayMinutes, 10);
  assert.equal(speed?.steps[1]?.afterPrevious, true);
  assert.equal(weekly?.steps.length, 6);
  assert.equal(weekly?.steps[0]?.scheduleTime, "9:00");
  assert.equal(disabled?.name, "Follow Up Reminders - Referral Exchange");
  assert.equal(disabled?.steps[1]?.scheduleTime, "8:00");
});
