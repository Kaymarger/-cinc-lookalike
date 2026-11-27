import assert from "node:assert/strict";
import test from "node:test";
import { mailboxKey, nameIsEmailHandle, preferredLeadName, sameMailbox } from "./lead-match.ts";

test("plus tags match the same mailbox without changing a real name", () => {
  assert.equal(mailboxKey("Admin+Tag@Example.com"), "admin@example.com");
  assert.equal(sameMailbox("admin+tag@example.com", "Admin@Example.com"), true);
  assert.equal(sameMailbox("admin+tag@example.com", "other@example.com"), false);
  assert.equal(nameIsEmailHandle("admin+tag", "admin+tag@example.com"), true);
  assert.equal(nameIsEmailHandle("QA Test Lead", "admin+tag@example.com"), false);
  assert.equal(preferredLeadName("QA Test Lead", "admin+tag", "admin+tag@example.com"), "QA Test Lead");
});
