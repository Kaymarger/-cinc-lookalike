const PREF_KEY = "gvhs-office-prefs";

export function readLocalPrefs(): Record<string, unknown> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PREF_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

export function writeLocalPrefs(next: Record<string, unknown>) {
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
}

export async function loadOfficePrefs(): Promise<Record<string, unknown>> {
  const local = readLocalPrefs();
  try {
    const response = await fetch("/api/office/preferences", { cache: "no-store" });
    const data = (await response.json().catch(() => null)) as { preferences?: Record<string, unknown> } | null;
    if (response.ok && data?.preferences && Object.keys(data.preferences).length) {
      return { ...local, ...data.preferences };
    }
  } catch {
    return local;
  }
  return local;
}

export async function saveOfficePrefs(patch: Record<string, unknown>): Promise<string | null> {
  const next = { ...readLocalPrefs(), ...patch };
  writeLocalPrefs(next);
  try {
    const response = await fetch("/api/office/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (response.ok) return null;
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    return data?.message || null;
  } catch {
    return null;
  }
}
