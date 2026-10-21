import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
          Privacy Policy
        </h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#555]">
          <p>
            Greater Vancouver Area Home Search is a real estate search platform
            powered by CINC for Archibald Real Estate Group. This demonstration
            site stores search preferences, saved homes, and inquiry details
            locally in your browser for demo purposes only.
          </p>
          <p>
            On the live site at greatervancouverhomesearch.com, personal
            information collected through registration, saved searches, and
            contact forms is handled according to Archibald Real Estate Group
            and CINC privacy practices, including how communications are sent
            and how you may opt out.
          </p>
          <p>
            You may contact Casey Archibald at{" "}
            <a
              href="mailto:agent@example.com"
              className="text-[var(--cedar)] hover:underline"
            >
              agent@example.com
            </a>{" "}
            or{" "}
            <a
              href="tel:6045550100"
              className="text-[var(--cedar)] hover:underline"
            >
              604-555-0100
            </a>{" "}
            with privacy questions, or use our{" "}
            <Link href="/contact" className="text-[var(--cedar)] hover:underline">
              Contact
            </Link>{" "}
            form.
          </p>
          <p>
            For CINC technology-related privacy requests on the live platform,
            CINC publishes contact options including postmaster@cincpro.com and
            (855) 259-7277.
          </p>
        </div>
      </div>
    </div>
  );
}
