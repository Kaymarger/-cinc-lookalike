import { NextResponse } from "next/server";
import { agentPassword } from "@/lib/agent-auth";
import { leadsDatabaseConfigured } from "@/lib/leads-db";
import { publicOrigin } from "@/lib/office-mail";
import { deliverAccessLink } from "@/lib/office-tokens";
import { findUserByEmail } from "@/lib/office-users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= 8) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

async function readEmail(request: Request): Promise<{ email: string; html: boolean }> {
  const type = request.headers.get("content-type") || "";
  const html = !type.includes("application/json");
  if (!html) {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    return { email: String(body?.email ?? ""), html };
  }
  const form = await request.formData();
  return { email: String(form.get("email") ?? ""), html };
}

export async function POST(request: Request) {
  const html = (request.headers.get("content-type") || "").includes("application/x-www-form-urlencoded") ||
    (request.headers.get("content-type") || "").includes("multipart/form-data") ||
    !(request.headers.get("content-type") || "").includes("application/json");

  if (rateLimited(clientIp(request))) {
    if (html) return redirectTo("/agent/forgot?error=1");
    return NextResponse.json({ ok: false, message: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }
  if (!agentPassword()) {
    if (html) return redirectTo("/agent/login");
    return NextResponse.json({ ok: false, message: "Set AGENT_PASSWORD in Vercel, then redeploy." }, { status: 403 });
  }
  if (!leadsDatabaseConfigured()) {
    if (html) return redirectTo("/agent/forgot?error=db");
    return NextResponse.json(
      { ok: false, message: "Password reset needs the office database. Sign in with the office password, or connect Neon." },
      { status: 503 }
    );
  }

  const { email } = await readEmail(request);
  const trimmed = email.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    try {
      const user = await findUserByEmail(trimmed);
      if (user?.active) await deliverAccessLink(user, "reset", publicOrigin(request));
    } catch (error) {
      console.error("[office] forgot", error instanceof Error ? error.name : "error");
    }
  }

  if (html) return redirectTo("/agent/forgot?sent=1");
  return NextResponse.json({
    ok: true,
    message:
      "If that email belongs to an office user, a reset link is ready. When email is configured it is sent automatically. Otherwise an admin can copy a reset link from Users.",
  });
}
