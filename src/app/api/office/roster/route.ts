import { currentActor } from "@/lib/office-actor";
import { listUsers } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) {
    return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  }
  if (!actor.database.connected) {
    return Response.json({ ok: true, users: [], database: actor.database });
  }
  const users = await listUsers();
  return Response.json({
    ok: true,
    database: actor.database,
    users: users
      .filter((user) => user.active)
      .map((user) => ({ id: user.id, name: user.name, role: user.role, email: user.email })),
  });
}
