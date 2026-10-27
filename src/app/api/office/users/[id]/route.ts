import { isOfficeRole } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";
import { toPublic, updateUser, type UserDraft } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.database.connected) {
    return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  }
  const { id } = await context.params;
  const self = actor.user.id === id;
  if (!self && !actor.canManageUsers) {
    return Response.json({ ok: false, message: "You can only edit your own profile." }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, message: "Nothing to save." }, { status: 400 });

  const draft: Partial<UserDraft> = {};
  const text: [keyof UserDraft, string][] = [
    ["firstName", "firstName"],
    ["lastName", "lastName"],
    ["cell", "cell"],
    ["home", "home"],
    ["office", "office"],
    ["title", "title"],
    ["license", "license"],
    ["loan", "loan"],
    ["bio", "bio"],
    ["signature", "signature"],
    ["subdomain", "subdomain"],
    ["facebook", "facebook"],
    ["google", "google"],
    ["pinterest", "pinterest"],
    ["twitter", "twitter"],
    ["instagram", "instagram"],
    ["youtube", "youtube"],
    ["linkedin", "linkedin"],
    ["email", "email"],
  ];
  for (const [field, key] of text) {
    if (typeof body[key] === "string") (draft as Record<string, string>)[field] = body[key] as string;
  }
  if (typeof body.password === "string" && body.password) draft.password = body.password;
  if (actor.canManageUsers) {
    if (typeof body.role === "string") {
      if (!isOfficeRole(body.role)) {
        return Response.json({ ok: false, message: "Choose Admin, Broker, Agent, ISA, or Lender." }, { status: 400 });
      }
      draft.role = body.role;
    }
    if (typeof body.active === "boolean") draft.active = body.active;
  }

  try {
    const user = await updateUser(id, draft);
    if (!user) return Response.json({ ok: false, message: "That user was not found." }, { status: 404 });
    return Response.json({ ok: true, user: toPublic(user) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "last_admin") {
      return Response.json({ ok: false, message: "The office needs at least one active admin." }, { status: 400 });
    }
    if (code === "password_short") {
      return Response.json({ ok: false, message: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (code === "email_invalid") {
      return Response.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
    }
    const pg = error as { code?: string };
    if (pg.code === "23505") {
      return Response.json({ ok: false, message: "That email is already a user." }, { status: 409 });
    }
    console.error("[office] update user", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Could not save that profile." }, { status: 500 });
  }
}
