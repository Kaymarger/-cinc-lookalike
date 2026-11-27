import type { Metadata } from "next";
import { AdTrustRow, PublicLeadForm } from "@/components/public-lead-form";

export const metadata: Metadata = {
  title: "What's my home worth",
  description: "Request a home value estimate from Archibald Real Estate Group.",
  alternates: { canonical: "/lp/home-value" },
};

export default function HomeValueLanding() {
  return (
    <div className="bg-[#f4f7f8]">
      <div className="mx-auto max-w-xl px-4 py-8 pb-16">
        <h1 className="text-[32px] leading-tight font-semibold text-[#16324f]">What is your home worth?</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#444]">
          Request a market estimate. An agent follows up with the numbers. Consent is not a condition of any sale.
        </p>
        <div className="mt-5">
          <PublicLeadForm source="home_valuation" intent="valuation" address submitLabel="Get my estimate" />
        </div>
        <AdTrustRow />
      </div>
    </div>
  );
}
