import { ddfConfigured } from "@/lib/ddf/credentials";
import { countDdfListings, getDdfListing, searchDdfListings } from "@/lib/ddf/db";
import { syncDdfBatch } from "@/lib/ddf/sync";
import { getPropertyById, searchProperties } from "@/lib/search";
import type { Property, SearchFilters } from "@/lib/types";

let bootstrapped = false;

/** Pull one page when the feed is configured and Neon has no listings yet. */
export async function ensureDdfListings(): Promise<boolean> {
  if (!ddfConfigured()) return false;
  if ((await countDdfListings()) > 0) return true;
  if (bootstrapped) return false;
  bootstrapped = true;
  await syncDdfBatch({ budgetMs: 20_000, maxPages: 1 });
  return (await countDdfListings()) > 0;
}

export async function catalogSearch(filters: SearchFilters): Promise<{ properties: Property[]; total: number; live: boolean }> {
  if (ddfConfigured()) {
    await ensureDdfListings();
    const result = await searchDdfListings(filters);
    return { ...result, live: true };
  }
  const properties = searchProperties(filters);
  return { properties, total: properties.length, live: false };
}

export async function catalogListing(id: string): Promise<Property | null> {
  if (ddfConfigured()) {
    const listing = await getDdfListing(id);
    if (listing) return listing;
  }
  return getPropertyById(id) ?? null;
}
