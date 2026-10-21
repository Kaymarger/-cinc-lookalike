import type { Metadata } from "next";
import Link from "next/link";
import { CamelotPageHeader } from "@/components/camelot-page-header";
import { StandaloneMortgageCalculator } from "@/components/standalone-mortgage-calculator";

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description:
    "Estimate monthly payments for Greater Vancouver home purchases. Demo rates only.",
};

export default function MortgagePage() {
  return (
    <div className="bg-white">
      <CamelotPageHeader
        title="Mortgage Calculator"
        subtitle="Rough Canadian payment scenarios for planning only — not a lender quote."
      />
      <div className="mx-auto max-w-[720px] px-4 pb-14 sm:px-6">
        <p className="mt-2 text-[15px] text-[#666]">
          Prefer a full home estimate?{" "}
          <Link
            href="/seller/homeestimate/homevaluation"
            className="text-[var(--cedar)] hover:underline"
          >
            Request a valuation
          </Link>
          .
        </p>
        <div className="mt-10">
          <StandaloneMortgageCalculator />
        </div>
      </div>
    </div>
  );
}
