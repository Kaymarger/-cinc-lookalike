import { timingSafeEqual } from "node:crypto";
import { buildMetaLeadEvent } from "@/lib/meta-capi";
import { postMetaEvents } from "@/lib/meta-capi-send";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = (process.env.META_CAPI_DRY_RUN_SECRET || "").trim();
  const given = (request.headers.get("x-capi-dry-run") || "").trim();
  if (!secret || !given) return false;
  const left = Buffer.from(secret);
  const right = Buffer.from(given);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Sends one synthetic Lead with test_event_code.
 * The real lead path never adds that field. This route is off unless both secrets are set.
 */
export async function POST(request: Request) {
  if (!authorized(request)) {
    return Response.json({ ok: false }, { status: 404 });
  }
  const testCode = (process.env.META_CAPI_TEST_EVENT_CODE || "").trim();
  if (!testCode) {
    return Response.json({ ok: false, message: "Test event code is not set." }, { status: 400 });
  }
  const event = buildMetaLeadEvent({
    eventId: `dry-${crypto.randomUUID()}`,
    sourceUrl: "https://vancouverpropertysearch.ca/start",
    email: "capi-dry-run@example.com",
    phone: "6045550199",
    name: "Dry Run",
    city: "Vancouver",
    ip: "127.0.0.1",
    userAgent: "capi-dry-run",
    externalId: "dry-run",
  });
  if (!event) {
    return Response.json({ ok: false }, { status: 500 });
  }
  const result = await postMetaEvents([event], testCode);
  return Response.json({
    ok: result.status >= 200 && result.status < 300 && result.eventsReceived === 1,
    status: result.status,
    eventsReceived: result.eventsReceived ?? 0,
  });
}
