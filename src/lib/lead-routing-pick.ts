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

export function isRoutingCandidate(user: { active: boolean; role: string; routingHidden?: boolean }): boolean {
  return user.active && ["admin", "broker", "agent", "isa"].includes(user.role) && !user.routingHidden;
}
