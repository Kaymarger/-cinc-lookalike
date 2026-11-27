import type { SearchFilters } from "@/lib/types";

export type NotebookNote = { id: string; title: string; body: string };
export type PropertyNote = { propertyId: string; address: string; body: string };

const FILTER_KEYS = [
  "q",
  "city",
  "minPrice",
  "maxPrice",
  "beds",
  "baths",
  "propertyType",
  "minSqft",
  "maxSqft",
  "minYear",
  "maxYear",
  "maxDays",
  "tag",
  "openHouse",
  "weekend",
  "newListings",
  "virtualTour",
  "sort",
] as const;

export function mergeIds(account: string[], device: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of [...account, ...device]) {
    const clean = id.trim().slice(0, 40);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
    if (out.length >= limit) break;
  }
  return out;
}

export function deviceSearchesForEmail<T extends { email?: string }>(rows: T[], email: string): T[] {
  const wanted = email.trim().toLowerCase();
  return rows.filter((row) => {
    const owner = (row.email || "").trim().toLowerCase();
    return !owner || owner === wanted;
  });
}

export function mergeNotebook(account: NotebookNote[], device: NotebookNote[]): NotebookNote[] {
  const ids = new Set(account.map((note) => note.id));
  const titles = new Set(account.map((note) => note.title.trim().toLowerCase()));
  const extra = device.filter((note) => {
    const title = note.title.trim().toLowerCase();
    return title && !ids.has(note.id) && !titles.has(title);
  });
  return [...account, ...extra].slice(0, 40).map(cleanNotebook);
}

export function cleanNotebook(note: NotebookNote): NotebookNote {
  return {
    id: note.id.trim().slice(0, 80) || crypto.randomUUID(),
    title: note.title.replace(/\s+/g, " ").trim().slice(0, 140),
    body: note.body.replace(/\s+/g, " ").trim().slice(0, 2000),
  };
}

export function cleanFilters(value: unknown): SearchFilters {
  if (!value || typeof value !== "object") return {};
  const raw = value as Record<string, unknown>;
  const filters: SearchFilters = {};
  for (const key of FILTER_KEYS) {
    const item = raw[key];
    if (typeof item === "string" && item.trim()) {
      (filters as Record<string, unknown>)[key] = item.trim().slice(0, 80);
    } else if (typeof item === "number" && Number.isFinite(item)) {
      (filters as Record<string, unknown>)[key] = item;
    } else if (typeof item === "boolean") {
      (filters as Record<string, unknown>)[key] = item;
    }
  }
  return filters;
}

export function readTaggedLine(notes: string, tag: string): string {
  const match = notes.match(new RegExp(`^${tag}: (.*)$`, "m"));
  return match?.[1]?.trim() || "";
}

export function writeTaggedLine(notes: string, tag: string, value: string): string {
  const line = `${tag}: ${value}`;
  if (new RegExp(`^${tag}: `, "m").test(notes)) {
    return notes.replace(new RegExp(`^${tag}: .*$`, "m"), line);
  }
  const base = notes.replace(/\s+$/, "");
  return base ? `${base}\n${line}` : line;
}

export function idsFromLine(value: string): string[] {
  return value.split(",").map((id) => id.trim()).filter(Boolean);
}

export function readNotebooks(notes: string): NotebookNote[] {
  const raw = readTaggedLine(notes, "Notebooks");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Partial<NotebookNote>;
      if (typeof row.title !== "string" || !row.title.trim()) return [];
      return [cleanNotebook({ id: String(row.id || ""), title: row.title, body: String(row.body || "") })];
    });
  } catch {
    return [];
  }
}

export function propertyNotesFromText(notes: string): PropertyNote[] {
  const map = new Map<string, PropertyNote>();
  for (const line of notes.split("\n")) {
    const cleared = line.match(/^Property note cleared \(([^)]+)\)/);
    if (cleared) {
      map.delete(cleared[1]);
      continue;
    }
    const match = line.match(/^Property note \(([^)]+)\) ([^:]+): (.*)$/);
    if (!match) continue;
    const body = match[3].trim();
    if (!body) {
      map.delete(match[1]);
      continue;
    }
    map.set(match[1], { propertyId: match[1], address: match[2].trim(), body });
  }
  return [...map.values()];
}

export function upsertPropertyNote(notes: string, note: PropertyNote): string {
  const current = propertyNotesFromText(notes).find((item) => item.propertyId === note.propertyId);
  const body = note.body.trim();
  if ((current?.body || "") === body) return notes;
  const propertyId = note.propertyId.slice(0, 80);
  const address = note.address.replace(/\s+/g, " ").trim().slice(0, 160);
  const line = body
    ? `Property note (${propertyId}) ${address}: ${body.replace(/\s+/g, " ").slice(0, 2000)}`
    : `Property note cleared (${propertyId}) ${address}`;
  const base = notes.replace(/\s+$/, "");
  return base ? `${base}\n${line}` : line;
}

export function applyAccountNotes(
  notes: string,
  patch: {
    homes?: string[];
    homesMode?: "merge" | "replace";
    compare?: string[];
    compareMode?: "merge" | "replace";
    notebook?: NotebookNote[];
    notebookMode?: "merge" | "replace";
    propertyNotes?: PropertyNote[];
  }
): string {
  let next = notes;
  if (patch.homes) {
    const current = idsFromLine(readTaggedLine(notes, "Favourites"));
    const ids = patch.homesMode === "replace" ? mergeIds(patch.homes, [], 40) : mergeIds(current, patch.homes, 40);
    next = writeTaggedLine(next, "Favourites", ids.join(","));
  }
  if (patch.compare) {
    const current = idsFromLine(readTaggedLine(next, "Compare"));
    const ids = patch.compareMode === "replace" ? mergeIds(patch.compare, [], 3) : mergeIds(current, patch.compare, 3);
    next = writeTaggedLine(next, "Compare", ids.join(","));
  }
  if (patch.notebook) {
    const current = readNotebooks(next);
    const merged = patch.notebookMode === "replace"
      ? patch.notebook.slice(0, 40).map(cleanNotebook).filter((note) => note.title)
      : mergeNotebook(current, patch.notebook);
    next = writeTaggedLine(next, "Notebooks", JSON.stringify(merged));
  }
  for (const note of patch.propertyNotes || []) {
    if (!note.propertyId) continue;
    next = upsertPropertyNote(next, note);
  }
  return next;
}
