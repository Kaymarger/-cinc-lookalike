import { currentActor } from "@/lib/office-actor";
import { duplicateAutoTrack } from "@/lib/autotracks-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  try {
    const track = await duplicateAutoTrack(id);
    return Response.json({ ok: true, track });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not duplicate that AutoTrack.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}
