import { SITE } from "@/lib/site";
import { officeDb } from "@/lib/leads-db";
import {
  canonicalName,
  isOfficeRole,
  roleLabel,
  type OfficeRole,
} from "@/lib/office-access";
import { hashPassword, verifyPassword } from "@/lib/password-hash";

export const BOOTSTRAP_ID = "bootstrap";
export const BOOTSTRAP_EMAIL = SITE.email;

export type OfficeUser = {
  id: string;
  email: string;
  role: OfficeRole;
  firstName: string;
  lastName: string;
  name: string;
  cell: string;
  home: string;
  office: string;
  title: string;
  license: string;
  loan: string;
  bio: string;
  signature: string;
  subdomain: string;
  facebook: string;
  google: string;
  pinterest: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  active: boolean;
  bootstrap: boolean;
};

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  role: string;
  first_name: string;
  last_name: string;
  cell: string;
  home_phone: string;
  office_phone: string;
  title: string;
  license_number: string;
  loan_url: string;
  bio: string;
  signature: string;
  subdomain: string;
  facebook: string;
  google: string;
  pinterest: string;
  twitter: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  active: boolean;
  bootstrap: boolean;
};

export type PublicOfficeUser = Omit<OfficeUser, never> & { roleLabel: string };

export function displayName(first: string, last: string, email = ""): string {
  const name = `${first} ${last}`.trim().replace(/\s+/g, " ");
  return name || email;
}

export function toPublic(user: OfficeUser): PublicOfficeUser {
  return { ...user, roleLabel: roleLabel(user.role) };
}

function fromRow(row: UserRow): OfficeUser {
  const role = isOfficeRole(row.role) ? row.role : "agent";
  return {
    id: row.id,
    email: row.email,
    role,
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    name: displayName(row.first_name || "", row.last_name || "", row.email),
    cell: row.cell || "",
    home: row.home_phone || "",
    office: row.office_phone || "",
    title: row.title || "",
    license: row.license_number || "",
    loan: row.loan_url || "",
    bio: row.bio || "",
    signature: row.signature || "",
    subdomain: row.subdomain || "",
    facebook: row.facebook || "",
    google: row.google || "",
    pinterest: row.pinterest || "",
    twitter: row.twitter || "",
    instagram: row.instagram || "",
    youtube: row.youtube || "",
    linkedin: row.linkedin || "",
    active: Boolean(row.active),
    bootstrap: Boolean(row.bootstrap),
  };
}

export function syntheticBootstrap(): OfficeUser {
  return {
    id: BOOTSTRAP_ID,
    email: BOOTSTRAP_EMAIL,
    role: "admin",
    firstName: "Casey",
    lastName: "Archibald",
    name: SITE.agent,
    cell: SITE.phoneDisplay,
    home: "",
    office: SITE.phoneDisplay,
    title: "Owner",
    license: "",
    loan: "",
    bio: "",
    signature: `${SITE.agent}\n${SITE.company}\n${SITE.phoneDisplay}`,
    subdomain: "",
    facebook: "",
    google: "",
    pinterest: "",
    twitter: "",
    instagram: "",
    youtube: "",
    linkedin: "",
    active: true,
    bootstrap: true,
  };
}

export async function ensureBootstrapAdmin(password: string): Promise<OfficeUser | null> {
  const sql = await officeDb();
  if (!sql || !password) return null;
  const existing = await sql<UserRow[]>`
    SELECT * FROM office_users
    WHERE bootstrap = true OR lower(email) = ${BOOTSTRAP_EMAIL}
    ORDER BY bootstrap DESC
    LIMIT 1
  `;
  if (existing[0]) return fromRow(existing[0]);
  const hash = await hashPassword(password);
  const id = crypto.randomUUID();
  const owner = syntheticBootstrap();
  const rows = await sql<UserRow[]>`
    INSERT INTO office_users (
      id, email, password_hash, role, first_name, last_name, cell, home_phone, office_phone,
      title, signature, active, bootstrap
    ) VALUES (
      ${id},
      ${owner.email},
      ${hash},
      'admin',
      ${owner.firstName},
      ${owner.lastName},
      ${owner.cell},
      '',
      ${owner.office},
      ${owner.title},
      ${owner.signature},
      true,
      true
    )
    RETURNING *
  `;
  return fromRow(rows[0]);
}

