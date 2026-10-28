import { currentActor } from "@/lib/office-actor";
import { readPreferences, writePreferences } from "@/lib/office-preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected || actor.user.id === "bootstrap") {
    return Response.json({ ok: true, preferences: {}, database: actor.database });
  }
  const preferences = await readPreferences(actor.user.id);
  return Response.json({ ok: true, preferences, database: actor.database });
}

export async function PATCH(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected || actor.user.id === "bootstrap") {
    return Response.json({ ok: false, message: actor.database.message || "Connect the database before saving settings." }, { status: 409 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, message: "Nothing to save." }, { status: 400 });
  }
  const current = await readPreferences(actor.user.id);
  const next = { ...current, ...body };
  await writePreferences(actor.user.id, next);
  return Response.json({ ok: true, preferences: next });
}
