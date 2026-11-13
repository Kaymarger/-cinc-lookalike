/** Pure round-robin pick so tests do not load the database client. */

export function nextPoolUser(
  pool: readonly string[],
  cursor: number,
  activeIds: ReadonlySet<string>
): string | null {
  const usable = pool.filter((id) => activeIds.has(id));
  if (!usable.length || cursor < 1) return null;
  return usable[(cursor - 1) % usable.length] ?? null;
}

export function isRoutingCandidate(user: { active: boolean; role: string; routingHidden?: boolean; inOffice?: boolean }): boolean {
  return user.active && user.inOffice !== false && ["admin", "broker", "agent", "isa"].includes(user.role) && !user.routingHidden;
}

/** Equal-weight choice among eligible agents. `random` is injectable for tests. */
export function pickUniform(ids: readonly string[], random: () => number = Math.random): string | null {
  if (!ids.length) return null;
  const index = Math.min(ids.length - 1, Math.floor(random() * ids.length));
  return ids[index] ?? null;
}
