"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Bath,
  BedDouble,
  Maximize,
} from "lucide-react";
import { CompareToggle } from "@/components/compare-toggle";
import { PropertyNotes } from "@/components/property-notes";
import { LeadDialog } from "@/components/lead-dialog";
import { MortgageCalculator } from "@/components/mortgage-calculator";
import { PhotoGallery } from "@/components/photo-gallery";
import { PropertyCard } from "@/components/property-card";
import { PropertyInquirySidebar } from "@/components/property-inquiry-sidebar";
import { SaveHomeButton } from "@/components/save-home-button";
import { ShareListing } from "@/components/share-listing";
import { TrackView } from "@/components/track-view";
import { ViewGate } from "@/components/view-gate";
import { DdfDisclaimer, RealtorBadge } from "@/components/ddf-attribution";
import { listingKeyFacts, formatPrice, formatSqft, fullAddress, getSimilarProperties } from "@/lib/search";
import { SITE } from "@/lib/site";
import type { Property } from "@/lib/types";

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

function SummaryBar({ property }: { property: Property }) {
  return (
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
        {property.sqft > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <Maximize className="size-4 text-[var(--cedar)]" />
            {property.sqft.toLocaleString("en-CA")} sqft
          </span>
        ) : null}
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
  );
}

export function PropertyDetail({ property }: { property: Property }) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [pinBar, setPinBar] = useState(false);
  const [headerOffset, setHeaderOffset] = useState(75);
  useEffect(() => {
    const header = document.getElementById("header");
    const measure = () => setHeaderOffset(header?.offsetHeight ?? 75);
    const onScroll = () => {
      measure();
      const bottom = galleryRef.current?.getBoundingClientRect().bottom ?? Number.POSITIVE_INFINITY;
      setPinBar(bottom <= (header?.offsetHeight ?? 75));
    };
    onScroll();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);
  const similar = property.feed === "ddf" ? [] : getSimilarProperties(property);
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
    ...(facts.annualTax != null
      ? [{ label: "Est. Annual Tax:", value: formatPrice(facts.annualTax) }]
      : []),
    {
      label: "$ / SqFt:",
      value: formatPrice(facts.pricePerSqft),
    },
  ];

  const land = [
    { label: "Lot Features:", value: property.features.filter((feature) => /yard|garden|lot|view/i.test(feature)).join(", ") || "See listing" },
    { label: "Community:", value: property.neighborhood || property.city },
    { label: "Zoning:", value: attached ? "Multi-family" : "Residential" },
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
    <div className="min-h-full w-full overflow-x-clip bg-white">
      <TrackView propertyId={property.id} />
      <ViewGate propertyId={property.id} />

      <div className="details-toolbar hidden border-b border-[#e8eef3] bg-white md:block">
        <SummaryBar property={property} />
      </div>
      {pinBar ? (
        <div
          className="details-toolbar fixed inset-x-0 z-30 hidden border-b border-[#e8eef3] bg-white shadow-sm md:block"
          style={{ top: headerOffset }}
        >
          <SummaryBar property={property} />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-[1200px] bg-white px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:pb-6">
        <div ref={galleryRef}>
        <PhotoGallery
          images={property.images}
          alt={property.address}
          virtualTour={property.virtualTour}
          propertyAddress={property.address}
          propertyId={property.id}
          lat={property.lat}
          lng={property.lng}
        />
        </div>

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
                  {property.neighborhood ? `${property.neighborhood}, ` : ""}
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
              {property.sqft > 0 ? (
                <span className="inline-flex items-center gap-2">
                  <Maximize className="size-5 text-[var(--cedar)]" />
                  {formatSqft(property.sqft)}
                </span>
              ) : null}
            </div>

            <ListingExtras property={property} />

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
                {(property.feed === "ddf"
                  ? snapshot.filter((row) => {
                      if (row.label === "Year Built:" && property.yearBuilt <= 0) return false;
                      if (row.label === "Square Footage:" && property.sqft <= 0) return false;
                      if (row.label === "Community:") return false;
                      return Boolean(row.value);
                    })
                  : snapshot
                ).map((row) => (
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
              <FactGroup title="Land" rows={land} />
              <FactGroup title="Listing" rows={listing} />
              <FactGroup title="Money" rows={money} />
              <FactGroup title="Structures" rows={structures} />
              <FactGroup title="Systems" rows={systems} />
            </div>
            {property.feed === "ddf" ? (
              <div className="mt-8 space-y-4">
                <p className="text-[14px] text-[#333]">Listing brokerage: {property.brokerage}</p>
                <RealtorBadge href={property.realtorUrl || ""} />
                <DdfDisclaimer />
              </div>
            ) : null}

            {property.features.length > 0 ? (
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
            ) : null}

            <div id="request-showing" className="mt-8 flex flex-wrap gap-3">
              <LeadDialog
                triggerLabel="Request a showing"
                propertyAddress={property.address}
                propertyId={property.id}
                source="showing_request"
              />
              <CompareToggle
                property={property}
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
                Listing provided by {property.brokerage}. Confirm price and
                availability with the office before you rely on it. Full address:{" "}
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
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <a className="inline-flex h-10 items-center justify-center border border-[#04427d] text-[#04427d]" href={`tel:${SITE.phoneTel}`}>Call</a>
                <a className="inline-flex h-10 items-center justify-center border border-[#04427d] text-[#04427d]" href={`sms:${SITE.phoneTel}`}>Text</a>
                <a className="inline-flex h-10 items-center justify-center border border-[#04427d] text-[#04427d]" href="/contact#inquiry">Email</a>
                <a className="inline-flex h-10 items-center justify-center bg-[#04427d] text-white" href="#request-showing">Schedule</a>
              </div>
            </div>
          </aside>
        </div>

        <PropertyNotes propertyId={property.id} address={property.address} />
        <div className="mt-12">
          <MortgageCalculator price={property.price} />
        </div>
        <section className="mt-10 flex flex-col gap-4 border border-[#e5e5e5] bg-white p-5 sm:flex-row sm:items-center">
          <Image src="/brand/casey.jpg" alt="Casey Archibald" width={96} height={96} className="size-24 object-cover" />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-[#222]">{SITE.agent}</p>
            <p className="text-sm text-[#555]">{SITE.company}</p>
            <p className="mt-1 text-sm"><a className="text-[#04427d]" href={`tel:${SITE.phoneTel}`}>{SITE.phoneDisplay}</a></p>
            <p className="text-sm"><a className="text-[#04427d]" href="/contact#inquiry">Email Casey</a></p>
          </div>
          <div className="w-full sm:w-44">
            <LeadDialog triggerLabel="Contact" propertyAddress={property.address} propertyId={property.id} source="ask_question" />
          </div>
        </section>

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

function videoEmbed(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (youtube) return `https://www.youtube.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function ListingExtras({ property }: { property: Property }) {
  const houses = property.openHouses ?? [];
  const plans = property.floorPlans ?? [];
  const embed = property.videoUrl ? videoEmbed(property.videoUrl) : null;
  if (!houses.length && !property.virtualTourUrl && !property.videoUrl && !plans.length) return null;
  return (
    <div className="mt-8 space-y-8">
      {houses.length > 0 ? (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">Open houses</h2>
          <ul className="mt-3 space-y-2">
            {houses.map((house) => (
              <li key={`${house.date}-${house.start}`} className="border border-[#e5e5e5] bg-[var(--mist)] px-3 py-2 text-sm text-[#333]">
                <span className="font-semibold text-[var(--cedar)]">
                  {[house.date, house.start && house.end ? `${house.start}–${house.end}` : house.start].filter(Boolean).join(" · ")}
                </span>
                {house.remarks ? <span className="mt-1 block text-[#555]">{house.remarks}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {property.virtualTourUrl ? (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">Virtual tour</h2>
          <a href={property.virtualTourUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 items-center bg-[var(--cedar)] px-4 text-sm font-semibold text-white">
            Open virtual tour
          </a>
        </section>
      ) : null}
      {property.videoUrl ? (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">Video</h2>
          {embed ? (
            <iframe title="Listing video" src={embed} className="mt-3 aspect-video w-full max-w-2xl border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <a href={property.videoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-[var(--cedar)] underline">
              Watch the video
            </a>
          )}
        </section>
      ) : null}
      {plans.length > 0 ? (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222]">Floor plans</h2>
          <ul className="mt-3 space-y-3">
            {plans.map((plan) => (
              <li key={plan.url}>
                {/\.(jpe?g|png|webp|gif)(\?|$)/i.test(plan.url) ? (
                  // Floor-plan files are hosted by the listing feed.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={plan.url} alt={plan.label} className="max-h-80 w-auto max-w-full border border-[#eee]" />
                ) : (
                  <a href={plan.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[var(--cedar)] underline">
                    {plan.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
