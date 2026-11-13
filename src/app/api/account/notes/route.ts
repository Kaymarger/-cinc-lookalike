import { appendPropertyNote, leadsDatabaseConfigured } from "@/lib/leads-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string; propertyId?: string; address?: string; body?: string } | null;
  const email = (body?.email || "").trim().toLowerCase();
  const note = (body?.body || "").trim().slice(0, 2000);
  const propertyId = (body?.propertyId || "").slice(0, 80);
  const address = (body?.address || "").slice(0, 160);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, message: "Email is required." }, { status: 400 });
  }
  if (!leadsDatabaseConfigured()) return Response.json({ ok: true, stored: "device" });
  const line = note
    ? `Property note (${propertyId}) ${address}: ${note}`
    : `Property note cleared (${propertyId}) ${address}`;
  const updated = await appendPropertyNote(email, line);
  return Response.json({ ok: true, stored: updated ? "lead" : "device" });
}
