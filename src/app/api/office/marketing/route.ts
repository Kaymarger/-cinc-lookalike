import { currentActor } from "@/lib/office-actor";
import { marketingReport } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await currentActor();
  if (!actor) return Response.json({ ok: false, message: "Sign in required." }, { status: 401 });
  const url = new URL(request.url);
  const now = new Date();
  const year = Number(url.searchParams.get("year") || now.getFullYear());
  const month = Number(url.searchParams.get("month") || now.getMonth() + 1);
  const report = await marketingReport(year, Math.min(12, Math.max(1, month)));
  return Response.json({ ok: true, ...report });
}
