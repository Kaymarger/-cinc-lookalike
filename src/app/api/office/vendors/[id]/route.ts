import { currentActor } from "@/lib/office-actor";
import { deleteVendor, saveVendor } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  try {
    const vendor = await saveVendor(body, id);
    return Response.json({ ok: true, vendor });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Could not save that vendor." }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  await deleteVendor(id);
  return Response.json({ ok: true });
}
