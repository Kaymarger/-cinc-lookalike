import { cookies } from "next/headers";
import { BECOME_COOKIE, COOKIE_NAME, agentPassword, passwordMatches, readBecome, readSession } from "@/lib/agent-auth";
import { databaseStatus, leadsDatabaseConfigured, type DatabaseStatus } from "@/lib/leads-db";
import {
  canManageUsers,
  type OfficeRole,
} from "@/lib/office-access";
import { permissionsFor, type OfficePermissions } from "@/lib/office-permissions";
import {
  BOOTSTRAP_EMAIL,
  BOOTSTRAP_ID,
  ensureBootstrapAdmin,
  findUserByEmail,
  findUserById,
  passwordMatchesUser,
  syntheticBootstrap,
  toPublic,
  type OfficeUser,
  type PublicOfficeUser,
} from "@/lib/office-users";

export type Actor = {
  user: OfficeUser;
  publicUser: PublicOfficeUser;
  realUser: PublicOfficeUser;
  database: DatabaseStatus;
  seesAll: boolean;
  canManageUsers: boolean;
  canReassign: boolean;
  canExport: boolean;
  canDelete: boolean;
  canDial: boolean;
  canSendEmail: boolean;
  canSendText: boolean;
  canBecome: boolean;
  impersonating: boolean;
  permissions: OfficePermissions;
};

function actorFrom(
  user: OfficeUser,
  real: OfficeUser,
  database: DatabaseStatus,
  permissions: OfficePermissions,
  manageOverride?: boolean
): Actor {
  const impersonating = user.id !== real.id;
  return {
    user,
    publicUser: toPublic(user),
    realUser: toPublic(real),
    database,
    seesAll: permissions.teamLeader,
    canManageUsers: (manageOverride ?? (canManageUsers(user.role) && database.connected && !impersonating)) && permissions.teamLeader,
    canReassign: permissions.canAssign,
    canExport: permissions.exportLeads,
    canDelete: permissions.editTasks,
    canDial: user.role !== "lender",
    canSendEmail: true,
    canSendText: true,
    canBecome: real.role === "admin" && real.active && database.connected && !impersonating,
    impersonating,
    permissions,
  };
}

export async function currentActor(): Promise<Actor | null> {
  if (!agentPassword()) return null;
  const jar = await cookies();
  const session = await readSession(jar.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const database = leadsDatabaseConfigured()
    ? await databaseStatus()
    : {
        connected: false,
        configured: false,
        message:
          "Database is not connected. In Vercel, open Storage, create a Neon database, then redeploy. Team logins, user profiles, and saved searches need DATABASE_URL or POSTGRES_URL. The office password still signs in the owner.",
      };

  let real: OfficeUser;
  if (session.userId === BOOTSTRAP_ID) {
    if (database.connected) {
      const owner = await ensureBootstrapAdmin(agentPassword()).catch(() => null);
      real = owner ?? syntheticBootstrap();
    } else {
      real = syntheticBootstrap();
    }
  } else if (!database.connected) {
    real = syntheticBootstrap();
  } else {
    const user = await findUserById(session.userId);
    if (!user || !user.active) return null;
    real = user;
  }

  const manageLocked = real.id === BOOTSTRAP_ID || !database.connected;
  const become = await readBecome(jar.get(BECOME_COOKIE)?.value);
  if (become && database.connected && real.role === "admin" && real.active && become.userId !== real.id) {
    const target = await findUserById(become.userId);
    if (target?.active) {
      const permissions = await permissionsFor(target.id, target.role);
      return actorFrom(target, real, database, permissions, false);
    }
  }
  const permissions = await permissionsFor(real.id, real.role);
  return actorFrom(real, real, database, permissions, manageLocked ? false : undefined);
}

export async function loginOffice(
  email: string,
  password: string
): Promise<{ ok: true; userId: string } | { ok: false; reason: "locked" | "bad" | "db" | "invite" }> {
  if (!agentPassword()) return { ok: false, reason: "locked" };
  const trimmed = email.trim().toLowerCase();
  const bootstrapPassword = await passwordMatches(password);
  const blankOrOwner = !trimmed || trimmed === BOOTSTRAP_EMAIL;

  if (blankOrOwner && bootstrapPassword) {
    if (!leadsDatabaseConfigured()) return { ok: true, userId: BOOTSTRAP_ID };
    try {
      const owner = await ensureBootstrapAdmin(password);
      return { ok: true, userId: owner?.id || BOOTSTRAP_ID };
    } catch (error) {
      console.error("[office] bootstrap login", error instanceof Error ? error.name : "error");
      return { ok: true, userId: BOOTSTRAP_ID };
    }
  }

  if (!trimmed) return { ok: false, reason: "bad" };
  if (!leadsDatabaseConfigured()) return { ok: false, reason: "db" };

  try {
    const user = await findUserByEmail(trimmed);
    if (!user || !user.active) return { ok: false, reason: "bad" };
    if (user.mustSetPassword) return { ok: false, reason: "invite" };
    if (!(await passwordMatchesUser(password, user.passwordHash))) return { ok: false, reason: "bad" };
    return { ok: true, userId: user.id };
  } catch (error) {
    console.error("[office] email login", error instanceof Error ? error.name : "error");
    return { ok: false, reason: "db" };
  }
}

export function roleOf(user: OfficeUser): OfficeRole {
  return user.role;
}
