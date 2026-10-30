import { currentActor } from "@/lib/office-actor";
import { readSettings, writeSettings } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  return Response.json({ ok: true, settings: await readSettings(), database: actor.database });
}

export async function PUT(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const body = await request.json().catch(() => null);
  try {
    const settings = await writeSettings(body);
    return Response.json({ ok: true, settings });
  } catch (error) {
    const message = error instanceof Error && error.message === "database_unconfigured" ? actor.database.message : "Could not save settings.";
    return Response.json({ ok: false, message }, { status: 409 });
  }
}