export async function findUserById(id: string): Promise<OfficeUser | null> {
  const sql = await officeDb();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT * FROM office_users WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function findUserByEmail(email: string): Promise<(OfficeUser & { passwordHash: string }) | null> {
  const sql = await officeDb();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT * FROM office_users WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1
  `;
  if (!rows[0]) return null;
  return { ...fromRow(rows[0]), passwordHash: rows[0].password_hash };
}

export async function findUserByName(name: string): Promise<OfficeUser | null> {
  const users = await listUsers();
  const target = canonicalName(name);
  return users.find((user) => canonicalName(user.name) === target) ?? null;
}

export async function listUsers(): Promise<OfficeUser[]> {
  const sql = await officeDb();
  if (!sql) return [];
  const rows = await sql<UserRow[]>`
    SELECT * FROM office_users ORDER BY first_name, last_name, email
  `;
  return rows.map(fromRow);
}

export async function countActiveAdmins(exceptId?: string): Promise<number> {
  const users = await listUsers();
  return users.filter((user) => user.role === "admin" && user.active && user.id !== exceptId).length;
}

export type UserDraft = {
  email: string;
  password?: string;
  role: OfficeRole;
  firstName: string;
  lastName: string;
  cell?: string;
  home?: string;
  office?: string;
  title?: string;
  license?: string;
  loan?: string;
  bio?: string;
  signature?: string;
  subdomain?: string;
  facebook?: string;
  google?: string;
  pinterest?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  active?: boolean;
};

function clean(value: string | undefined, max = 240): string {
  return (value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export async function createUser(draft: UserDraft): Promise<OfficeUser> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  if (!draft.password || draft.password.length < 8) throw new Error("password_short");
  const email = draft.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("email_invalid");
  const hash = await hashPassword(draft.password);
  const rows = await sql<UserRow[]>`
    INSERT INTO office_users (
      id, email, password_hash, role, first_name, last_name, cell, home_phone, office_phone,
      title, license_number, loan_url, bio, signature, subdomain, facebook, google, pinterest,
      twitter, instagram, youtube, linkedin, active, bootstrap
    ) VALUES (
      ${crypto.randomUUID()},
      ${email},
      ${hash},
      ${draft.role},
      ${clean(draft.firstName, 80)},
      ${clean(draft.lastName, 80)},
      ${clean(draft.cell, 40)},
      ${clean(draft.home, 40)},
      ${clean(draft.office, 40)},
      ${clean(draft.title, 80)},
      ${clean(draft.license, 40)},
      ${clean(draft.loan, 240)},
      ${clean(draft.bio, 2000)},
      ${(draft.signature || "").slice(0, 4000)},
      ${clean(draft.subdomain, 80)},
      ${clean(draft.facebook, 240)},
      ${clean(draft.google, 240)},
      ${clean(draft.pinterest, 240)},
      ${clean(draft.twitter, 240)},
      ${clean(draft.instagram, 240)},
      ${clean(draft.youtube, 240)},
      ${clean(draft.linkedin, 240)},
      ${draft.active !== false},
      false
    )
    RETURNING *
  `;
  return fromRow(rows[0]);
}

export async function updateUser(id: string, draft: Partial<UserDraft>): Promise<OfficeUser | null> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const current = await findUserById(id);
  if (!current) return null;
  const nextRole = draft.role ?? current.role;
  const nextActive = draft.active ?? current.active;
  if (current.role === "admin" && current.active && (nextRole !== "admin" || !nextActive)) {
    const others = await countActiveAdmins(id);
    if (others < 1) throw new Error("last_admin");
  }
  let hash: string | null = null;
  if (draft.password) {
    if (draft.password.length < 8) throw new Error("password_short");
    hash = await hashPassword(draft.password);
  }
  const email = draft.email ? draft.email.trim().toLowerCase() : current.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("email_invalid");
  const rows = await sql<UserRow[]>`
    UPDATE office_users SET
      email = ${email},
      password_hash = COALESCE(${hash}, password_hash),
      role = ${nextRole},
      first_name = ${draft.firstName != null ? clean(draft.firstName, 80) : current.firstName},
      last_name = ${draft.lastName != null ? clean(draft.lastName, 80) : current.lastName},
      cell = ${draft.cell != null ? clean(draft.cell, 40) : current.cell},
      home_phone = ${draft.home != null ? clean(draft.home, 40) : current.home},
      office_phone = ${draft.office != null ? clean(draft.office, 40) : current.office},
      title = ${draft.title != null ? clean(draft.title, 80) : current.title},
      license_number = ${draft.license != null ? clean(draft.license, 40) : current.license},
      loan_url = ${draft.loan != null ? clean(draft.loan, 240) : current.loan},
      bio = ${draft.bio != null ? clean(draft.bio, 2000) : current.bio},
      signature = ${draft.signature != null ? draft.signature.slice(0, 4000) : current.signature},
      subdomain = ${draft.subdomain != null ? clean(draft.subdomain, 80) : current.subdomain},
      facebook = ${draft.facebook != null ? clean(draft.facebook, 240) : current.facebook},
      google = ${draft.google != null ? clean(draft.google, 240) : current.google},
      pinterest = ${draft.pinterest != null ? clean(draft.pinterest, 240) : current.pinterest},
      twitter = ${draft.twitter != null ? clean(draft.twitter, 240) : current.twitter},
      instagram = ${draft.instagram != null ? clean(draft.instagram, 240) : current.instagram},
      youtube = ${draft.youtube != null ? clean(draft.youtube, 240) : current.youtube},
      linkedin = ${draft.linkedin != null ? clean(draft.linkedin, 240) : current.linkedin},
      active = ${nextActive},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] ? fromRow(rows[0]) : null;
}

export async function passwordMatchesUser(password: string, hash: string): Promise<boolean> {
  return verifyPassword(password, hash);
}
