import { NextResponse } from "next/server";
import {
  BECOME_COOKIE,
  COOKIE_NAME,
  cookieBase,
  safeNext,
  signSession,
  agentPassword,
} from "@/lib/agent-auth";
import { loginOffice } from "@/lib/office-actor";

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

async function readBody(request: Request): Promise<{ email: string; password: string; next: string; html: boolean }> {
  const type = request.headers.get("content-type") || "";
  const html = !type.includes("application/json");
  if (!html) {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
      next?: unknown;
    } | null;
    return {
      email: String(body?.email ?? ""),
      password: String(body?.password ?? ""),
      next: safeNext(typeof body?.next === "string" ? body.next : ""),
      html,
    };
  }
  const form = await request.formData();
  return {
    email: String(form.get("email") ?? ""),
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

  const { email, password, next, html } = await readBody(request);
  const secure = new URL(request.url).protocol === "https:";

  if (!agentPassword()) {
    if (html) return redirectTo("/agent/login");
    return NextResponse.json(
      { ok: false, locked: true, message: "Set AGENT_PASSWORD in Vercel, then redeploy." },
      { status: 403 }
    );
  }

  const result = await loginOffice(email, password);
  if (!result.ok) {
    const error = result.reason === "db" ? "db" : result.reason === "invite" ? "invite" : "1";
    if (html) return redirectTo(loginPath({ error, next }));
    const message =
      result.reason === "db"
        ? "Team logins need a database. Leave the email blank and use the office password, or connect Neon."
        : result.reason === "invite"
          ? "This account still needs a password. Open the invite link from your admin."
          : "That email or password is not right.";
    const status = result.reason === "db" ? 503 : 401;
    return NextResponse.json({ ok: false, message }, { status });
  }

  const response = html ? redirectTo(next) : NextResponse.json({ ok: true, userId: result.userId });
  response.cookies.set(COOKIE_NAME, await signSession(result.userId), cookieBase(secure));
  response.cookies.set(BECOME_COOKIE, "", cookieBase(secure, 0));
  return response;
}
