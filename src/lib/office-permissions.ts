import type { OfficeRole } from "./office-access";
import { defaultPermissions, PERMISSION_OPTIONS, type OfficePermissions, type PermissionKey } from "./permission-options";
import { readPreferences, writePreferences } from "./office-preferences";

export { PERMISSION_OPTIONS, defaultPermissions };
export type { OfficePermissions, PermissionKey };

function asFlags(value: unknown): Partial<OfficePermissions> {
  if (!value || typeof value !== "object") return {};
  const out: Partial<OfficePermissions> = {};
  for (const [key] of PERMISSION_OPTIONS) {
    const flag = (value as Record<string, unknown>)[key];
    if (typeof flag === "boolean") out[key as PermissionKey] = flag;
  }
  return out;
}

export async function permissionsFor(userId: string, role: OfficeRole): Promise<OfficePermissions> {
  const prefs = await readPreferences(userId).catch(() => ({} as Record<string, unknown>));
  return { ...defaultPermissions(role), ...asFlags(prefs.permissions) } as OfficePermissions;
}

export async function savePermissions(userId: string, role: OfficeRole, flags: Partial<OfficePermissions>): Promise<OfficePermissions> {
  const current = await readPreferences(userId);
  const next = { ...defaultPermissions(role), ...asFlags(current.permissions), ...asFlags(flags) } as OfficePermissions;
  await writePreferences(userId, { ...current, permissions: next });
  return next;
}
