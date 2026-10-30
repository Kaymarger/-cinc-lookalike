import { currentActor } from "@/lib/office-actor";
import { deleteAutoTrack, listAutoTracks, saveAutoTrack } from "@/lib/autotracks-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  try {
    const track = await saveAutoTrack({ ...(body ?? {}), id });
    return Response.json({ ok: true, track });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save that AutoTrack.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  await deleteAutoTrack(id);
  const data = await listAutoTracks();
  return Response.json({ ok: true, ...data });
}
