import { unsubscribeLeadEmail } from "@/lib/leads-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = String(body?.email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ ok: false, message: "Enter the email address you used to sign up." }, { status: 400 });
  }
  await unsubscribeLeadEmail(email).catch(() => 0);
  return Response.json({
    ok: true,
    message: "If that address is on file, email and text alerts are now off.",
  });
}
