import { fetchListingDetail, fetchListingsByMls } from "@/lib/ddf/client";
import { pullAreaIntoSearch } from "@/lib/ddf/areas";
import { ddfConfigured } from "@/lib/ddf/credentials";
import { featuredDdfListingsByMls, getDdfListing, searchDdfListings, upsertDdfListings } from "@/lib/ddf/db";
import { activeFeaturedMlsIds } from "@/lib/featured-source";
import type { Property, SearchFilters } from "@/lib/types";

const detailReads = new Map<string, Promise<void>>();

async function refreshListingDetails(id: string): Promise<void> {
  const detail = await fetchListingDetail(id);
  if (detail) await upsertDdfListings([detail]);
}

export async function catalogSearch(filters: SearchFilters): Promise<{ properties: Property[]; total: number; live: boolean }> {
  if (!ddfConfigured()) return { properties: [], total: 0, live: false };
  let result = await searchDdfListings(filters);
    const needle = filters.q?.trim() || "";
    const placeName = needle.length >= 4 && !/^\d/.test(needle) && !/^[a-z]\d{4,}/i.test(needle);
    const unlabeled = result.properties.length > 0 && result.properties.every((property) => !property.neighborhood);
    if (placeName && (result.total === 0 || unlabeled) && (filters.page || 1) === 1) {
      const pulled = await Promise.race([
        pullAreaIntoSearch(needle).catch(() => 0),
        new Promise<number>((resolve) => setTimeout(() => resolve(0), 3500)),
      ]);
      if (pulled > 0) result = await searchDdfListings(filters);
    }
    return {
    properties: result.properties.map((property) => ({ ...property, images: property.images.slice(0, 1) })),
    total: result.total,
    live: true,
  };
}

/** Active listings featured on Casey Archibald's public site, matched to CREA rows. */
export async function catalogFeatured(limit = 12): Promise<Property[]> {
  if (!ddfConfigured()) return [];
  const ids = await activeFeaturedMlsIds();
  if (!ids?.length) return [];
  let live = await featuredDdfListingsByMls(ids);
  const have = new Set(live.map((property) => property.mlsNumber.toUpperCase()));
  const missing = ids.filter((id) => !have.has(id));
  if (missing.length) {
    try {
      const pulled = await Promise.race([
        fetchListingsByMls(missing),
        new Promise<Awaited<ReturnType<typeof fetchListingsByMls>>>((resolve) => setTimeout(() => resolve([]), 8000)),
      ]);
      if (pulled.length) {
        await upsertDdfListings(pulled);
        live = await featuredDdfListingsByMls(ids);
      }
    } catch {
      live = await featuredDdfListingsByMls(ids);
    }
  }
  return live.slice(0, limit).map((property) => ({ ...property, images: property.images.slice(0, 1) }));
}

export async function catalogListing(id: string): Promise<Property | null> {
  if (!ddfConfigured()) return null;
    let listing = await getDdfListing(id);
    if (listing && !listing.detailsSynced) {
      const listingId = listing.id;
      let pending = detailReads.get(listingId);
      if (!pending) {
        pending = refreshListingDetails(listingId).finally(() => detailReads.delete(listingId));
        detailReads.set(listingId, pending);
      }
      await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 2500))]);
      listing = (await getDdfListing(id)) || listing;
    }
    if (listing) return listing;
  return null;
}
