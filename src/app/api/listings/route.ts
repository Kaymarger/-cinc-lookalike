import { getDdfListing } from "@/lib/ddf/db";
import { getPropertyById } from "@/lib/search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") || "")
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
