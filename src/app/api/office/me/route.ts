import { currentActor } from "@/lib/office-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) {
    return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  }
  return Response.json({
    ok: true,
    user: actor.publicUser,
    database: actor.database,
    seesAll: actor.seesAll,
    canManageUsers: actor.canManageUsers,
    canReassign: actor.canReassign,
    canBecome: actor.canBecome,
    impersonating: actor.impersonating,
  });
}
