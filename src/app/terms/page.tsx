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
            By using Greater Vancouver Area Home Search you agree to use it to look for homes and to request information from Archibald Real Estate Group. Listing information is provided for search. An agent confirms details before you rely on a price or status.
          </p>
          <p>
            Electronic messages are sent only with the consent you give on a form. You can withdraw that consent on the{" "}
            <Link href="/unsubscribe" className="text-[var(--cedar)] hover:underline">unsubscribe page</Link>
            . See the{" "}
            <Link href="/privacy" className="text-[var(--cedar)] hover:underline">Privacy Policy</Link>.
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
