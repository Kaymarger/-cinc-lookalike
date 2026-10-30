import { currentActor } from "@/lib/office-actor";
import { listAutoTracks, saveAutoTrack } from "@/lib/autotracks-db";
import { statsByTrack } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function dbDown(actor: { database: { connected: boolean; message: string } }) {
  if (actor.database.connected) return null;
  return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
}

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const blocked = dbDown(actor);
  if (blocked) return blocked;
  const data = await listAutoTracks();
  const stats = await statsByTrack();
  return Response.json({ ok: true, ...data, stats });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const blocked = dbDown(actor);
  if (blocked) return blocked;
  const body = await request.json().catch(() => null);
  try {
    const track = await saveAutoTrack(body);
    return Response.json({ ok: true, track });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that AutoTrack.";
    const status = message === "database_unconfigured" ? 409 : 400;
    return Response.json({ ok: false, message: message === "database_unconfigured" ? actor.database.message : message }, { status });
  }
}
