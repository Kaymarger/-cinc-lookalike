import { createHmac, timingSafeEqual } from "node:crypto";

const WINDOW_MS = 10 * 60 * 1000;

export function loginCodeFor(email: string, secret: string, now = Date.now()): string {
  const bucket = Math.floor(now / WINDOW_MS);
  const mac = createHmac("sha256", secret).update(`${email.trim().toLowerCase()}|${bucket}`).digest();
  return String(mac.readUInt32BE(0) % 1_000_000).padStart(6, "0");
}

export function loginCodeMatches(email: string, code: string, secret: string, now = Date.now()): boolean {
  const normalized = code.replace(/\D/g, "");
  if (!/^\d{6}$/.test(normalized) || !secret) return false;
  return [0, 1].some((stepsBack) => {
    const expected = loginCodeFor(email, secret, now - stepsBack * WINDOW_MS);
    const left = Buffer.from(normalized);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  });
}

export function loginCodeSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.AGENT_PASSWORD ||
    process.env.RESEND_API_KEY ||
    process.env.SENDGRID_API_KEY ||
    ""
  ).trim();
}
