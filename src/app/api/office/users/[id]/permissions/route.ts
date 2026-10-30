import { isOfficeRole } from "@/lib/office-access";
import { currentActor } from "@/lib/office-actor";
import { permissionsFor, savePermissions } from "@/lib/office-permissions";
import { PERMISSION_OPTIONS, type PermissionKey } from "@/lib/permission-options";
import { findUserById } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const { id } = await context.params;
  if (id !== actor.user.id && !actor.canManageUsers) {
    return Response.json({ ok: false, message: "You cannot view those permissions." }, { status: 403 });
  }
  const user = id === actor.user.id ? actor.user : await findUserById(id);
  if (!user) return Response.json({ ok: false, message: "That user was not found." }, { status: 404 });
  return Response.json({ ok: true, permissions: await permissionsFor(user.id, user.role), options: PERMISSION_OPTIONS });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  if (!actor.canManageUsers) return Response.json({ ok: false, message: "Your role cannot edit permissions." }, { status: 403 });
  if (!actor.database.connected) return Response.json({ ok: false, message: actor.database.message }, { status: 409 });
  const { id } = await context.params;
  const user = await findUserById(id);
  if (!user) return Response.json({ ok: false, message: "That user was not found." }, { status: 404 });
  if (!isOfficeRole(user.role)) return Response.json({ ok: false, message: "That role cannot be updated." }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { permissions?: Record<string, boolean> } | null;
  const flags: Partial<Record<PermissionKey, boolean>> = {};
  for (const [key] of PERMISSION_OPTIONS) {
    if (typeof body?.permissions?.[key] === "boolean") flags[key] = body.permissions[key];
  }
  const permissions = await savePermissions(user.id, user.role, flags);
  return Response.json({ ok: true, permissions });
}
