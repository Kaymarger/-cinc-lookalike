import { assignCapturedLead, getLead } from "@/lib/leads-db";
import { leadVisibleTo } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";
import { resolveNewLeadAssignee } from "@/lib/lead-routing";
import { findUserByName, listUsers } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  return text || "Unassigned";
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.canReassign) {
    return Response.json({ ok: false, message: "Your role cannot reassign leads." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: unknown;
    agent?: unknown;
    partner?: unknown;
    listing?: unknown;
  } | null;
  const id = String(body?.id ?? "").slice(0, 80);
  if (!id) return Response.json({ ok: false, message: "Missing lead." }, { status: 400 });

  const existing = actor.database.connected ? await getLead(id) : null;
  if (existing && !leadVisibleTo(actor.user, existing)) {
    return Response.json({ ok: false, message: "That lead is not on your list." }, { status: 404 });
  }
  if (!actor.database.connected) {
    return Response.json({
      ok: true,
      persisted: false,
      message: actor.database.message,
    });
  }

  let agent = clean(body?.agent);
  const routed = agent === "Routing Engine";
  if (routed) {
    const assignee = await resolveNewLeadAssignee();
    agent = assignee.name || "Unassigned";
  }
  const partner = clean(body?.partner);
  const listing = clean(body?.listing);
  const users = await listUsers().catch(() => []);
  const agentUser = users.find((user) => user.name.toLowerCase() === agent.toLowerCase()) ?? (await findUserByName(agent));
  const partnerUser = users.find((user) => user.name.toLowerCase() === partner.toLowerCase()) ?? null;

  const saved = await assignCapturedLead(id, {
    agent,
    agentUserId: agent === "Unassigned" || agent === "Routing Engine" ? null : agentUser?.id ?? null,
    partner,
    partnerUserId: partner === "Unassigned" ? null : partnerUser?.id ?? null,
    listing,
  });
  if (!saved) {
    return Response.json({ ok: true, persisted: false, agent, routed, message: routed ? `Routed to ${agent}.` : "Sample lead updated on this device." });
  }
  return Response.json({ ok: true, persisted: true, agent, routed, lead: saved });
}
