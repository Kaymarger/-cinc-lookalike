import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:border-white/30 hover:bg-white/10"
    >
      {children}
    </a>
  );
}

const explore = [
  { href: "/search", label: "Search homes" },
  { href: "/featured", label: "Featured listings" },
  { href: "/neighborhoods", label: "Neighbourhoods" },
  { href: "/open-houses", label: "Open houses" },
  { href: "/seller/homeestimate/homevaluation", label: "Home estimate" },
];

const company = [
  { href: "/about", label: "About Casey" },
  { href: "/buying", label: "Buying" },
  { href: "/selling", label: "Selling" },
  { href: "/mortgage", label: "Mortgage calculator" },
  { href: "/contact", label: "Contact" },
];

const legal = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/faq", label: "FAQ" },
  { href: "/disclaimer", label: "Disclaimer" },
];

export function SiteFooter() {
  return (
    <footer id="footer" className="mt-auto bg-[#0b1f33] text-white">
      {/* Main */}
      <div className="mx-auto max-w-[1200px] px-4 pt-14 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_1fr_1fr]">
          {/* Brand + contact */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/brand/archibald-logo.png"
                alt="Archibald Real Estate Group"
                width={220}
                height={51}
                className="h-11 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/70">
              Local expertise for buyers and sellers across Greater Vancouver —
              Archibald Real Estate Group with RE/MAX Crest Realty.
            </p>

            <div className="mt-6 space-y-2 text-sm text-white/80">
              <p className="font-medium text-white">Casey Archibald</p>
              <p>100 Demo Street</p>
              <p>Vancouver, BC V6H 3X5</p>
              <a
                href="tel:6045550100"
                className="inline-flex items-center gap-2 pt-1 font-semibold !text-white hover:!text-[#7ec8f0]"
              >
                <Phone className="size-4 text-[#7ec8f0]" />
                604-555-0100
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-5">
              <Image
                src="/brand/remax-logo.png"
                alt="RE/MAX"
                width={160}
                height={29}
                unoptimized
                className="h-8 w-auto bg-transparent"
              />
              <div className="flex items-center gap-2">
                <SocialIcon
                  href="#"
                  label="Facebook"
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                    <path d="M14 8h2V5.5A4.5 4.5 0 0 0 11.6 1H9v3h2c.6 0 1 .4 1 1v3H9v3h3v9h3v-9h2.2L18 8h-4z" />
                  </svg>
                </SocialIcon>
                <SocialIcon
                  href="#"
                  label="Instagram"
                >
                  <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm11 1.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
                  </svg>
                </SocialIcon>
              </div>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.16em] text-[#7ec8f0] uppercase">
              Explore
            </h4>
            <ul className="mt-4 space-y-3">
              {explore.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[15px] !text-white/80 transition hover:!text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.16em] text-[#7ec8f0] uppercase">
              Company
            </h4>
            <ul className="mt-4 space-y-3">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-[15px] !text-white/80 transition hover:!text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/account/register"
              className="mt-8 inline-flex h-11 items-center rounded-full bg-[var(--cedar)] px-5 text-sm font-semibold !text-white hover:brightness-110"
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>

      {/* Legal strip */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
            {legal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="!text-white/55 transition hover:!text-white"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/agent"
              className="!text-white/40 transition hover:!text-white/70"
            >
              Agent workspace
            </Link>
          </div>
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Archibald Real Estate Group
          </p>
        </div>
      </div>

      {/* Compliance — quieter, collapsible visually */}
      <div className="border-t border-white/10 bg-[#081828]">
        <div className="mx-auto flex max-w-[1200px] gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <Image
            src="/brand/fair-housing.png"
            alt="Fair Housing / Equal Opportunity"
            width={40}
            height={28}
            className="mt-0.5 h-7 w-auto shrink-0 opacity-80"
          />
          <div className="space-y-2 text-[11px] leading-relaxed text-white/40">
            <p>
              Listing data comes in part from the MLS® reciprocity program of
              the Real Estate Board of Greater Vancouver, which assumes no
              responsibility for its accuracy. Sample inventory on this demo is
              not a live MLS® feed.
            </p>
            <p>
              Powered by CINC technology. Real estate services are provided
              exclusively by Archibald Real Estate Group | RE/MAX Crest Realty.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
