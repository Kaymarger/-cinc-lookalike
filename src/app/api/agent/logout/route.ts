import { NextResponse } from "next/server";
import { COOKIE_NAME, cookieBase } from "@/lib/agent-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const type = request.headers.get("content-type") || "";
  const html = !type.includes("application/json");
  let next = "/agent/login";
  if (html) {
    const form = await request.formData().catch(() => null);
    if (form && String(form.get("next") ?? "") === "/") next = "/";
  }
  const secure = new URL(request.url).protocol === "https:";
  const response = html
    ? new NextResponse(null, { status: 303, headers: { Location: next } })
    : NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", cookieBase(secure, 0));
  return response;
}
