import { deleteSearchForEmail, listSearchesForEmail } from "@/lib/lead-searches-db";
import { leadsDatabaseConfigured } from "@/lib/leads-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= 30) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function emailOf(value: string | null): string | null {
  const email = (value || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ ok: false, message: "Too many requests." }, { status: 429 });
  }
  const email = emailOf(new URL(request.url).searchParams.get("email"));
  if (!email) return Response.json({ ok: true, searches: [] });
  if (!leadsDatabaseConfigured()) return Response.json({ ok: true, searches: [], configured: false });
  try {
    const searches = await listSearchesForEmail(email);
    return Response.json({
      ok: true,
      configured: true,
      searches: searches.map((search) => ({
        id: search.id,
        leadId: search.leadId,
        name: search.name,
        city: search.city,
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        beds: search.beds,
        baths: search.baths,
        propertyType: search.propertyType,
        frequency: search.frequency,
        createdAt: search.createdAt,
      })),
    });
  } catch (error) {
    console.error("[account searches]", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, searches: [], message: "Saved searches are temporarily unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ ok: false, message: "Too many requests." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as { email?: unknown; id?: unknown } | null;
  const email = emailOf(typeof body?.email === "string" ? body.email : "");
  const id = String(body?.id ?? "").slice(0, 80);
  if (!email || !id) return Response.json({ ok: false, message: "Missing search." }, { status: 400 });
  if (!leadsDatabaseConfigured()) {
    return Response.json({ ok: false, message: "Database is not connected." }, { status: 409 });
  }
  const removed = await deleteSearchForEmail(email, id);
  if (!removed) return Response.json({ ok: false, message: "That saved search was not found." }, { status: 404 });
  return Response.json({ ok: true });
}
