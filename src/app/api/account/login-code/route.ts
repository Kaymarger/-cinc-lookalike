import { loginCodeFor, loginCodeMatches, loginCodeSecret } from "@/lib/login-code";
import { sendOfficeMail } from "@/lib/office-mail";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < 10 * 60_000);
  if (recent.length >= 5) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function emailOf(value: unknown): string {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; code?: unknown } | null;
  const email = emailOf(body?.email);
  if (!email) return Response.json({ ok: false, message: "Enter a valid email." }, { status: 400 });
  const secret = loginCodeSecret();
  if (!secret) return Response.json({ ok: false, message: "Sign-in email is not configured." }, { status: 503 });
  const ip = clientIp(request);
  if (rateLimited(`${ip}:${email}`)) {
    return Response.json({ ok: false, message: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const code = String(body?.code || "").trim();
  if (!code) {
    const next = loginCodeFor(email, secret);
    const sent = await sendOfficeMail(
      email,
      `Your ${SITE.name} sign-in code`,
      `Your sign-in code is ${next}. It expires in 10 minutes. If you did not ask for this, you can ignore it.`
    );
    if (sent !== "sent") {
      return Response.json({ ok: false, message: "We could not email a code just now. Please try again." }, { status: 503 });
    }
    return Response.json({ ok: true, sent: true });
  }

  if (!loginCodeMatches(email, code, secret)) {
    return Response.json({ ok: false, message: "That code is incorrect or expired." }, { status: 400 });
  }
  return Response.json({ ok: true, verified: true });
}
