import { officeDb } from "@/lib/leads-db";
import { isQaTestAgent } from "@/lib/lead-routing-pick";
import { listUsers } from "@/lib/office-users";

const ADS_TEST_NAME = "QA Ads Test 1127";
const ADS_TEST_EMAIL = "admin+adstest@%";

/** Disable leftover QA agents and pull them out of routing. Trash the ads test lead. */
export async function retireQaOffice(): Promise<void> {
  const sql = await officeDb();
  if (!sql) return;
  const users = await listUsers();
  const qa = users.filter((user) => !user.bootstrap && isQaTestAgent(user));
  for (const user of qa) {
    await sql`
      UPDATE office_users
      SET active = false, routing_hidden = true, in_office = false, updated_at = now()
      WHERE id = ${user.id} AND bootstrap IS NOT TRUE
    `;
    await sql`
      UPDATE lead_routing SET
        fixed_user_id = CASE WHEN fixed_user_id = ${user.id} THEN NULL ELSE fixed_user_id END,
        mode = CASE WHEN fixed_user_id = ${user.id} AND mode = 'fixed' THEN 'default' ELSE mode END,
        pool_ids = COALESCE((
          SELECT jsonb_agg(to_jsonb(elem))
          FROM jsonb_array_elements_text(pool_ids) AS elem
          WHERE elem <> ${user.id}
        ), '[]'::jsonb),
        updated_at = now()
      WHERE id = 'default'
    `;
  }
  await sql`
    UPDATE captured_leads
    SET status = 'trashed', updated_at = now()
    WHERE btrim(name) ILIKE ${ADS_TEST_NAME}
      AND lower(email) LIKE ${ADS_TEST_EMAIL}
      AND status IS DISTINCT FROM 'trashed'
  `;
}

let pending: Promise<void> | null = null;

export function retireQaOfficeOnce(): Promise<void> {
  if (!pending) {
    pending = retireQaOffice().catch((error) => {
      pending = null;
      console.error("[routing] qa cleanup", error instanceof Error ? error.name : "error");
    });
  }
  return pending;
}
