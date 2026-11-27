import { readAccount, writeAccount, type AccountPatch } from "@/lib/account-store";
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
  if (recent.length >= 40) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function emailOf(value: unknown): string {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export async function GET(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ ok: false, message: "Too many requests." }, { status: 429 });
  }
  const email = emailOf(new URL(request.url).searchParams.get("email"));
  if (!email || !leadsDatabaseConfigured()) {
    return Response.json({ ok: true, homes: [], compare: [], notebook: [], propertyNotes: [], searches: [] });
  }
  const snapshot = await readAccount(email).catch(() => null);
  if (!snapshot) return Response.json({ ok: false }, { status: 503 });
  return Response.json({ ok: true, ...snapshot });
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return Response.json({ ok: false, message: "Too many requests." }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as AccountPatch | null;
  const email = emailOf(body?.email);
  if (!email) return Response.json({ ok: false, message: "Email is required." }, { status: 400 });
  if (!leadsDatabaseConfigured()) {
    return Response.json({ ok: true, stored: "device", homes: [], compare: [], notebook: [], propertyNotes: [], searches: [] });
  }
  const snapshot = await writeAccount({ ...body, email, name: String(body?.name || "").slice(0, 120) }).catch(() => null);
  if (!snapshot) return Response.json({ ok: false }, { status: 503 });
  return Response.json({ ok: true, stored: "account", ...snapshot });
}
