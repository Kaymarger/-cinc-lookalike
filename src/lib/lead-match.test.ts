import assert from "node:assert/strict";
import test from "node:test";
import { exactEmail, nameIsEmailHandle, preferredLeadName } from "./lead-match.ts";

test("plus tags are different addresses and a real name is kept", () => {
  assert.equal(exactEmail("  Admin+Tag@Example.com "), "admin+tag@example.com");
  assert.notEqual(exactEmail("admin+one@example.com"), exactEmail("admin+two@example.com"));
  assert.equal(nameIsEmailHandle("admin+tag", "admin+tag@example.com"), true);
  assert.equal(nameIsEmailHandle("QA Test Lead", "admin+tag@example.com"), false);
  assert.equal(preferredLeadName("QA Test Lead", "admin+tag", "admin+tag@example.com"), "QA Test Lead");
  assert.equal(preferredLeadName("QA Retest Lead", "QA Final Lead", "admin+other@example.com"), "QA Retest Lead");
  assert.equal(preferredLeadName("admin+tag", "QA Final Lead", "admin+tag@example.com"), "QA Final Lead");
  assert.equal(preferredLeadName("", "QA Final Lead", "person@example.com"), "QA Final Lead");
});
