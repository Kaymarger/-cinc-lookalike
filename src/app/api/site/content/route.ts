import { currentActor } from "@/lib/office-actor";
import { officeDb } from "@/lib/leads-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ContentDoc = {
  pages?: Record<string, unknown>;
  landingPages?: unknown[];
  sellerSites?: unknown[];
};

async function readDoc(): Promise<ContentDoc> {
  const sql = await officeDb();
  if (!sql) return {};
  const rows = await sql<{ document: ContentDoc | string }[]>`
    SELECT document FROM office_settings WHERE id = 'content' LIMIT 1
  `;
  const value = rows[0]?.document;
  if (!value) return {};
  if (typeof value === "string") {
    try { return JSON.parse(value) as ContentDoc; } catch { return {}; }
  }
  return value;
}

export async function GET() {
  return Response.json({ ok: true, ...(await readDoc()) });
}

export async function PUT(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const sql = await officeDb();
  if (!sql) return Response.json({ ok: false, message: "Database is not connected." }, { status: 409 });
  const body = (await request.json().catch(() => null)) as ContentDoc | null;
  if (!body || typeof body !== "object") return Response.json({ ok: false, message: "Nothing to save." }, { status: 400 });
  const current = await readDoc();
  const next = { ...current, ...body };
  await sql`
    INSERT INTO office_settings (id, document, updated_at)
    VALUES ('content', ${sql.json(JSON.parse(JSON.stringify(next)))}, now())
    ON CONFLICT (id) DO UPDATE SET document = EXCLUDED.document, updated_at = now()
  `;
  return Response.json({ ok: true });
}
