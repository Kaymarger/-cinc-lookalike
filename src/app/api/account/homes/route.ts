import { leadsDatabaseConfigured, readFavouriteIds, writeFavouriteIds } from "@/lib/leads-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function emailOf(value: string | null): string {
  const email = (value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export async function GET(request: Request) {
  const email = emailOf(new URL(request.url).searchParams.get("email"));
  if (!email || !leadsDatabaseConfigured()) return Response.json({ ok: true, ids: [] });
  const ids = await readFavouriteIds(email).catch(() => []);
  return Response.json({ ok: true, ids });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; ids?: unknown } | null;
  const email = emailOf(typeof body?.email === "string" ? body.email : "");
  const ids = Array.isArray(body?.ids) ? body.ids.map((id) => String(id).slice(0, 40)).filter(Boolean).slice(0, 40) : [];
  if (!email) return Response.json({ ok: false }, { status: 400 });
  if (!leadsDatabaseConfigured()) return Response.json({ ok: true, stored: "device" });
  const saved = await writeFavouriteIds(email, ids).catch(() => false);
  return Response.json({ ok: true, stored: saved ? "lead" : "device" });
}
