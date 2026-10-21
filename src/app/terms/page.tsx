import type { Metadata } from "next";
import Link from "next/link";
import { PageAssist } from "@/components/page-assist";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
};

export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-[#eee] px-4 py-3">
        <PageAssist />
      </div>
      <div className="mx-auto max-w-[800px] px-4 py-12 sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[#222]">
          Terms of Use
        </h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-[#555]">
          <p>
            By using this Greater Vancouver Area Home Search demonstration, you
            agree to use the site for personal, non-commercial home-search
            purposes. Listing data shown here is sample-only and is not a live
            MLS® feed.
          </p>
          <p>
            On the live CINC-powered website, use of the service is subject to
            Archibald Real Estate Group and CINC Terms of Use and{" "}
            <Link href="/privacy" className="text-[var(--cedar)] hover:underline">
              Privacy Policy
            </Link>
            , which may include electronic consent, communication preferences,
            and dispute-resolution terms.
          </p>
          <p>
            All real estate services referenced on this site are provided
            exclusively by Archibald Real Estate Group. CINC provides website
            and search technology only.
          </p>
          <p>
            Questions?{" "}
            <Link href="/contact" className="text-[var(--cedar)] hover:underline">
              Contact us
            </Link>{" "}
            or call {SITE.phoneDisplay}.
          </p>
        </div>
      </div>
    </div>
  );
}
