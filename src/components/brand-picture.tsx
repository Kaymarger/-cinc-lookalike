/** Brand art as AVIF, then WebP, then the original file. Not routed through the image optimizer. */
export function BrandPicture({
  name,
  fallback,
  alt,
  width,
  height,
  className,
  pictureClassName,
  priority = false,
}: {
  name: string;
  fallback: "jpg" | "png" | "gif";
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  pictureClassName?: string;
  priority?: boolean;
}) {
  const base = `/brand/${name}`;
  return (
    <>
      {priority ? (
        <link rel="preload" as="image" href={`${base}.avif`} type="image/avif" fetchPriority="high" />
      ) : null}
      <picture className={pictureClassName}>
        <source srcSet={`${base}.avif`} type="image/avif" />
        <source srcSet={`${base}.webp`} type="image/webp" />
        <img
          src={`${base}.${fallback}`}
          alt={alt}
          width={width}
          height={height}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={className}
        />
      </picture>
    </>
  );
}
