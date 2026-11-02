import type { Metadata } from "next";
import { AdLandingForm } from "@/components/ad-landing-form";

export const metadata: Metadata = {
  title: "Search Greater Vancouver homes",
  description: "Tell us what you are looking for and an Archibald Real Estate Group agent will set up your search.",
};

export default function HomeSearchLanding() {
  return (
    <div className="bg-[#f4f7f8]">
      <div className="mx-auto max-w-lg px-4 py-8">
        <p className="text-[13px] font-semibold tracking-wide text-[#1c93b5] uppercase">Archibald Real Estate Group</p>
        <h1 className="mt-2 text-[32px] leading-tight font-semibold text-[#16324f]">Find a home in Greater Vancouver</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-[#444]">Share your name and how to reach you. We will set up a search and send matches. No obligation.</p>
        <div className="mt-6">
          <AdLandingForm source="buyer_signup" intent="buyer" submitLabel="Start my search" />
        </div>
      </div>
    </div>
  );
}
