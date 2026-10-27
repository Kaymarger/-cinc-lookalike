import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/agent-auth";

function isOfficePath(pathname: string): boolean {
  return (
    pathname === "/agent" ||
    pathname.startsWith("/agent/") ||
    pathname === "/dashboard/spa" ||
    pathname.startsWith("/dashboard/spa/") ||
    pathname.startsWith("/dashboard/sellersuite") ||
    pathname.startsWith("/dashboard/landing")
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/agent/login") return NextResponse.next();

  if (pathname === "/api/leads") {
    if (request.method !== "GET" && request.method !== "HEAD") return NextResponse.next();
    const ok = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
    if (ok) return NextResponse.next();
    return NextResponse.json({ ok: false, message: "Sign in required." }, { status: 401 });
  }

  if (!isOfficePath(pathname)) return NextResponse.next();

  const ok = await verifySession(request.cookies.get(COOKIE_NAME)?.value);
  if (ok) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/agent/login";
  url.search = "";
  url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/agent",
    "/agent/:path*",
    "/dashboard/spa",
    "/dashboard/spa/:path*",
    "/dashboard/sellersuite/:path*",
    "/dashboard/landing/:path*",
    "/api/leads",
  ],
};
