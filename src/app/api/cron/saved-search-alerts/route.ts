import { runSavedSearchAlerts } from "@/lib/run-saved-search-alerts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 200, message: "CRON_SECRET is not set. Saved-search alerts did not run." };
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, status: 401, message: "Sign in required." };
  }
  return { ok: true };
}

export async function GET(request: Request) {
  const gate = authorized(request);
  if (!gate.ok) {
    return Response.json({ ok: gate.status === 200, skipped: gate.status === 200, message: gate.message }, { status: gate.status });
  }
  try {
    const report = await runSavedSearchAlerts();
    return Response.json(report);
  } catch (error) {
    console.error("[alerts] saved search run failed", error instanceof Error ? error.name : "error");
    return Response.json({ ok: false, message: "Saved-search alerts could not finish." }, { status: 500 });
  }
}
