import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  ""
).trim();

if (!url) {
  console.log("[leads] No DATABASE_URL or POSTGRES_URL. The table will be created on first use.");
  process.exit(0);
}

const sql = postgres(url, {
  ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require",
  max: 1,
  prepare: false,
  connect_timeout: 20,
});

function statements(schema) {
  return schema
    .split(";")
    .map((part) => part.replace(/--[^\n]*/g, "").trim())
    .filter(Boolean);
}

try {
  const schema = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8");
  for (const statement of statements(schema)) {
    await sql.unsafe(statement);
  }
  console.log("[leads] captured_leads, office_users, saved searches, access tokens, and lead routing are ready.");
} catch (error) {
  console.warn(
    "[leads] Could not create the table during build. It will be created on first use.",
    error instanceof Error ? error.name : "error"
  );
} finally {
  await sql.end({ timeout: 5 });
}
