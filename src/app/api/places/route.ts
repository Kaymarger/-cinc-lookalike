import { suggestablePlaces } from "@/lib/ddf/areas";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET() {
  const places = await suggestablePlaces();
  return Response.json(
    {
      places: places.map((place) => ({ label: place.label, city: place.city, kind: place.kind })),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
