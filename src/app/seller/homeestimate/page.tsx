import type { Metadata } from "next";
import Link from "next/link";
import { HomeEstimateHero } from "@/components/home-estimate-hero";
import { PageAssist } from "@/components/page-assist";

export const metadata: Metadata = {
  title: "Home Estimate - Find out what your home is worth",
  description:
    "Thinking of selling or interested in learning about a neighbor's house? Get a complimentary market estimate from Archibald Real Estate Group.",
};

export default function HomeEstimatePage() {
  return (
    <div className="bg-white" id="sell-home-link">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <HomeEstimateHero
        title="What's your home worth?"
        subtitle="Thinking of selling or interested in learning about a neighbor's house? We can help you see what it's worth."
        ctaLabel="Submit"
      />
      <div className="mx-auto max-w-[800px] px-4 py-12 text-center sm:px-6">
        <p className="text-[15px] text-[#555]">
          Prefer a payment estimate instead? Try the{" "}
          <Link
            href="/seller/homeestimate/calculator"
            className="text-[var(--cedar)] hover:underline"
          >
            Home Value Calculator
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
