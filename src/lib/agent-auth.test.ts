import assert from "node:assert/strict";
import test from "node:test";
import { passwordMatches, readBecome, readSession, safeNext, signBecome, signSession, verifySession } from "./agent-auth.ts";

test("safeNext only allows agent office paths", () => {
  assert.equal(safeNext("/agent/leads"), "/agent/leads");
  assert.equal(safeNext("/dashboard/spa#leads"), "/dashboard/spa#leads");
  assert.equal(safeNext("https://evil.example"), "/agent");
  assert.equal(safeNext("//evil.example"), "/agent");
  assert.equal(safeNext("/start"), "/agent");
  assert.equal(safeNext("/agent/login"), "/agent");
});

test("password check and session cookie", async () => {
  process.env.AGENT_PASSWORD = "office-secret";
  delete process.env.AUTH_SECRET;
  assert.equal(await passwordMatches("office-secret"), true);
  assert.equal(await passwordMatches("wrong"), false);
  const token = await signSession("user_1");
  assert.equal(await verifySession(token), true);
  assert.equal((await readSession(token))?.userId, "user_1");
  assert.equal(await verifySession(`${token}x`), false);
  const legacy = `v1.${Date.now() + 60_000}`;
  assert.equal(await readSession(legacy), null);

  const become = await signBecome("agent_2");
  assert.equal((await readBecome(become))?.userId, "agent_2");
  assert.equal(await readBecome(`${become}x`), null);

  delete process.env.AGENT_PASSWORD;
  assert.equal(await verifySession(token), false);
  assert.equal(await passwordMatches("office-secret"), false);
  assert.equal(await readBecome(become), null);
});
