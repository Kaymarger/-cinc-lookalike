import { creaPhotoUrl } from "@/lib/crea-photo";

/** CREA listing photo. Loaded from the listing CDN, never through /_next/image. */
export function ListingPhoto({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  variant = "full",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  /** card = small CDN file. responsive = small on phones, full on desktop. full = original highres. */
  variant?: "card" | "responsive" | "full";
}) {
  if (!src || src.includes("/_next/image")) return null;
  const full = creaPhotoUrl(src, "high");
  const med = creaPhotoUrl(src, "med");
  const loading = priority ? "eager" : "lazy";
  const fetchPriority = priority ? "high" : "low";
  if (variant === "responsive" && med !== full) {
    return (
      <picture>
        <source media="(min-width: 768px)" srcSet={full} />
        <img
          src={med}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          className={className}
        />
      </picture>
    );
  }
  const chosen = variant === "card" ? med : full;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={chosen}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      fetchPriority={fetchPriority}
      decoding="async"
      className={className}
    />
  );
}
