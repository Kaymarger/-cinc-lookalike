import { getLead, leadsDatabaseConfigured } from "@/lib/leads-db";
import { insertSearch, listSearchesForLead } from "@/lib/lead-searches-db";
import { leadVisibleTo, sanitizeSavedSearch } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function gate(leadId: string) {
  const actor = await currentActor();
  if (!actor) return { error: Response.json({ ok: false, message: "Sign in required." }, { status: 401 }) };
  if (!leadsDatabaseConfigured() || !actor.database.connected) {
    return {
      error: Response.json({ ok: false, message: actor.database.message, searches: [] }, { status: 409 }),
    };
  }
  const lead = await getLead(leadId);
  if (lead && !leadVisibleTo(actor.user, lead)) {
    return { error: Response.json({ ok: false, message: "That lead is not on your list." }, { status: 404 }) };
  }
  return { actor, lead };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gated = await gate(id);
  if ("error" in gated && gated.error) return gated.error;
  const searches = await listSearchesForLead(id);
  return Response.json({ ok: true, searches });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const gated = await gate(id);
  if ("error" in gated && gated.error) return gated.error;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, message: "Enter the search criteria." }, { status: 400 });
  const email = String(body.leadEmail || gated.lead?.email || "").trim().toLowerCase();
  const parsed = sanitizeSavedSearch({ ...body, leadEmail: email });
  if (!parsed.ok) return Response.json({ ok: false, message: parsed.message }, { status: 400 });
  if (!parsed.value.leadEmail) {
    return Response.json({ ok: false, message: "This lead needs an email before a saved search can be created." }, { status: 400 });
  }
  try {
    const search = await insertSearch(id, parsed.value);
    return Response.json({ ok: true, search });
  } catch (error) {
    console.error("[searches] create", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Could not save that search." }, { status: 500 });
  }
}
