import assert from "node:assert/strict";
import test from "node:test";
import { loginCodeFor, loginCodeMatches } from "./login-code.ts";

test("a sign-in code matches for ten minutes and then expires", () => {
  const now = Date.UTC(2026, 10, 27, 20, 0, 0);
  const code = loginCodeFor("Admin+QA@Example.com", "secret", now);
  assert.equal(code.length, 6);
  assert.equal(loginCodeMatches("admin+qa@example.com", code, "secret", now + 9 * 60 * 1000), true);
  assert.equal(loginCodeMatches("admin+qa@example.com", code, "secret", now + 11 * 60 * 1000), true);
  assert.equal(loginCodeMatches("admin+qa@example.com", code, "secret", now + 21 * 60 * 1000), false);
  assert.equal(loginCodeMatches("admin+qa@example.com", "000000", "secret", now), false);
});
