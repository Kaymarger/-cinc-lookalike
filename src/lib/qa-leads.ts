import { deleteLeadByEmail, officeDb } from "@/lib/leads-db";

const MARKER = "qa-leads-1127-once";

const QA_EMAILS = [
  "admin+qalead1127@caseyarchibald.com",
  "admin+qalead1127b@caseyarchibald.com",
  "admin+qalead1127c@caseyarchibald.com",
];

/** Delete the November QA leads once. Later startups see the marker and leave the database alone. */
export async function deleteQaRetestLeadsOnce(): Promise<void> {
  const sql = await officeDb();
  if (!sql) return;
  const done = await sql<{ id: string }[]>`SELECT id FROM office_settings WHERE id = ${MARKER} LIMIT 1`;
  if (done[0]) return;
  let removed = 0;
  for (const email of QA_EMAILS) {
    removed += await deleteLeadByEmail(email);
  }
  await sql`
    INSERT INTO office_settings (id, document, updated_at)
    VALUES (${MARKER}, ${sql.json({ removed })}, now())
    ON CONFLICT (id) DO NOTHING
  `;
  if (removed) console.log("[leads] removed QA test leads", removed);
}
