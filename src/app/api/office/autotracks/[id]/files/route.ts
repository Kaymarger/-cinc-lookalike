import { currentActor } from "@/lib/office-actor";
import { saveAutoTrackFile } from "@/lib/autotracks-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const stepId = String(form?.get("stepId") ?? "");
  if (!(file instanceof File) || !stepId) {
    return Response.json({ ok: false, message: "Choose a file to attach." }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await saveAutoTrackFile({
      trackId: id,
      stepId,
      name: file.name,
      contentType: file.type || "application/octet-stream",
      bytes,
    });
    return Response.json({ ok: true, file: saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not store that attachment.";
    return Response.json({ ok: false, message }, { status: 400 });
  }
}
