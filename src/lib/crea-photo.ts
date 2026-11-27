/** Swap a CREA DDF photo URL to the CDN size. Unknown URLs stay unchanged. */
export function creaPhotoUrl(url: string, size: "med" | "high" = "high"): string {
  if (!url || !/\/(highres|medres|lowres)\//.test(url)) return url;
  const token = size === "med" ? "/medres/" : "/highres/";
  return url.replace(/\/(highres|medres|lowres)\//, token);
}
