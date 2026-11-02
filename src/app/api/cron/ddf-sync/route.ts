import { ddfConfigured } from "@/lib/ddf/credentials";
import { syncDdfBatch } from "@/lib/ddf/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: Request): { ok: true } | { ok: false; status: number; message: string } {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 200, message: "CRON_SECRET is not set. The DDF sync did not run." };
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, status: 401, message: "This sync is not authorized." };
  }
  return { ok: true };
}

export async function GET(request: Request) {
  const gate = authorized(request);
  if (!gate.ok) {
    return Response.json({ ok: gate.status === 200, skipped: gate.status === 200, message: gate.message }, { status: gate.status });
  }
  if (!ddfConfigured()) {
    return Response.json({
      ok: true,
      skipped: true,
      message: "DDF_USERNAME and DDF_PASSWORD are not set. The sync did not run.",
    });
  }
  const report = await syncDdfBatch({ budgetMs: 45_000, maxPages: 6 });
  return Response.json(report);
}
