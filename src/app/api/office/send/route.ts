import { currentActor } from "@/lib/office-actor";
import { channelStatus } from "@/lib/office-mail";
import { recordSend } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  return Response.json({ ok: true, channels: channelStatus() });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { channel?: string; to?: string; subject?: string; body?: string; autotrackId?: string } | null;
  const channel = body?.channel;
  if (channel !== "email" && channel !== "sms" && channel !== "voice") {
    return Response.json({ ok: false, message: "Choose email, text, or call." }, { status: 400 });
  }
  const result = await recordSend({
    channel,
    to: String(body?.to ?? ""),
    subject: body?.subject,
    body: String(body?.body ?? ""),
    autotrackId: body?.autotrackId,
  });
  if (!result.ok) return Response.json({ ok: false, connected: result.status !== 409, message: result.message }, { status: result.status });
  return Response.json({ ok: true, id: result.id });
}
