import { publicOrigin } from "@/lib/office-mail";
import { currentActor } from "@/lib/office-actor";
import { deliverAccessLink } from "@/lib/office-tokens";
import { findUserById } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  }
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { kind?: unknown } | null;
  const kind = body?.kind === "invite" ? "invite" : body?.kind === "reset" ? "reset" : null;
  if (!kind) return Response.json({ ok: false, message: "Choose a reset link or an invite link." }, { status: 400 });
  const selfReset = kind === "reset" && actor.user.id === id && !actor.impersonating;
  if (!actor.canManageUsers && !selfReset) {
    return Response.json({ ok: false, message: "Only an admin or broker can create these links." }, { status: 403 });
  }
  const user = await findUserById(id);
  if (!user) return Response.json({ ok: false, message: "That user was not found." }, { status: 404 });
  if (!user.active) {
    return Response.json({ ok: false, message: "Turn the user back on before sending a link." }, { status: 400 });
  }
  try {
    const link = await deliverAccessLink(user, kind, publicOrigin(request));
    return Response.json({
      ok: true,
      url: link.url,
      emailed: link.emailed,
      kind,
      message: link.emailed
        ? "The link was emailed and is copied below."
        : "Email is not configured. Copy this link and send it yourself.",
    });
  } catch (error) {
    console.error("[office] link", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Could not create that link." }, { status: 500 });
  }
}
