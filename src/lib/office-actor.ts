import { cookies } from "next/headers";
import { COOKIE_NAME, agentPassword, passwordMatches, readSession } from "@/lib/agent-auth";
import { databaseStatus, leadsDatabaseConfigured, type DatabaseStatus } from "@/lib/leads-db";
import {
  canManageUsers,
  canReassignLeads,
  seesAllLeads,
  type OfficeRole,
} from "@/lib/office-access";
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
  database: DatabaseStatus;
  seesAll: boolean;
  canManageUsers: boolean;
  canReassign: boolean;
};

function actorFrom(user: OfficeUser, database: DatabaseStatus, manageOverride?: boolean): Actor {
  return {
    user,
    publicUser: toPublic(user),
    database,
    seesAll: seesAllLeads(user.role),
    canManageUsers: manageOverride ?? (canManageUsers(user.role) && database.connected),
    canReassign: canReassignLeads(user.role),
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

  if (session.userId === BOOTSTRAP_ID) {
    if (database.connected) {
      const owner = await ensureBootstrapAdmin(agentPassword()).catch(() => null);
      if (owner) return actorFrom(owner, database);
    }
    return actorFrom(syntheticBootstrap(), database, false);
  }

  if (!database.connected) return actorFrom(syntheticBootstrap(), database, false);
  const user = await findUserById(session.userId);
  if (!user || !user.active) return null;
  return actorFrom(user, database);
}

export async function loginOffice(
  email: string,
  password: string
): Promise<{ ok: true; userId: string } | { ok: false; reason: "locked" | "bad" | "db" }> {
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
