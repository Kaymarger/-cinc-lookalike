import { trackEvent } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await trackEvent(id, "click");
  const next = new URL(request.url).searchParams.get("next");
  if (next && /^https:\/\//.test(next)) return Response.redirect(next);
  return Response.json({ ok: true });
}
