import type { Metadata } from "next";
import Link from "next/link";
import { HomeEstimateHero } from "@/components/home-estimate-hero";
import { PageAssist } from "@/components/page-assist";
import { StandaloneMortgageCalculator } from "@/components/standalone-mortgage-calculator";

export const metadata: Metadata = {
  title: "What's Your Home Worth | Home Value Calculator",
  description:
    "See what your home is worth in today's market with our easy-to-use Home Value Calculator.",
};

export default function HomeValueCalculatorPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <HomeEstimateHero
        title="What's your home worth | Home Value Calculator"
        subtitle="See what your home is worth in today's market with our easy-to-use Home Value Calculator. Get your estimated value instantly."
        ctaLabel="Show Me My Home's Value!"
      />
      <div className="mx-auto max-w-[720px] px-4 py-12 sm:px-6">
        <StandaloneMortgageCalculator />
        <p className="mt-8 text-center text-sm text-[#666]">
          Want Casey to prepare a full CMA?{" "}
          <Link
            href="/seller/homeestimate/homevaluation"
            className="text-[var(--cedar)] hover:underline"
          >
            Request a home valuation
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
