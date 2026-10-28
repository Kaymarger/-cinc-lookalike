import { createHash, randomBytes } from "node:crypto";
import { officeDb } from "@/lib/leads-db";
import { inviteEmail, resetEmail, sendOfficeMail } from "@/lib/office-mail";
import { hashPassword } from "@/lib/password-hash";
import type { OfficeUser } from "@/lib/office-users";

export type AccessKind = "reset" | "invite";

const TTL_MS: Record<AccessKind, number> = {
  reset: 60 * 60 * 1000,
  invite: 7 * 24 * 60 * 60 * 1000,
};

type TokenRow = {
  id: string;
  user_id: string;
  kind: string;
};

export function hashAccessToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function accessUrl(origin: string, raw: string): string {
  return `${origin.replace(/\/$/, "")}/agent/reset?token=${encodeURIComponent(raw)}`;
}

export async function issueAccessToken(userId: string, kind: AccessKind): Promise<string> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const raw = randomBytes(32).toString("base64url");
  const tokenHash = hashAccessToken(raw);
  const expires = new Date(Date.now() + TTL_MS[kind]).toISOString();
  await sql`
    UPDATE office_access_tokens
    SET used_at = now()
    WHERE user_id = ${userId} AND kind = ${kind} AND used_at IS NULL
  `;
  await sql`
    INSERT INTO office_access_tokens (id, user_id, token_hash, kind, expires_at)
    VALUES (${crypto.randomUUID()}, ${userId}, ${tokenHash}, ${kind}, ${expires})
  `;
  return raw;
}

export async function deliverAccessLink(
  user: OfficeUser,
  kind: AccessKind,
  origin: string
): Promise<{ url: string; emailed: boolean }> {
  const raw = await issueAccessToken(user.id, kind);
  const url = accessUrl(origin, raw);
  const mail = kind === "invite" ? inviteEmail(user.name, url) : resetEmail(user.name, url);
  const sent = await sendOfficeMail(user.email, mail.subject, mail.text);
  return { url, emailed: sent === "sent" };
}

export async function consumeAccessToken(
  raw: string,
  password: string
): Promise<{ ok: true; userId: string } | { ok: false; reason: "bad" | "inactive" | "short" | "db" }> {
  if (!raw || raw.length < 20 || raw.length > 200) return { ok: false, reason: "bad" };
  if (password.length < 8) return { ok: false, reason: "short" };
  const sql = await officeDb();
  if (!sql) return { ok: false, reason: "db" };
  const tokenHash = hashAccessToken(raw);
  const passwordHash = await hashPassword(password);
  try {
    const userId = await sql.begin(async (tx) => {
      const rows = await tx<TokenRow[]>`
        UPDATE office_access_tokens
        SET used_at = now()
        WHERE token_hash = ${tokenHash}
          AND used_at IS NULL
          AND expires_at > now()
        RETURNING id, user_id, kind
      `;
      const token = rows[0];
      if (!token || (token.kind !== "reset" && token.kind !== "invite")) {
        throw new Error("bad");
      }
      const updated = await tx<{ id: string }[]>`
        UPDATE office_users
        SET password_hash = ${passwordHash}, must_set_password = false, updated_at = now()
        WHERE id = ${token.user_id} AND active = true
        RETURNING id
      `;
      if (!updated[0]) throw new Error("inactive");
      await tx`
        UPDATE office_access_tokens
        SET used_at = now()
        WHERE user_id = ${token.user_id} AND used_at IS NULL
      `;
      return updated[0].id;
    });
    return { ok: true, userId };
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "inactive") return { ok: false, reason: "inactive" };
    if (code === "bad" || code === "password_short") return { ok: false, reason: code === "password_short" ? "short" : "bad" };
    if (code === "database_unconfigured") return { ok: false, reason: "db" };
    console.error("[office] consume token", error instanceof Error ? error.name : "error");
    return { ok: false, reason: "bad" };
  }
}
