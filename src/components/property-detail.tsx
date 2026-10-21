import Image from "next/image";
import Link from "next/link";
import {
  Bath,
  BedDouble,
  Maximize,
} from "lucide-react";
import { CompareToggle } from "@/components/compare-toggle";
import { LeadDialog } from "@/components/lead-dialog";
import { MortgageCalculator } from "@/components/mortgage-calculator";
import { PhotoGallery } from "@/components/photo-gallery";
import { PropertyCard } from "@/components/property-card";
import { PropertyInquirySidebar } from "@/components/property-inquiry-sidebar";
import { SaveHomeButton } from "@/components/save-home-button";
import { ShareListing } from "@/components/share-listing";
import { TrackView } from "@/components/track-view";
import { listingKeyFacts, formatPrice, formatSqft, fullAddress, getSimilarProperties } from "@/lib/search";
import type { Property } from "@/lib/types";

const BUYER_QUESTIONS = [
  "How much out-of-pocket expenses do I need to purchase a home?",
  "Does this home have any offers on it?",
  "How much down-payment would I need to buy?",
  "Do repairs come out of my pocket or the seller?",
  "Is now a good time to buy a home?",
];

function SnapshotRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_1.2fr] gap-2 border-b border-[#eee] py-2.5 text-sm">
      <dt className="font-semibold text-[#444]">{label}</dt>
      <dd className="text-[#555]">{value}</dd>
    </div>
  );
}

function FactGroup({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <h3 className="border-b border-[var(--cedar)] pb-2 font-[family-name:var(--font-display)] text-xl text-[var(--cedar)]">
        {title}
      </h3>
      <dl className="mt-1">
        {rows.map((row) => (
          <SnapshotRow key={row.label} label={row.label} value={row.value} />
        ))}
      </dl>
    </div>
  );
}

