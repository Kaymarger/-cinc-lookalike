/** Public lead-site Meta Pixel. The env value wins; this is the site's own pixel. */
export const META_PIXEL_FALLBACK = "1412153377363377";

export function resolveMetaPixelId(envValue?: string | null): string {
  const value = (envValue || "").trim();
  if (/^\d{8,20}$/.test(value)) return value;
  return META_PIXEL_FALLBACK;
}

export function metaPixelId(): string {
  return resolveMetaPixelId(
    process.env.NEXT_PUBLIC_META_PIXEL_ID || process.env.META_PIXEL_ID || ""
  );
}
