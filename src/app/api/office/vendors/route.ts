import { currentActor } from "@/lib/office-actor";
import { listVendors, saveVendor } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  return Response.json({ ok: true, vendors: await listVendors() });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const body = await request.json().catch(() => null);
  try {
    const vendor = await saveVendor(body);
    return Response.json({ ok: true, vendor });
  } catch (error) {
    return Response.json({ ok: false, message: error instanceof Error ? error.message : "Could not save that vendor." }, { status: 400 });
  }
}
