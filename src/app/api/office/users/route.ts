import { isOfficeRole } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";
import { createUser, listUsers, toPublic, type UserDraft } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function draftFrom(body: Record<string, unknown>): UserDraft | { error: string } {
  const role = String(body.role ?? "agent");
  if (!isOfficeRole(role)) return { error: "Choose Admin, Broker, Agent, ISA, or Lender." };
  return {
    email: String(body.email ?? ""),
    password: body.password == null ? undefined : String(body.password),
    role,
    firstName: String(body.firstName ?? ""),
    lastName: String(body.lastName ?? ""),
    cell: String(body.cell ?? ""),
    home: String(body.home ?? ""),
    office: String(body.office ?? ""),
    title: String(body.title ?? ""),
    license: String(body.license ?? ""),
    loan: String(body.loan ?? ""),
    bio: String(body.bio ?? ""),
    signature: String(body.signature ?? ""),
    subdomain: String(body.subdomain ?? ""),
    facebook: String(body.facebook ?? ""),
    google: String(body.google ?? ""),
    pinterest: String(body.pinterest ?? ""),
    twitter: String(body.twitter ?? ""),
    instagram: String(body.instagram ?? ""),
    youtube: String(body.youtube ?? ""),
    linkedin: String(body.linkedin ?? ""),
    active: body.active === undefined ? true : Boolean(body.active),
  };
}

export async function GET() {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return Response.json({
      ok: true,
      users: actor.canManageUsers ? [] : [],
      database: actor.database,
      canManageUsers: false,
    });
  }
  if (!actor.canManageUsers) {
    return Response.json({ ok: false, message: "Only an admin or broker can manage users." }, { status: 403 });
  }
  const users = await listUsers();
  return Response.json({
    ok: true,
    database: actor.database,
    canManageUsers: true,
    users: users.map(toPublic),
  });
}

export async function POST(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  }
  if (!actor.canManageUsers) {
    return Response.json({ ok: false, message: "Only an admin or broker can add users." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, message: "Enter the new user." }, { status: 400 });
  const draft = draftFrom(body);
  if ("error" in draft) return Response.json({ ok: false, message: draft.error }, { status: 400 });
  if (!draft.firstName && !draft.lastName) {
    return Response.json({ ok: false, message: "Enter a first or last name." }, { status: 400 });
  }
  try {
    const user = await createUser(draft);
    return Response.json({ ok: true, user: toPublic(user) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "password_short") {
      return Response.json({ ok: false, message: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (code === "email_invalid") {
      return Response.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
    }
    if (code === "database_unconfigured") {
      return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
    }
    const pg = error as { code?: string };
    if (pg.code === "23505") {
      return Response.json({ ok: false, message: "That email is already a user." }, { status: 409 });
    }
    console.error("[office] create user", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Could not add that user." }, { status: 500 });
  }
}
