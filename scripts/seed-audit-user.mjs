import { readFileSync } from "node:fs";
import postgres from "postgres";
import { hashPassword } from "../src/lib/password-hash.ts";

if (!process.env.AUDIT_PASSWORD?.trim() && process.env.AUDIT_ACCOUNT_FILE) {
  const text = readFileSync(process.env.AUDIT_ACCOUNT_FILE, "utf8");
  for (const line of text.split("\n")) {
    const match = /^(AUDIT_EMAIL|AUDIT_PASSWORD)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
  }
}

const password = process.env.AUDIT_PASSWORD?.trim() || "";
const email = (process.env.AUDIT_EMAIL?.trim() || "audit@cinc-lookalike.local").toLowerCase();
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
if (!password || !url) {
  console.error("[audit] AUDIT_PASSWORD or the database URL is not set. No user was created.");
  process.exitCode = 1;
} else {
  const sql = postgres(url, { ssl: /localhost|127\.0\.0\.1/.test(url) ? false : "require", max: 1 });
  await sql`ALTER TABLE office_users ADD COLUMN IF NOT EXISTS routing_hidden boolean NOT NULL DEFAULT false`;
  const hash = await hashPassword(password);
  const rows = await sql`
    INSERT INTO office_users (
      id, email, password_hash, role, first_name, last_name, active, bootstrap, must_set_password, routing_hidden
    ) VALUES (
      ${crypto.randomUUID()}, ${email}, ${hash}, 'admin', 'QA', 'Audit', true, false, false, true
    )
    ON CONFLICT (email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      role = 'admin',
      first_name = 'QA',
      last_name = 'Audit',
      active = true,
      bootstrap = false,
      must_set_password = false,
      routing_hidden = true,
      updated_at = now()
    RETURNING id
  `;
  const id = rows[0].id;
  await sql`
    UPDATE captured_leads
    SET assigned_user_id = NULL, assigned_to = 'Unassigned'
    WHERE assigned_user_id = ${id} OR lower(btrim(assigned_to)) = 'qa audit'
  `;
  await sql`UPDATE captured_leads SET partner_user_id = NULL, partner_name = 'Unassigned' WHERE partner_user_id = ${id}`;
  await sql`
    UPDATE lead_routing SET
      fixed_user_id = CASE WHEN fixed_user_id = ${id} THEN NULL ELSE fixed_user_id END,
      pool_ids = COALESCE((
        SELECT jsonb_agg(to_jsonb(elem))
        FROM jsonb_array_elements_text(pool_ids) AS elem
        WHERE elem <> ${id}
      ), '[]'::jsonb),
      updated_at = now()
    WHERE id = 'default'
  `;
  await sql.end();
  console.log("[audit] QA admin is ready");
}
