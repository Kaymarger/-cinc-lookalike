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

/** Names from audit runs, such as "QA 1126 Agent". A real name like Qasim does not match. */
export function isQaTestAgent(user: { name?: string; firstName?: string; lastName?: string }): boolean {
  const full = `${user.firstName || ""} ${user.lastName || ""}`.trim();
  return [user.firstName, user.name, full].some((value) => /^qa\b/i.test((value || "").trim()));
}

export function isRoutingCandidate(user: { active: boolean; role: string; routingHidden?: boolean; inOffice?: boolean; name?: string; firstName?: string; lastName?: string }): boolean {
  return user.active && user.inOffice !== false && ["admin", "broker", "agent", "isa"].includes(user.role) && !user.routingHidden && !isQaTestAgent(user);
}

export function officeOwner<T extends { name: string; active: boolean; role: string; bootstrap?: boolean; routingHidden?: boolean; firstName?: string; lastName?: string }>(
  users: readonly T[],
  fallback = "Casey Archibald",
): T | null {
  const usable = users.filter((user) => user.active && !isQaTestAgent(user));
  const wanted = fallback.trim().replace(/\s+/g, " ").toLowerCase();
  return (
    usable.find((user) => user.name.trim().replace(/\s+/g, " ").toLowerCase() === wanted) ||
    usable.find((user) => user.bootstrap && user.role === "admin") ||
    usable.find((user) => user.role === "admin" && !user.routingHidden) ||
    null
  );
}

/** Equal-weight choice among eligible agents. `random` is injectable for tests. */
export function pickUniform(ids: readonly string[], random: () => number = Math.random): string | null {
  if (!ids.length) return null;
  const index = Math.min(ids.length - 1, Math.floor(random() * ids.length));
  return ids[index] ?? null;
}
