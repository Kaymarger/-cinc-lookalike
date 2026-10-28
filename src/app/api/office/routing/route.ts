import { getLeadRouting, saveLeadRouting, type RoutingMode } from "@/lib/lead-routing";
import { currentActor } from "@/lib/office-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isMode(value: string): value is RoutingMode {
  return value === "default" || value === "fixed" || value === "round_robin";
}

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.canManageUsers) {
    return Response.json({ ok: false, message: "Only an admin or broker can view lead routing." }, { status: 403 });
  }
  if (!actor.database.connected) {
    return Response.json({ ok: true, routing: { mode: "default", fixedUserId: null, poolIds: [] }, database: actor.database });
  }
  const routing = await getLeadRouting();
  return Response.json({ ok: true, routing, database: actor.database });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  }
  if (!actor.canManageUsers) {
    return Response.json({ ok: false, message: "Only an admin or broker can change lead routing." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    mode?: unknown;
    fixedUserId?: unknown;
    poolIds?: unknown;
  } | null;
  const mode = String(body?.mode ?? "");
  if (!isMode(mode)) {
    return Response.json({ ok: false, message: "Choose a routing mode." }, { status: 400 });
  }
  const poolIds = Array.isArray(body?.poolIds) ? body.poolIds.filter((id): id is string => typeof id === "string") : [];
  try {
    const routing = await saveLeadRouting({
      mode,
      fixedUserId: typeof body?.fixedUserId === "string" ? body.fixedUserId : null,
      poolIds,
    });
    return Response.json({ ok: true, routing });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "invalid_agent") {
      return Response.json({ ok: false, message: "Choose an active admin, broker, agent, or ISA." }, { status: 400 });
    }
    if (code === "invalid_pool") {
      return Response.json({ ok: false, message: "Pick at least one active person for the round robin." }, { status: 400 });
    }
    if (code === "database_unconfigured") {
      return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
    }
    console.error("[routing] save", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Could not save lead routing." }, { status: 500 });
  }
}
