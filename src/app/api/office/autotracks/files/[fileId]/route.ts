import { currentActor } from "@/lib/office-actor";
import { deleteAutoTrackFile, readAutoTrackFile } from "@/lib/autotracks-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const { fileId } = await context.params;
  const found = await readAutoTrackFile(fileId);
  if (!found) return Response.json({ ok: false, message: "That attachment is gone." }, { status: 404 });
  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "content-type": found.file.contentType,
      "content-disposition": `inline; filename="${found.file.name.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=60",
    },
  });
}

export async function DELETE(_request: Request, context: { params: Promise<{ fileId: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const { fileId } = await context.params;
  const removed = await deleteAutoTrackFile(fileId);
  if (!removed) return Response.json({ ok: false, message: "That attachment is gone." }, { status: 404 });
  return Response.json({ ok: true });
}
