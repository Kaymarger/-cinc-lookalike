import { getDdfListing, searchDdfListings } from "@/lib/ddf/db";
import { getPropertyById } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("preview") === "1") {
    const found = await searchDdfListings({ sort: "newest" }, 6).catch(() => ({ properties: [] }));
    return Response.json({
      ok: true,
      properties: found.properties.slice(0, 6).map((property) => ({
        id: property.id,
        address: property.address,
        price: property.price,
        beds: property.beds,
        baths: property.baths,
        image: property.images[0] || "",
        city: property.city,
      })),
    });
  }
  const ids = (url.searchParams.get("ids") || "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 40);
  const properties = [];
  for (const id of ids) {
    const listing = (await getDdfListing(id)) || getPropertyById(id) || null;
    if (listing) properties.push(listing);
  }
  return Response.json({ ok: true, properties });
}
