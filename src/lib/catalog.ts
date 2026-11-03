import { fetchListingDetail } from "@/lib/ddf/client";
import { pullAreaIntoSearch } from "@/lib/ddf/areas";
import { ddfConfigured } from "@/lib/ddf/credentials";
import { featuredDdfListings, getDdfListing, searchDdfListings, upsertDdfListings } from "@/lib/ddf/db";
import { getPropertyById, searchProperties } from "@/lib/search";
import type { Property, SearchFilters } from "@/lib/types";

const detailReads = new Map<string, Promise<void>>();

async function refreshListingDetails(id: string): Promise<void> {
  const detail = await fetchListingDetail(id);
  if (detail) await upsertDdfListings([detail]);
}

export async function catalogSearch(filters: SearchFilters): Promise<{ properties: Property[]; total: number; live: boolean }> {
  if (ddfConfigured()) {
    let result = await searchDdfListings(filters);
    const needle = filters.q?.trim() || "";
    const placeName = needle.length >= 4 && !/^\d/.test(needle) && !/^[a-z]\d{4,}/i.test(needle);
    if (placeName && result.total === 0 && (filters.page || 1) === 1) {
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
  const properties = searchProperties(filters);
  return { properties, total: properties.length, live: false };
}

/** Team listings first, then the newest Greater Vancouver homes. */
export async function catalogFeatured(limit = 12): Promise<Property[]> {
  if (ddfConfigured()) {
    const live = await featuredDdfListings(limit);
    if (live.length) return live.map((property) => ({ ...property, images: property.images.slice(0, 1) }));
  }
  return searchProperties({ sort: "newest" }).slice(0, limit);
}

export async function catalogListing(id: string): Promise<Property | null> {
  if (ddfConfigured()) {
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
  }
  return getPropertyById(id) ?? null;
}
