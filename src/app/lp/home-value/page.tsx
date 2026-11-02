import type { Metadata } from "next";
import { AdLandingForm } from "@/components/ad-landing-form";

export const metadata: Metadata = {
  title: "What's my home worth",
  description: "Request a home value estimate from Archibald Real Estate Group.",
};

export default function HomeValueLanding() {
  return (
    <div className="bg-[#f4f7f8]">
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-[13px] font-semibold tracking-wide text-[#1c93b5] uppercase">Archibald Real Estate Group</p>
        <h1 className="mt-2 text-[32px] leading-tight font-semibold text-[#16324f]">What is your home worth?</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#444]">Request a market estimate. An agent follows up with the numbers. Consent is not a condition of any sale.</p>
        <div className="mt-6">
          <AdLandingForm source="home_valuation" intent="valuation" submitLabel="Get my estimate" />
        </div>
      </div>
    </div>
  );
}
