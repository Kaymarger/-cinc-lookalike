import assert from "node:assert/strict";
import test from "node:test";
import {
  deliveryPayload,
  fillMergeTags,
  insertAtCursor,
  sanitizeEmailHtml,
  sanitizeTrack,
  stepSummary,
  videoBlock,
  videoThumbnail,
  youtubeId,
} from "./autotrack.ts";

test("insertAtCursor writes at the caret and replaces a selection", () => {
  const inserted = insertAtCursor("Hello ", 6, 6, "[FIRSTNAME]");
  assert.equal(inserted.value, "Hello [FIRSTNAME]");
  assert.equal(inserted.caret, 6 + "[FIRSTNAME]".length);
  const replaced = insertAtCursor("Hello name", 6, 10, "Jordan");
  assert.equal(replaced.value, "Hello Jordan");
});

test("merge tags fill from the sample lead", () => {
  const filled = fillMergeTags("Hi [FIRSTNAME] [LASTNAME], see [FAVORITE CITY].");
  assert.equal(filled, "Hi Jordan Blake, see Burnaby.");
  assert.equal(fillMergeTags("[AGENT EMAIL]"), "agent@example.com");
});

test("html mode strips scripts and preview fills merge tags", () => {
  const clean = sanitizeEmailHtml('<p onclick="alert(1)">Hi</p><script>alert(1)</script>');
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("<p>Hi</p>"), true);
  const payload = deliveryPayload({
    id: "step-1",
    day: 1,
    action: "email",
    subject: "Hello [FIRSTNAME]",
    body: "<p>Hi [FIRSTNAME]</p><script>nope</script>",
    format: "html",
    to: "Lead",
    from: "Buyer's Agent",
    template: "",
    schedule: "immediate",
    scheduleTime: "09:00",
    meridiem: "AM",
    attachments: [{ id: "file-1", name: "guide.pdf", contentType: "application/pdf", size: 12 }],
    videoUrl: "https://youtu.be/abcdefghijk",
    videoTitle: "Tour",
    reminderType: "Call",
    blocking: false,
  });
  assert.equal(payload.subject, "Hello Jordan");
  assert.equal(payload.body.includes("Hi Jordan"), true);
  assert.equal(payload.body.includes("script"), false);
  assert.equal(payload.attachments[0]?.name, "guide.pdf");
  assert.equal(payload.videoUrl, "https://youtu.be/abcdefghijk");
});

test("plain text stays plain and video blocks differ by mode", () => {
  const payload = deliveryPayload({
    id: "step-2",
    day: 3,
    action: "text",
    subject: "",
    body: "Call [FIRSTNAME]",
    format: "plain",
    to: "Lead",
    from: "",
    template: "",
    schedule: "specific",
    scheduleTime: "09:00",
    meridiem: "AM",
    attachments: [],
    videoUrl: "",
    videoTitle: "",
    reminderType: "Call",
    blocking: false,
  });
  assert.equal(payload.body, "Call Jordan");
  assert.equal(payload.format, "plain");
  assert.equal(stepSummary({ ...payload, id: "step-2", day: 3, action: "text", subject: "Check in", body: payload.body, format: "plain", to: "Lead", from: "", template: "", schedule: "specific", scheduleTime: "09:00", meridiem: "AM", attachments: [], videoUrl: "", videoTitle: "", reminderType: "Call", blocking: false }), "Day 3 · offset 2 · Text · Check in");
  assert.equal(youtubeId("https://youtu.be/abcdefghijk"), "abcdefghijk");
  assert.equal(youtubeId("https://www.youtube.com/watch?v=abcdefghijk"), "abcdefghijk");
  assert.equal(videoThumbnail("https://youtu.be/abcdefghijk"), "https://img.youtube.com/vi/abcdefghijk/hqdefault.jpg");
  assert.match(videoBlock("https://youtu.be/abcdefghijk", "Tour", "html"), /<figure/);
  assert.match(videoBlock("https://youtu.be/abcdefghijk", "Tour", "plain"), /Video: Tour\nhttps:\/\/youtu\.be\/abcdefghijk/);
});

test("sanitize keeps attachments and rejects a blank name", () => {
  const saved = sanitizeTrack({
    id: "track-1",
    name: "  Buyer drip  ",
    category: "Buyer",
    status: "active",
    leadTypes: ["Buyer", "Nope"],
    hours: "9 AM - 5 PM, Monday - Friday",
    includeWeekend: true,
    stopReply: true,
    complete: "Take No Further Action",
    steps: [{
      id: "step-1",
      day: 1,
      action: "email",
      subject: "Hello",
      body: "Body",
      format: "plain",
      attachments: [{ id: "file-9", name: "photo.png", contentType: "image/png", size: 4 }],
    }],
  });
  assert.equal(saved.ok, true);
  if (saved.ok) {
    assert.equal(saved.value.name, "Buyer drip");
    assert.deepEqual(saved.value.leadTypes, ["Buyer"]);
    assert.equal(saved.value.steps[0]?.format, "plain");
    assert.equal(saved.value.steps[0]?.attachments[0]?.name, "photo.png");
    assert.equal(saved.value.trigger, "New Lead");
  }
  assert.equal(sanitizeTrack({ id: "track-1", name: "   " }).ok, false);
  assert.equal(sanitizeTrack({ id: "bad id", name: "Ok" }).ok, false);
});
