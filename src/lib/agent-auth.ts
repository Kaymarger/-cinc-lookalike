/** Password gate for the agent office. Uses Web Crypto so middleware can verify the cookie. */

export const COOKIE_NAME = "gvhs_agent";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

const encoder = new TextEncoder();

export function agentPassword(): string {
  return process.env.AGENT_PASSWORD?.trim() ?? "";
}

export function safeNext(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/agent";
  }
  const path = value.split("?")[0]?.split("#")[0] ?? "";
  const allowed =
    path === "/agent" ||
    path.startsWith("/agent/") ||
    path.startsWith("/dashboard/spa") ||
    path.startsWith("/dashboard/sellersuite") ||
    path.startsWith("/dashboard/landing");
  if (!allowed || path.startsWith("/agent/login")) return "/agent";
  return value.slice(0, 500);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return hex(new Uint8Array(digest));
}

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string): boolean {
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left[i]! ^ right[i]!;
  return diff === 0;
}

export async function sessionSecret(): Promise<string> {
  const explicit = process.env.AUTH_SECRET?.trim();
  if (explicit) return explicit;
  const password = agentPassword();
  if (!password) return "";
  return sha256Hex(`gvhs-agent-auth:${password}`);
}

async function sign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return hex(new Uint8Array(signature));
}

export async function passwordMatches(input: string): Promise<boolean> {
  const expected = agentPassword();
  if (!expected || !input) return false;
  const [left, right] = await Promise.all([sha256Hex(input), sha256Hex(expected)]);
  return safeEqual(left, right);
}

export async function signSession(now = Date.now()): Promise<string> {
  const secret = await sessionSecret();
  const payload = `v1.${now + SESSION_MAX_AGE * 1000}`;
  const signature = await sign(secret, payload);
  return `${payload}.${signature}`;
}

export async function verifySession(token: string | undefined | null): Promise<boolean> {
  if (!agentPassword() || !token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, exp, signature] = parts;
  if (version !== "v1" || !exp || !signature) return false;
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const secret = await sessionSecret();
  if (!secret) return false;
  const expected = await sign(secret, `${version}.${exp}`);
  return safeEqual(signature, expected);
}

export function cookieBase(secure: boolean, maxAge = SESSION_MAX_AGE) {
  return {
    httpOnly: true as const,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
