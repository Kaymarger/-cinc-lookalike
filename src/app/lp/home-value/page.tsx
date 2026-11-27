import type { Metadata } from "next";
import { AdTrustRow, PublicLeadForm } from "@/components/public-lead-form";

const VALUE_SUBHEAD =
  "See what your home could sell for in today's market, based on recent nearby sales.";

export const metadata: Metadata = {
  title: "What's my home worth",
  description: VALUE_SUBHEAD,
  alternates: { canonical: "/lp/home-value" },
};

export default function HomeValueLanding() {
  return (
    <div className="bg-[#f4f7f8]">
      <div className="mx-auto max-w-xl px-4 py-8 pb-16">
        <h1 className="text-[32px] leading-tight font-semibold text-[#16324f]">What is your home worth?</h1>
        <p className="mt-2 text-[15px] leading-snug text-[#3d4a55] sm:text-[17px]">
          {VALUE_SUBHEAD}
        </p>
        <div className="mt-5">
          <PublicLeadForm source="home_valuation" intent="valuation" address submitLabel="Get my estimate" />
        </div>
        <AdTrustRow />
      </div>
    </div>
  );
}
