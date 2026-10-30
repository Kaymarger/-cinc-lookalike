import { trackEvent } from "@/lib/office-live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PIXEL = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  await trackEvent(id, "open");
  return new Response(PIXEL, { headers: { "content-type": "image/gif", "cache-control": "no-store" } });
}