export function PropertyDetail({ property }: { property: Property }) {
  const similar = getSimilarProperties(property);
  const facts = listingKeyFacts(property);
  const attached =
    property.propertyType === "Condo" ||
    property.propertyType === "Apartment" ||
    property.propertyType === "Townhouse";
  const halfBaths = property.baths % 1 === 0.5 ? 1 : 0;

  const snapshot = [
    { label: "Price:", value: formatPrice(property.price) },
    { label: "Bedrooms:", value: String(property.beds) },
    { label: "Total Baths:", value: String(property.baths) },
    ...(halfBaths
      ? [{ label: "Half Baths:", value: String(halfBaths) }]
      : []),
    { label: "Square Footage:", value: property.sqft.toLocaleString("en-CA") },
    { label: "Year Built:", value: String(property.yearBuilt) },
    { label: "Listing ID #:", value: property.mlsNumber },
    { label: "Street Address:", value: property.address },
    { label: "City:", value: property.city },
    { label: "Province:", value: property.province },
    { label: "Postal Code:", value: property.postalCode },
    { label: "Community:", value: property.city },
    { label: "Listing Status:", value: property.status },
    { label: "Listing Type:", value: property.propertyType },
  ];

  const building = [
    {
      label: "Approximate Total Liveable Area:",
      value: `${property.sqft.toLocaleString("en-CA")}.0`,
    },
    {
      label: "Building Area Total:",
      value: `${property.sqft.toLocaleString("en-CA")}.0`,
    },
    {
      label: "Exterior Features:",
      value:
        property.features.filter((f) =>
          /balcony|patio|garden|yard|deck/i.test(f)
        ).join(", ") || "See listing features",
    },
    {
      label: "Interior Features:",
      value:
        property.features.filter((f) =>
          /elevator|fireplace|hardwood|kitchen|laundry/i.test(f)
        ).join(", ") || property.features.slice(0, 3).join(", "),
    },
    { label: "Year Built:", value: String(property.yearBuilt) },
    {
      label: "Structure:",
      value: attached ? "Residential Attached" : "Residential Detached",
    },
  ];

  const listing = [
    {
      label: "Association Amenities:",
      value: property.features.slice(0, 5).join(", "),
    },
    { label: "Originating System Name:", value: "Gvr" },
    { label: "Listing Brokerage:", value: property.brokerage },
  ];

  const money = [
    ...(facts.strataFee != null
      ? [
          {
            label: "Association Fee:",
            value: formatPrice(facts.strataFee),
          },
          { label: "Hoa Y/N:", value: "Yes" },
        ]
      : [{ label: "Hoa Y/N:", value: "No" }]),
    {
      label: "Ownership:",
      value: attached ? "Freehold Strata" : "Freehold",
    },
    {
      label: "Est. Annual Tax:",
      value: formatPrice(facts.annualTax),
    },
    {
      label: "$ / SqFt:",
      value: formatPrice(facts.pricePerSqft),
    },
  ];

  const structures = [
    {
      label: "Has Garage:",
      value: /garage/i.test(facts.parking) ? "Yes" : "No",
    },
    { label: "Parking Description:", value: facts.parking },
    {
      label: "Pool:",
      value: property.features.some((f) => /pool/i.test(f)) ? "Yes" : "No",
    },
  ];

  const systems = [
    {
      label: "Heating:",
      value:
        property.features.find((f) => /heat|radiant|furnace/i.test(f)) ??
        "See listing",
    },
    {
      label: "Laundry:",
      value: attached ? "In Unit" : "See listing",
    },
    {
      label: "Cooling System:",
      value: property.features.some((f) => /air|ac|cooling/i.test(f))
        ? "Central Air"
        : "None listed",
    },
  ];

  return (
    <div className="bg-white">
      <TrackView propertyId={property.id} />

      {/* Compact sticky summary — desktop/tablet */}
      <div className="details-toolbar sticky top-16 z-40 hidden border-b border-[#e8eef3] bg-white/95 shadow-sm backdrop-blur md:block sm:top-[72px]">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#333]">
            <span className="font-[family-name:var(--font-display)] text-xl font-medium text-[var(--cedar)] sm:text-2xl">
              {formatPrice(property.price)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BedDouble className="size-4 text-[var(--cedar)]" />
              {property.beds} beds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath className="size-4 text-[var(--cedar)]" />
              {property.baths} baths
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="size-4 text-[var(--cedar)]" />
              {property.sqft.toLocaleString("en-CA")} sqft
            </span>
            <span className="hidden text-[#666] lg:inline">
              {property.address}
            </span>
          </div>
          <div className="relative z-[2] flex items-center gap-2">
            <SaveHomeButton propertyId={property.id} />
            <ShareListing
              variant="icon"
              className="!text-[var(--cedar)] hover:!bg-[#edf5fd]"
              title={`${property.address} · ${formatPrice(property.price)}`}
            />
            <div className="hidden min-w-[160px] lg:block">
              <LeadDialog
                triggerLabel="Request a showing"
                propertyAddress={property.address}
                propertyId={property.id}
                source="showing_request"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-6">
        <PhotoGallery
          images={property.images}
          alt={property.address}
          virtualTour={property.virtualTour}
          propertyAddress={property.address}
          propertyId={property.id}
          lat={property.lat}
          lng={property.lng}
        />

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_0.75fr]">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--cedar)] sm:text-4xl">
                  {formatPrice(property.price)}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cedar)]">
                  {property.status}
                </p>
                <h1 className="mt-2 text-xl font-medium text-[#222] sm:text-2xl">
                  {property.address},
                  <br />
                  {property.city}, {property.province} {property.postalCode}
                </h1>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-6 border-y border-[#eee] py-4 text-[#333]">
              <span className="inline-flex items-center gap-2">
                <BedDouble className="size-5 text-[var(--cedar)]" />
                {property.beds} Beds
              </span>
              <span className="inline-flex items-center gap-2">
                <Bath className="size-5 text-[var(--cedar)]" />
                {property.baths} Baths
              </span>
              <span className="inline-flex items-center gap-2">
                <Maximize className="size-5 text-[var(--cedar)]" />
                {formatSqft(property.sqft)}
              </span>
            </div>

            {property.openHouse && (
              <p className="mt-5 inline-flex bg-[var(--mist)] px-3 py-2 text-sm font-medium text-[var(--cedar)]">
                Open house · {property.openHouse}
              </p>
            )}

            <section className="mt-10">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">
                About This Home
              </h2>
              <p className="mt-3 max-w-2xl leading-relaxed text-[#555]">
                {property.description}
              </p>
            </section>

            <section className="mt-10">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">
                Snapshot
              </h2>
              <dl className="mt-4 max-w-xl">
                {snapshot.map((row) => (
                  <SnapshotRow
                    key={row.label}
                    label={row.label}
                    value={row.value}
                  />
                ))}
              </dl>
            </section>

            <div className="mt-10 grid gap-10 sm:grid-cols-2">
              <FactGroup title="Building" rows={building} />
              <FactGroup title="Listing" rows={listing} />
              <FactGroup title="Money" rows={money} />
              <FactGroup title="Structures" rows={structures} />
              <FactGroup title="Systems" rows={systems} />
            </div>

            <section className="mt-10">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">
                Features
              </h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {property.features.map((feature) => (
                  <li
                    key={feature}
                    className="border-b border-[#eee] py-2 text-[#444]"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <LeadDialog
                triggerLabel="Request a showing"
                propertyAddress={property.address}
                propertyId={property.id}
                source="showing_request"
              />
              <CompareToggle
                propertyId={property.id}
                className="h-10 justify-center text-sm"
              />
            </div>

            <div className="mt-8 flex items-start gap-3 border-t border-[#eee] pt-6 text-xs text-[#777]">
              <Image
                src="/brand/mls-vancouver.gif"
                alt="MLS®"
                width={32}
                height={30}
                unoptimized
                className="mt-0.5 h-6 w-auto"
              />
              <p>
                Listing Provided By {property.brokerage}. Sample data for
                demonstration — not a live MLS® feed. Full address:{" "}
                {fullAddress(property)}.
              </p>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-36 lg:self-start">
            <PropertyInquirySidebar property={property} />

            <div className="border border-[#e5e5e5] bg-white p-5">
              <div className="flex items-center gap-3">
                <Image
                  src="/brand/casey.jpg"
                  alt="Casey Archibald"
                  width={64}
                  height={64}
                  className="size-14 object-cover"
                />
                <div>
                  <p className="font-semibold text-[#222]">Casey Archibald</p>
                  <p className="text-sm text-[var(--cedar)]">
                    Can Answer Your Questions
                  </p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {BUYER_QUESTIONS.map((q) => (
                  <li key={q}>
                    <LeadDialog
                      triggerLabel={q}
                      propertyAddress={property.address}
                      propertyId={property.id}
                      source="ask_question"
                      variant="outline"
                      className="!h-auto !w-full !justify-start !whitespace-normal !border-0 !bg-transparent !px-0 !py-1.5 !text-left !text-[13px] !font-normal !normal-case !tracking-normal !text-[var(--cedar)] hover:!bg-transparent hover:!underline"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        <div className="mt-12">
          <MortgageCalculator price={property.price} />
        </div>

        {similar.length > 0 && (
          <section className="mt-16 border-t border-[#eee] pt-12">
            <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
              Similar listings
            </h2>
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

        <p className="mt-12 text-center text-sm text-[#666]">
          <Link href="/search" className="text-[var(--cedar)] hover:underline">
            ← Back to search
          </Link>
        </p>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e8eef3] bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-[var(--cedar)]">
              {formatPrice(property.price)}
            </p>
            <p className="truncate text-xs text-[#666]">
              {property.beds} bd · {property.baths} ba · {property.address}
            </p>
          </div>
          <SaveHomeButton propertyId={property.id} />
          <div className="w-[148px] shrink-0">
            <LeadDialog
              triggerLabel="Ask / tour"
              propertyAddress={property.address}
              propertyId={property.id}
              source="showing_request"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
