import { currentActor } from "@/lib/office-actor";
import { readUserPhoto, saveUserPhoto } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  const photo = await readUserPhoto(id);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(photo.bytes), { headers: { "content-type": photo.contentType, "cache-control": "private, max-age=60" } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  if (actor.user.id !== id && !actor.canManageUsers) {
    return Response.json({ ok: false, message: "You can only change your own photo." }, { status: 403 });
  }
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return Response.json({ ok: false, message: "Choose a photo." }, { status: 400 });
  try {
    await saveUserPhoto(id, file.type || "image/jpeg", Buffer.from(await file.arrayBuffer()));
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Could not store that photo." }, { status: 400 });
  }
}
