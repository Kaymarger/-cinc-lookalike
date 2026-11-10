import Image from "next/image";
import Link from "next/link";
import { SaveHomeButton } from "@/components/save-home-button";
import { CompareToggle } from "@/components/compare-toggle";
import { useCompare } from "@/lib/compare";
import { propertyHref } from "@/lib/listing-url";
import type { Property } from "@/lib/types";
import { RealtorBadge } from "@/components/ddf-attribution";
import { formatPrice, formatSqft } from "@/lib/search";
import { weekendOpenHouseLabel } from "@/lib/weekend-open-house";
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
  const weekend = weekendOpenHouseLabel(property.openHouses);
  const { ready, isCompared } = useCompare();
  const selected = ready && isCompared(property.id);

  return (
    <div
      className={cn(
        "card--property2 group relative overflow-hidden rounded-[3px] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]",
        selected && "ring-2 ring-[#1976d2]",
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
            "property-image-wrapper relative mx-2 mt-2 h-[200px] overflow-hidden bg-[#7b97aa]"
          )}
        >
          {property.images[0] ? (
            <Image
              src={property.images[0]}
              alt={property.address}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="property-image object-cover"
              priority={priority}
              unoptimized={property.images[0].startsWith("http") && !property.images[0].includes("ddfcdn.realtor.ca")}
            />
          ) : (
            <div className="grid h-full place-items-center text-[13px] text-white">No photo supplied</div>
          )}
          {property.virtualTour && (
            <span className="badge--virtual-tour absolute bottom-2 left-2 z-[2] bg-black/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              Virtual Tour
            </span>
          )}
          {weekend ? (
            <span className="absolute top-2 right-2 z-[2] max-w-[70%] bg-[#04427d] px-2 py-1 text-left text-[11px] font-semibold text-white">
              {weekend}
            </span>
          ) : null}
            {property.listedDaysAgo <= 7 && property.status === "Active" ? (
            <span className="absolute top-2 left-2 z-[2] bg-[var(--cedar)] px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
              New
            </span>
          ) : null}
        </div>

        <div
          className={cn(
            "property-info",
            layout === "grid" ? "p-3.5 pt-3" : "p-3 sm:p-3.5"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="property-price whitespace-nowrap text-[21px] leading-[1.7] text-[#1976d2]">
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
              <p className="property-address">{property.sqft > 0 ? formatSqft(property.sqft) : ""}</p>
              <p className="property-bdba">
                {bedsLabel} | {bathsLabel}
              </p>
            </div>
          </div>

          <p className="mt-2 text-[12px] leading-snug text-[#3d5160]">
            {property.mlsNumber}
            {property.neighborhood ? ` · ${property.neighborhood}` : ""}
            {property.propertyType ? ` · ${property.propertyType}` : ""}
            {property.yearBuilt > 0 ? ` · ${property.yearBuilt}` : ""}
            {property.listedDaysAgo > 0
              ? ` · ${property.listedDaysAgo} day${property.listedDaysAgo === 1 ? "" : "s"} on site`
              : ""}
          </p>

          <div className="property-mls relative z-[2] mt-3 flex items-center gap-2 border-t border-[#eee] pt-2.5 text-[12px] text-[#3d5160]">
            <Image
              src="/brand/mls-vancouver.gif"
              alt="MLS®"
              width={32}
              height={30}
              unoptimized
              className="h-[22px] w-auto"
            />
            <span className="leading-tight">
              Listing brokerage: {property.brokerage || "See listing"}
              {property.feed === "ddf" ? (
                <span className="mt-1 block">
                  <RealtorBadge href={property.realtorUrl || ""} />
                </span>
              ) : null}
            </span>
          </div>
          <div className="relative z-[2] mt-3">
            <CompareToggle property={property} className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
