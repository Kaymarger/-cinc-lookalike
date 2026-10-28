import { officeDb } from "@/lib/leads-db";

export async function readPreferences(userId: string): Promise<Record<string, unknown>> {
  const sql = await officeDb();
  if (!sql) return {};
  const rows = await sql<{ preferences: unknown }[]>`
    SELECT preferences FROM office_users WHERE id = ${userId} LIMIT 1
  `;
  const value = rows[0]?.preferences;
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

export async function writePreferences(userId: string, preferences: Record<string, unknown>): Promise<void> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  await sql`
    UPDATE office_users
    SET preferences = ${sql.json(JSON.parse(JSON.stringify(preferences)))}, updated_at = now()
    WHERE id = ${userId}
  `;
}
