import { ddfConfigured } from "@/lib/ddf/credentials";
import { countDdfListings, readSyncState } from "@/lib/ddf/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!ddfConfigured()) {
    return Response.json({
      ok: true,
      configured: false,
      count: 0,
      message: "DDF_USERNAME and DDF_PASSWORD are not set.",
    });
  }
  const [count, state] = await Promise.all([countDdfListings(), readSyncState()]);
  return Response.json({
    ok: !state.lastError,
    configured: true,
    count,
    mode: state.mode,
    client: "repl-1",
    deletedReady: state.masterComplete,
    message: state.lastError,
  });
}
