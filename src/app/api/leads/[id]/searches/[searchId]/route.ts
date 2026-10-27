import { getLead, leadsDatabaseConfigured } from "@/lib/leads-db";
import { deleteSearch, updateSearch } from "@/lib/lead-searches-db";
import { leadVisibleTo, sanitizeSavedSearch } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate(leadId: string) {
  const actor = await currentActor();
  if (!actor) return { error: Response.json({ ok: false, message: "Sign in required." }, { status: 401 }) };
  if (!leadsDatabaseConfigured() || !actor.database.connected) {
    return { error: Response.json({ ok: false, message: actor.database.message }, { status: 409 }) };
  }
  const lead = await getLead(leadId);
  if (lead && !leadVisibleTo(actor.user, lead)) {
    return { error: Response.json({ ok: false, message: "That lead is not on your list." }, { status: 404 }) };
  }
  return { lead };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; searchId: string }> }
) {
  const { id, searchId } = await context.params;
  const gated = await gate(id);
  if ("error" in gated && gated.error) return gated.error;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, message: "Enter the search criteria." }, { status: 400 });
  const email = String(body.leadEmail || gated.lead?.email || "").trim().toLowerCase();
  const parsed = sanitizeSavedSearch({ ...body, leadEmail: email });
  if (!parsed.ok) return Response.json({ ok: false, message: parsed.message }, { status: 400 });
  const search = await updateSearch(id, searchId, parsed.value);
  if (!search) return Response.json({ ok: false, message: "That saved search was not found." }, { status: 404 });
  return Response.json({ ok: true, search });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; searchId: string }> }
) {
  const { id, searchId } = await context.params;
  const gated = await gate(id);
  if ("error" in gated && gated.error) return gated.error;
  const removed = await deleteSearch(id, searchId);
  if (!removed) return Response.json({ ok: false, message: "That saved search was not found." }, { status: 404 });
  return Response.json({ ok: true });
}
