import { ddfConfigured } from "@/lib/ddf/credentials";
import { countDdfListings, countListingsMissingBrokerage, getDdfListing, readSyncState, searchDdfListings } from "@/lib/ddf/db";
import { syncDdfBatch } from "@/lib/ddf/sync";
import { getPropertyById, searchProperties } from "@/lib/search";
import type { Property, SearchFilters } from "@/lib/types";

/** Pull one page when the feed is configured and Neon has no listings yet. */
export async function ensureDdfListings(): Promise<boolean> {
  if (!ddfConfigured()) return false;
  const count = await countDdfListings();
  const missingOffice = count > 0 ? await countListingsMissingBrokerage() : 0;
  if (count > 0 && missingOffice === 0) return true;
  const state = await readSyncState();
  const updated = state.updatedAt ? new Date(state.updatedAt).getTime() : 0;
  if (count === 0 && updated && Date.now() - updated < 20_000) return false;
  await syncDdfBatch(missingOffice > 0 ? { budgetMs: 40_000, maxPages: 3 } : { budgetMs: 25_000, maxPages: 1 });
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
