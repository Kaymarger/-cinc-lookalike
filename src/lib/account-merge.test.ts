import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAccountNotes,
  deviceSearchesForEmail,
  mergeIds,
  propertyNotesFromText,
  readNotebooks,
} from "./account-merge.ts";

test("saved homes from the account and this browser combine without duplicates", () => {
  assert.deepEqual(mergeIds(["a", "b"], ["b", "c"], 40), ["a", "b", "c"]);
});

test("an alert saved for a different email is left out of this account", () => {
  const kept = deviceSearchesForEmail(
    [
      { email: "owner@example.com", label: "Mine" },
      { email: "other@example.com", label: "Old" },
      { email: "", label: "Browser" },
    ],
    "owner@example.com"
  );
  assert.deepEqual(kept.map((row) => row.label), ["Mine", "Browser"]);
});

test("account notes keep homes, compare, notebook, and the latest property note", () => {
  const notes = applyAccountNotes("Favourites: home-1\nProperty note (home-1) 1 Main: First", {
    homes: ["home-2"],
    homesMode: "merge",
    compare: ["home-2"],
    compareMode: "merge",
    notebook: [{ id: "n1", title: "Follow up", body: "Call Saturday" }],
    notebookMode: "merge",
    propertyNotes: [{ propertyId: "home-1", address: "1 Main", body: "Second look" }],
  });
  assert.match(notes, /Favourites: home-1,home-2/);
  assert.match(notes, /Compare: home-2/);
  assert.equal(readNotebooks(notes)[0]?.title, "Follow up");
  assert.equal(propertyNotesFromText(notes).find((note) => note.propertyId === "home-1")?.body, "Second look");
});
