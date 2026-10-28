import { NextResponse } from "next/server";
import { BECOME_COOKIE, COOKIE_NAME, agentPassword, cookieBase, signSession } from "@/lib/agent-auth";
import { consumeAccessToken } from "@/lib/office-tokens";

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

function redirectTo(path: string) {
  return new NextResponse(null, { status: 303, headers: { Location: path } });
}

function resetPath(token: string, error: string) {
  const query = new URLSearchParams();
  if (token) query.set("token", token);
  query.set("error", error);
  return `/agent/reset?${query.toString()}`;
}

async function readBody(request: Request): Promise<{ token: string; password: string; confirm: string; html: boolean }> {
  const type = request.headers.get("content-type") || "";
  const html = !type.includes("application/json");
  if (!html) {
    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
      password?: unknown;
      confirm?: unknown;
    } | null;
    return {
      token: String(body?.token ?? ""),
      password: String(body?.password ?? ""),
      confirm: String(body?.confirm ?? body?.password ?? ""),
      html,
    };
  }
  const form = await request.formData();
  return {
    token: String(form.get("token") ?? ""),
    password: String(form.get("password") ?? ""),
    confirm: String(form.get("confirm") ?? ""),
    html,
  };
}

export async function POST(request: Request) {
  const secure = new URL(request.url).protocol === "https:";
  const { token, password, confirm, html } = await readBody(request);
  if (rateLimited(clientIp(request))) {
    if (html) return redirectTo(resetPath(token, "rate"));
    return NextResponse.json({ ok: false, message: "Too many requests. Wait a minute and try again." }, { status: 429 });
  }
  if (!agentPassword()) {
    if (html) return redirectTo("/agent/login");
    return NextResponse.json({ ok: false, message: "Set AGENT_PASSWORD in Vercel, then redeploy." }, { status: 403 });
  }
  if (password !== confirm) {
    if (html) return redirectTo(resetPath(token, "match"));
    return NextResponse.json({ ok: false, message: "Those passwords do not match." }, { status: 400 });
  }

  const result = await consumeAccessToken(token, password);
  if (!result.ok) {
    const error = result.reason === "short" ? "short" : result.reason === "inactive" ? "inactive" : result.reason === "db" ? "db" : "bad";
    const message =
      error === "short"
        ? "Password must be at least 8 characters."
        : error === "inactive"
          ? "That account is inactive. Ask an admin to turn it back on."
          : error === "db"
            ? "Password reset needs the office database."
            : "This link is invalid or expired. Ask an admin for a new one.";
    if (html) return redirectTo(resetPath(token, error));
    const status = error === "db" ? 503 : 400;
    return NextResponse.json({ ok: false, message }, { status });
  }

  const response = html
    ? redirectTo("/agent")
    : NextResponse.json({ ok: true, userId: result.userId });
  response.cookies.set(COOKIE_NAME, await signSession(result.userId), cookieBase(secure));
  response.cookies.set(BECOME_COOKIE, "", cookieBase(secure, 0));
  return response;
}
