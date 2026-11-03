import { currentActor } from "@/lib/office-actor";
import { listOfficeAlerts } from "@/lib/notify-lead";
import { alertInbox, channelStatus, sendOfficeMail } from "@/lib/office-mail";
import { officeDb } from "@/lib/leads-db";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const alerts = await listOfficeAlerts();
  const channels = channelStatus();
  return Response.json({
    ok: true,
    alerts,
    channels,
    alertEmail: actor.user.role === "admin" || actor.user.role === "broker" ? alertInbox() : null,
    agentEmail: actor.user.email,
  });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { kind?: string; email?: boolean } | null;
  const kind = String(body?.kind || "Test").slice(0, 80);
  const title = `Test: ${kind}`;
  const text = `${kind} for ${actor.user.name}. This stayed in the office alert list.`;
  const sql = await officeDb();
  if (sql) {
    await sql`
      INSERT INTO office_notifications (id, kind, title, body)
      VALUES (${`note-${randomUUID().slice(0, 8)}`}, ${kind}, ${title}, ${text})
    `;
  }
  let email: "sent" | "skipped" | "failed" = "skipped";
  if (body?.email) {
    const to = kind === "New Leads" ? alertInbox() || "" : actor.user.email;
    if (kind === "New Leads" && !to) email = "skipped";
    else email = await sendOfficeMail(to, title, text);
  }
  return Response.json({
    ok: true,
    email,
    text: "skipped",
    message: kind === "New Leads"
      ? "New-lead tests can email the office alert mailbox. They are not texted."
      : "The test is in the office alert list. Agent alerts are not texted.",
  });
}
