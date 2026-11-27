import postgres from "postgres";

const email = "admin+qalead1127@caseyarchibald.com";
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!url) {
  console.log("no-database");
  process.exit(0);
}
const sql = postgres(url, { ssl: "require", max: 1 });
const searches = await sql`DELETE FROM lead_saved_searches WHERE lower(lead_email) = ${email} RETURNING id`;
const leads = await sql`DELETE FROM captured_leads WHERE lower(email) = ${email} RETURNING id`;
console.log(`removed leads ${leads.length} searches ${searches.length}`);
await sql.end();
