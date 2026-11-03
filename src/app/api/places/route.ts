import { suggestablePlaces, warmNeighbourhoodNames } from "@/lib/ddf/areas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET() {
  await warmNeighbourhoodNames(3000).catch(() => undefined);
  const places = await suggestablePlaces();
  return Response.json({
    places: places.map((place) => ({ label: place.label, city: place.city, kind: place.kind })),
  });
}
