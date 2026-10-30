import { deleteCapturedLead } from "@/lib/leads-db";
import { currentActor } from "@/lib/office-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (actor.user.role !== "admin" && actor.user.role !== "broker") {
    return Response.json({ ok: false, message: "Only an admin can delete a lead." }, { status: 403 });
  }
  const { id } = await context.params;
  const removed = await deleteCapturedLead(id);
  return Response.json({ ok: true, removed });
}
