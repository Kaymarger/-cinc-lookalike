import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CamelotPageHeader } from "@/components/camelot-page-header";

export const metadata: Metadata = {
  title: "Selling Your Home",
  description:
    "Sell with Archibald Real Estate Group — home estimate, pricing strategy, and marketing across Greater Vancouver.",
};

const POINTS = [
  {
    title: "Market estimate / CMA",
    body: "Complimentary pricing guidance grounded in recent neighbourhood sales.",
  },
  {
    title: "Launch strategy",
    body: "Staging advice, timing, and a clear plan before your home hits the market.",
  },
  {
    title: "Marketing reach",
    body: "Professional photography and distribution across the channels buyers use.",
  },
  {
    title: "Offer management",
    body: "Negotiation and subject-removal support from a Presidents Club agent.",
  },
];

export default function SellingPage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader />
      <section className="relative isolate overflow-hidden">
        <Image
          src="/brand/hero.jpg"
          alt=""
          fill
          className="object-cover object-[center_40%]"
          sizes="100vw"
          priority
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(100deg,rgba(4,66,125,0.92)_0%,rgba(52,152,216,0.72)_60%,rgba(0,0,0,0.4)_100%)]"
        />
        <div className="relative z-10 mx-auto max-w-[1000px] px-4 py-16 sm:px-6 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/85">
            Sellers
          </p>
          <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-accent)] text-3xl font-normal text-white sm:text-4xl md:text-5xl">
            Selling your Greater Vancouver home
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/90 sm:text-base">
            Pricing, preparation, and presentation — Casey Archibald markets
            listings so they stand out whether you’re upsizing, downsizing, or
            relocating.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/seller/homeestimate/homevaluation"
              className="inline-flex h-11 items-center bg-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--cedar-deep)] hover:bg-[#edf5fd]"
            >
              Get a Home Estimate
            </Link>
            <Link
              href="/seller/homeestimate/calculator"
              className="inline-flex h-11 items-center border border-white px-6 text-sm font-semibold uppercase tracking-[0.08em] text-white hover:bg-white/10"
            >
              Home Value Calculator
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
        <h2 className="title-underline relative w-fit pb-3 font-[family-name:var(--font-display)] text-2xl text-[#222]">
          What’s included
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-[3px] w-14 bg-[var(--cedar)]"
          />
        </h2>
        <ul className="mt-8 grid gap-0 sm:grid-cols-2">
          {POINTS.map((item) => (
            <li
              key={item.title}
              className="border border-[#e5e5e5] p-5 sm:odd:border-r-0 sm:[&:nth-child(-n+2)]:border-b-0"
            >
              <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--cedar)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#666]">
                {item.body}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <Link
            href="/contact"
            className="inline-flex h-11 items-center border border-[var(--cedar)] px-6 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--cedar)] hover:bg-[#edf5fd]"
          >
            Contact Casey
          </Link>
        </div>
      </div>
    </div>
  );
}
