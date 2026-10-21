import Image from "next/image";
import Link from "next/link";
import { SaveHomeButton } from "@/components/save-home-button";
import { propertyHref } from "@/lib/listing-url";
import type { Property } from "@/lib/types";
import { formatPrice, formatSqft } from "@/lib/search";
import { cn } from "@/lib/utils";

export function PropertyCard({
  property,
  priority = false,
  className,
  layout = "grid",
}: {
  property: Property;
  priority?: boolean;
  className?: string;
  /** grid = featured/home cards; list = search column (CINC card--property2) */
  layout?: "grid" | "list";
}) {
  const bedsLabel =
    property.beds === 1 ? "1 Bed" : `${property.beds} Beds`;
  const bathsLabel =
    property.baths === 1 ? "1 Bath" : `${property.baths} Baths`;

  return (
    <div
      className={cn(
        "card--property2 group relative overflow-hidden rounded-2xl bg-white",
        layout === "list" && "border border-[#e8e8e8] shadow-sm",
        layout === "grid" && "shadow-sm ring-1 ring-[#e8eef3]",
        className
      )}
      data-pdid={property.id}
    >
      <Link
        href={propertyHref(property)}
        className="absolute inset-0 z-[1]"
        aria-label={`${property.address} — ${formatPrice(property.price)}`}
      />
      <div className="property-content">
        <div
          className={cn(
            "property-image-wrapper relative aspect-[4/3] overflow-hidden bg-[#eee]",
            layout === "list" && "aspect-[16/10] rounded-t-2xl",
            layout === "grid" && "rounded-t-2xl"
          )}
        >
          <Image
            src={property.images[0]}
            alt={property.address}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="property-image object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            priority={priority}
          />
          {property.virtualTour && (
            <span className="badge--virtual-tour absolute bottom-2 left-2 z-[2] bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Virtual Tour
            </span>
          )}
          {property.listedDaysAgo <= 7 && property.status === "Active" && (
            <span className="absolute top-2 left-2 z-[2] bg-[var(--cedar)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>

        <div
          className={cn(
            "property-info",
            layout === "grid" ? "p-3.5 pt-3" : "p-3 sm:p-3.5"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="property-price whitespace-nowrap font-[family-name:var(--font-display)] text-[22px] font-medium leading-none text-[var(--cedar)]">
              {formatPrice(property.price)}
            </p>
            <div className="property-interactions relative z-[2]">
              <SaveHomeButton propertyId={property.id} />
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-0.5">
            <p className="property-address text-[13px] leading-snug text-[#444]">
              {property.address}, {property.city}, {property.province}{" "}
              {property.postalCode}
            </p>
            <div className="text-right text-[13px] leading-snug text-[#444]">
              <p className="property-address">{formatSqft(property.sqft)}</p>
              <p className="property-bdba">
                {bedsLabel} | {bathsLabel}
              </p>
            </div>
          </div>

          <div className="property-mls mt-auto flex items-center gap-2 border-t border-[#eee] pt-2.5 text-[11px] text-[#777] mt-3">
            <Image
              src="/brand/mls-vancouver.gif"
              alt="MLS®"
              width={32}
              height={30}
              unoptimized
              className="h-[22px] w-auto"
            />
            <span className="leading-tight">
              Listing Provided By {property.brokerage}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
