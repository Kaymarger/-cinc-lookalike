import { officeDb } from "./leads-db";
import { hashPassword } from "./password-hash";

export const AUDIT_EMAIL_DEFAULT = "audit@cinc-lookalike.local";

export async function ensureAuditAdmin(): Promise<"skipped" | "ready"> {
  const password = process.env.AUDIT_PASSWORD?.trim() || "";
  if (!password) return "skipped";
  const email = (process.env.AUDIT_EMAIL?.trim() || AUDIT_EMAIL_DEFAULT).toLowerCase();
  const sql = await officeDb();
  if (!sql) return "skipped";
  const hash = await hashPassword(password);
  const rows = await sql<{ id: string }[]>`
    INSERT INTO office_users (
      id, email, password_hash, role, first_name, last_name, active, bootstrap, must_set_password, routing_hidden
    ) VALUES (
      ${crypto.randomUUID()},
      ${email},
      ${hash},
      'admin',
      'QA',
      'Audit',
      true,
      false,
      false,
      true
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
  const id = rows[0]?.id;
  if (!id) return "skipped";
  await sql`
    UPDATE captured_leads
    SET assigned_user_id = NULL, assigned_to = 'Unassigned'
    WHERE assigned_user_id = ${id} OR lower(btrim(assigned_to)) = 'qa audit'
  `;
  await sql`
    UPDATE captured_leads
    SET partner_user_id = NULL, partner_name = 'Unassigned'
    WHERE partner_user_id = ${id}
  `;
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
  return "ready";
}
