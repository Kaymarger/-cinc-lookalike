import { NextResponse } from "next/server";
import { BECOME_COOKIE, BECOME_MAX_AGE, cookieBase, signBecome } from "@/lib/agent-auth";
import { currentActor } from "@/lib/office-actor";
import { findUserById } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function secureOf(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return NextResponse.json({ ok: false, message: actor.database.message }, { status: 409 });
  }
  if (actor.realUser.role !== "admin" || !actor.realUser.active) {
    return NextResponse.json({ ok: false, message: "Only an admin can view the office as another user." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { userId?: unknown } | null;
  const userId = String(body?.userId ?? "");
  if (!userId || userId === actor.realUser.id) {
    return NextResponse.json({ ok: false, message: "Choose a different user." }, { status: 400 });
  }
  const target = await findUserById(userId);
  if (!target || !target.active) {
    return NextResponse.json({ ok: false, message: "That user is not an active office user." }, { status: 404 });
  }
  const response = NextResponse.json({ ok: true, userId: target.id, name: target.name });
  response.cookies.set(BECOME_COOKIE, await signBecome(target.id), cookieBase(secureOf(request), BECOME_MAX_AGE));
  return response;
}

export async function DELETE(request: Request) {
  const actor = await currentActor();
  if (!actor) return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(BECOME_COOKIE, "", cookieBase(secureOf(request), 0));
  return response;
}
