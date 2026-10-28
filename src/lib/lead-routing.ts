import { officeDb } from "@/lib/leads-db";
import { nextPoolUser } from "@/lib/lead-routing-pick";
import { assignedAgentName } from "@/lib/notify-lead";
import type { OfficeRole } from "@/lib/office-access";
import { findUserById, findUserByName, listUsers, type OfficeUser } from "@/lib/office-users";

export { nextPoolUser } from "@/lib/lead-routing-pick";

export const ROUTABLE_ROLES: OfficeRole[] = ["admin", "broker", "agent", "isa"];

export type RoutingMode = "default" | "fixed" | "round_robin";

export type RoutingSettings = {
  mode: RoutingMode;
  fixedUserId: string | null;
  poolIds: string[];
};

type RoutingRow = {
  mode: string;
  fixed_user_id: string | null;
  pool_ids: unknown;
  rr_cursor: number;
};

export function isRoutableRole(role: OfficeRole): boolean {
  return ROUTABLE_ROLES.includes(role);
}

function asPool(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function eligible(user: OfficeUser): boolean {
  return user.active && isRoutableRole(user.role);
}

export async function getLeadRouting(): Promise<RoutingSettings> {
  const sql = await officeDb();
  if (!sql) return { mode: "default", fixedUserId: null, poolIds: [] };
  const rows = await sql<RoutingRow[]>`SELECT * FROM lead_routing WHERE id = 'default' LIMIT 1`;
  const row = rows[0];
  if (!row) return { mode: "default", fixedUserId: null, poolIds: [] };
  const mode: RoutingMode =
    row.mode === "fixed" || row.mode === "round_robin" ? row.mode : "default";
  return {
    mode,
    fixedUserId: row.fixed_user_id,
    poolIds: asPool(row.pool_ids),
  };
}

export async function saveLeadRouting(settings: RoutingSettings): Promise<RoutingSettings> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  if (settings.mode === "default") {
    await sql`DELETE FROM lead_routing WHERE id = 'default'`;
    return { mode: "default", fixedUserId: null, poolIds: [] };
  }
  const users = await listUsers();
  const byId = new Map(users.map((user) => [user.id, user]));
  if (settings.mode === "fixed") {
    const user = settings.fixedUserId ? byId.get(settings.fixedUserId) : undefined;
    if (!user || !eligible(user)) throw new Error("invalid_agent");
    await sql`
      INSERT INTO lead_routing (id, mode, fixed_user_id, pool_ids, rr_cursor)
      VALUES ('default', 'fixed', ${user.id}, ${sql.json([])}, 0)
      ON CONFLICT (id) DO UPDATE SET
        mode = 'fixed',
        fixed_user_id = ${user.id},
        pool_ids = ${sql.json([])},
        updated_at = now()
    `;
    return { mode: "fixed", fixedUserId: user.id, poolIds: [] };
  }
  const poolIds = [...new Set(settings.poolIds)].filter((id) => {
    const user = byId.get(id);
    return Boolean(user && eligible(user));
  });
  if (!poolIds.length) throw new Error("invalid_pool");
  await sql`
    INSERT INTO lead_routing (id, mode, fixed_user_id, pool_ids, rr_cursor)
    VALUES ('default', 'round_robin', NULL, ${sql.json(poolIds)}, 0)
    ON CONFLICT (id) DO UPDATE SET
      mode = 'round_robin',
      fixed_user_id = NULL,
      pool_ids = ${sql.json(poolIds)},
      updated_at = now()
  `;
  return { mode: "round_robin", fixedUserId: null, poolIds };
}

async function officeDefault(): Promise<{ name: string; userId: string | null }> {
  const name = assignedAgentName();
  const user = await findUserByName(name).catch(() => null);
  return { name, userId: user?.id ?? null };
}

export async function resolveNewLeadAssignee(): Promise<{ name: string; userId: string | null }> {
  try {
    const sql = await officeDb();
    if (!sql) return { name: assignedAgentName(), userId: null };
    const current = await getLeadRouting();
    if (current.mode === "default") return officeDefault();
    if (current.mode === "fixed") {
      const user = current.fixedUserId ? await findUserById(current.fixedUserId) : null;
      if (!user || !eligible(user)) return officeDefault();
      return { name: user.name, userId: user.id };
    }
    const updated = await sql<RoutingRow[]>`
      UPDATE lead_routing
      SET rr_cursor = rr_cursor + 1, updated_at = now()
      WHERE id = 'default' AND mode = 'round_robin'
      RETURNING rr_cursor, pool_ids, mode, fixed_user_id
    `;
    const row = updated[0];
    if (!row) return officeDefault();
    const users = await listUsers();
    const active = new Set(users.filter(eligible).map((user) => user.id));
    const picked = nextPoolUser(asPool(row.pool_ids), Number(row.rr_cursor) || 0, active);
    const user = picked ? users.find((item) => item.id === picked) : undefined;
    if (!user) return officeDefault();
    return { name: user.name, userId: user.id };
  } catch (error) {
    console.error("[routing] assignee", error instanceof Error ? error.name : "error");
    return { name: assignedAgentName(), userId: null };
  }
}
