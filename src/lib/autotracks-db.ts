import { randomUUID } from "node:crypto";
import { loadCincAutoTracks } from "./cinc-autotrack-catalog";
import { officeDb } from "./leads-db";
import { sanitizeTrack, type AutoTrackDocument, type AutoTrackFile } from "./autotrack";

type TrackRow = { id: string; document: AutoTrackDocument | string };
type HiddenRow = { id: string };
type FileRow = {
  id: string;
  track_id: string;
  step_id: string;
  name: string;
  content_type: string;
  size_bytes: number;
  bytes: Buffer;
};

function parseDocument(value: AutoTrackDocument | string): unknown {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

export async function seedCincAutoTracks(): Promise<number> {
  const sql = await officeDb();
  if (!sql) return 0;
  const tracks = loadCincAutoTracks();
  for (const raw of tracks) {
    const parsed = sanitizeTrack(raw);
    if (!parsed.ok) continue;
    const doc = parsed.value;
    await sql`
      INSERT INTO autotracks (id, name, category, status, document, created_at, updated_at)
      VALUES (${doc.id}, ${doc.name}, ${doc.category}, ${doc.status}, ${sql.json(JSON.parse(JSON.stringify(doc)))}, now(), now())
      ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          category = EXCLUDED.category,
          status = EXCLUDED.status,
          document = EXCLUDED.document,
          updated_at = now()
      WHERE COALESCE(autotracks.document->>'userEdited', '') <> 'true'
    `;
  }
  return tracks.length;
}

export async function listAutoTracks(): Promise<{ tracks: AutoTrackDocument[]; hiddenIds: string[] }> {
  const sql = await officeDb();
  if (!sql) return { tracks: [], hiddenIds: [] };
  await seedCincAutoTracks();
  const rows = await sql<TrackRow[]>`
    SELECT id, document FROM autotracks
    ORDER BY CASE WHEN id LIKE 'cinc-%' THEN 0 ELSE 1 END, id
  `;
  const hidden = await sql<HiddenRow[]>`SELECT id FROM autotrack_hidden`;
  const tracks = rows.flatMap((row) => {
    const parsed = sanitizeTrack(parseDocument(row.document));
    return parsed.ok ? [parsed.value] : [];
  });
  return { tracks, hiddenIds: hidden.map((row) => row.id) };
}

export async function saveAutoTrack(input: unknown): Promise<AutoTrackDocument> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const parsed = sanitizeTrack(input);
  if (!parsed.ok) throw new Error(parsed.message);
  const doc = parsed.value;
  await sql`
    INSERT INTO autotracks (id, name, category, status, document, created_at, updated_at)
    VALUES (${doc.id}, ${doc.name}, ${doc.category}, ${doc.status}, ${sql.json(JSON.parse(JSON.stringify(doc)))}, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        document = EXCLUDED.document,
        updated_at = now()
  `;
  await sql`DELETE FROM autotrack_hidden WHERE id = ${doc.id}`;
  return doc;
}

export async function deleteAutoTrack(id: string): Promise<void> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  await sql`DELETE FROM autotrack_files WHERE track_id = ${id}`;
  await sql`DELETE FROM autotracks WHERE id = ${id}`;
  await sql`
    INSERT INTO autotrack_hidden (id) VALUES (${id})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function duplicateAutoTrack(id: string): Promise<AutoTrackDocument> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<TrackRow[]>`SELECT id, document FROM autotracks WHERE id = ${id} LIMIT 1`;
  const parsed = sanitizeTrack(parseDocument(rows[0]?.document ?? null));
  if (!parsed.ok) throw new Error("That AutoTrack was not found.");
  const nextId = `track-${randomUUID().slice(0, 8)}`;
  const files = await sql<FileRow[]>`
    SELECT id, track_id, step_id, name, content_type, size_bytes, bytes
    FROM autotrack_files WHERE track_id = ${id}
  `;
  const fileIds = new Map<string, string>();
  for (const file of files) fileIds.set(file.id, `file-${randomUUID().slice(0, 8)}`);
  const copy: AutoTrackDocument = {
    ...parsed.value,
    id: nextId,
    name: `${parsed.value.name} copy`.slice(0, 160),
    status: "draft",
    steps: parsed.value.steps.map((step) => ({
      ...step,
      id: `step-${randomUUID().slice(0, 8)}`,
      attachments: step.attachments.flatMap((file) => {
        const id = fileIds.get(file.id);
        return id ? [{ ...file, id }] : [];
      }),
    })),
  };
  const stepByOld = new Map(parsed.value.steps.map((step, index) => [step.id, copy.steps[index]?.id]));
  await saveAutoTrack(copy);
  for (const file of files) {
    const newFileId = fileIds.get(file.id);
    const newStepId = stepByOld.get(file.step_id);
    if (!newFileId || !newStepId) continue;
    await sql`
      INSERT INTO autotrack_files (id, track_id, step_id, name, content_type, size_bytes, bytes)
      VALUES (${newFileId}, ${nextId}, ${newStepId}, ${file.name}, ${file.content_type}, ${file.size_bytes}, ${file.bytes})
    `;
  }
  return copy;
}

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

export async function saveAutoTrackFile(input: {
  trackId: string;
  stepId: string;
  name: string;
  contentType: string;
  bytes: Buffer;
}): Promise<AutoTrackFile> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  if (!ALLOWED_TYPES.has(input.contentType)) throw new Error("Attach a PDF, text file, or image.");
  if (input.bytes.length > 1_500_000) throw new Error("Attachments must be 1.5 MB or smaller.");
  const count = await sql<{ n: number }[]>`
    SELECT count(*)::int AS n FROM autotrack_files WHERE step_id = ${input.stepId}
  `;
  if ((count[0]?.n ?? 0) >= 5) throw new Error("A step can have 5 attachments.");
  const id = `file-${randomUUID().slice(0, 8)}`;
  const name = input.name.replace(/[^\w.\- ()]/g, "").slice(0, 180) || "attachment";
  await sql`
    INSERT INTO autotrack_files (id, track_id, step_id, name, content_type, size_bytes, bytes)
    VALUES (${id}, ${input.trackId}, ${input.stepId}, ${name}, ${input.contentType}, ${input.bytes.length}, ${input.bytes})
  `;
  return { id, name, contentType: input.contentType, size: input.bytes.length };
}

export async function readAutoTrackFile(id: string): Promise<{ file: AutoTrackFile; bytes: Buffer } | null> {
  const sql = await officeDb();
  if (!sql) return null;
  const rows = await sql<FileRow[]>`
    SELECT id, track_id, step_id, name, content_type, size_bytes, bytes
    FROM autotrack_files WHERE id = ${id} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return null;
  return {
    file: { id: row.id, name: row.name, contentType: row.content_type, size: row.size_bytes },
    bytes: row.bytes,
  };
}

export async function deleteAutoTrackFile(id: string): Promise<boolean> {
  const sql = await officeDb();
  if (!sql) throw new Error("database_unconfigured");
  const rows = await sql<{ id: string }[]>`DELETE FROM autotrack_files WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
