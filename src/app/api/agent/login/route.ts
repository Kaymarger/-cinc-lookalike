import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  cookieBase,
  passwordMatches,
  safeNext,
  signSession,
  agentPassword,
} from "@/lib/agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < 60_000);
  if (recent.length >= 12) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

async function readBody(request: Request): Promise<{ password: string; next: string; html: boolean }> {
  const type = request.headers.get("content-type") || "";
  const html = !type.includes("application/json");
  if (!html) {
    const body = (await request.json().catch(() => null)) as { password?: unknown; next?: unknown } | null;
    return {
      password: String(body?.password ?? ""),
      next: safeNext(typeof body?.next === "string" ? body.next : ""),
      html,
    };
  }
  const form = await request.formData();
  return {
    password: String(form.get("password") ?? ""),
    next: safeNext(String(form.get("next") ?? "")),
    html,
  };
}

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

function loginPath(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  const suffix = query.toString();
  return suffix ? `/agent/login?${suffix}` : "/agent/login";
}

export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return redirectTo(loginPath({ error: "1" }));
  }

  const { password, next, html } = await readBody(request);
  const secure = new URL(request.url).protocol === "https:";

  if (!agentPassword()) {
    if (html) return redirectTo("/agent/login");
    return NextResponse.json(
      { ok: false, locked: true, message: "Set AGENT_PASSWORD in Vercel, then redeploy." },
      { status: 403 }
    );
  }

  if (!(await passwordMatches(password))) {
    if (html) return redirectTo(loginPath({ error: "1", next }));
    return NextResponse.json({ ok: false, message: "That password is not right." }, { status: 401 });
  }

  const response = html ? redirectTo(next) : NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, await signSession(), cookieBase(secure));
  return response;
}
