import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CamelotPageHeader } from "@/components/camelot-page-header";
import { ContactInquiryForm } from "@/components/contact-inquiry-form";

export const metadata: Metadata = {
  title: "Buying a Home",
  description:
    "Buying guide for Greater Vancouver — work with Casey Archibald at Archibald Real Estate Group.",
};

const STEPS = [
  {
    title: "Get pre-approved",
    body: "Know your budget and payment comfort zone before you shop. We can introduce trusted local lenders.",
  },
  {
    title: "Search with intention",
    body: "Use filters, map view, and saved-search alerts so new listings that match your criteria find you first.",
  },
  {
    title: "Tour and compare",
    body: "Request showings from any listing page. Shortlist favourites and compare side-by-side.",
  },
  {
    title: "Offer with confidence",
    body: "Casey negotiates strategy, subjects, and timing in Vancouver’s competitive market.",
  },
];

export default function BuyingPage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader />
      <section className="relative isolate overflow-hidden">
        <Image
          src="/brand/hero.jpg"
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(4,66,125,0.92)_0%,rgba(52,152,216,0.75)_55%,rgba(0,0,0,0.45)_100%)]"
        />
        <div className="relative z-10 mx-auto max-w-[1000px] px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
            Buyers
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-accent)] text-3xl font-normal text-white sm:text-4xl md:text-5xl">
            Buying in Greater Vancouver
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/90 sm:text-base">
            From first search to keys in hand, Archibald Real Estate Group
            guides buyers through Metro Vancouver’s fast-moving market.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="inline-flex h-11 items-center bg-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--cedar-deep)] hover:bg-[#edf5fd]"
            >
              Search Homes
            </Link>
            <Link
              href="/neighborhoods"
              className="inline-flex h-11 items-center border border-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10"
            >
              Browse Neighbourhoods
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
        <h2 className="title-underline relative w-fit pb-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
          How we help buyers
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[3px] w-14 bg-[var(--cedar)]"
          />
        </h2>
        <ol className="mt-8 grid gap-0 sm:grid-cols-2">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="border border-[#e5e5e5] p-5 sm:odd:border-r-0 sm:[&:nth-child(-n+2)]:border-b-0"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--cedar)]">
                Step {i + 1}
              </p>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-lg text-[#222]">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 max-w-lg">
          <ContactInquiryForm
            source="general"
            heading="Talk to Casey about buying"
          />
        </div>
      </div>
    </div>
  );
}
