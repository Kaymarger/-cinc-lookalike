import Image from "next/image";
import Link from "next/link";
import { SITE } from "@/lib/site";

const MENU = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search Homes" },
  { href: "/featured", label: "Featured" },
  { href: "/about", label: "About" },
  { href: "/contact#inquiry", label: "Contact" },
  { href: "/seller/homeestimate", label: "Home Estimate" },
];

const LEGAL = [
  { href: "/terms", label: "Terms of Use" },
  { href: "/privacy", label: "Privacy Notice" },
  { href: "/faq", label: "FAQ" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="mr-3 inline-flex text-[22px] text-[#7b97aa] hover:text-[#1976d2]"
    >
      {children}
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer id="footer" className="mt-auto border-t-4 border-[#1976d2] bg-[#ebeff2] text-[#1f2930]">
      <div className="mx-auto grid max-w-[1170px] gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-block">
            <Image
              src="/brand/site-logo.png"
              alt="Greater Vancouver Area Home Search"
              width={200}
              height={46}
              className="h-11 w-auto"
            />
          </Link>
          <p className="mt-4 text-sm leading-6">
            {SITE.company}
            <br />
            {SITE.agent}
            <br />
            {SITE.addressLine}
            <br />
            {SITE.cityLine}
            <br />
            <a href={`tel:${SITE.phoneTel}`} className="hover:underline">
              {SITE.phoneDisplay}
            </a>
          </p>
          <Image
            src="/brand/remax-logo.png"
            alt="RE/MAX"
            width={200}
            height={35}
            className="mt-4 h-8 w-auto"
          />
          <div className="mt-4">
            <Social href={SITE.facebook} label="Go to Facebook">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H8v3h3v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1z" />
              </svg>
            </Social>
            <Social href={SITE.linkedin} label="Go to LinkedIn">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                <path d="M6.5 9H4V20h2.5V9zM5.2 4C4.3 4 3.6 4.7 3.6 5.6S4.3 7.2 5.2 7.2 6.8 6.5 6.8 5.6 6.1 4 5.2 4zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6-1 0-1.6.7-1.9 1.4-.1.2-.1.6-.1.9V20H11V9h2.4v1.5c.4-.7 1.3-1.8 3.2-1.8 2.3 0 4 1.5 4 4.8V20z" />
              </svg>
            </Social>
            <Social href={SITE.instagram} label="Go to Instagram">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7zm11 1.4a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </Social>
            <Social href={SITE.youtube} label="Go to Youtube">
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6zM9.8 15.5v-6.6l6.2 3.3-6.2 3.3z" />
              </svg>
            </Social>
          </div>
        </div>

        <div>
          <h4 className="text-base font-bold text-[#1f2930]">Menu</h4>
          <ul className="mt-3 columns-2 text-sm">
            {MENU.map((item) => (
              <li key={item.href} className="mb-2 break-inside-avoid">
                <Link href={item.href} className="uppercase hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div />
      </div>

      <div className="mx-auto flex max-w-[1170px] flex-col gap-4 px-4 pb-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Image
          src="/brand/fair-housing.png"
          alt="Fair Housing/Equal Opportunity"
          title="Archibald Real Estate Group is an Equal Opportunity Employer and supports the Fair Housing Act"
          width={48}
          height={32}
          className="h-8 w-auto"
        />
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-bold tracking-[1px] uppercase">
          {LEGAL.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/agent">Agent workspace</Link>
        </div>
      </div>

      <div className="bg-white px-4 py-4 text-[12px] leading-relaxed text-[#7b97aa] sm:px-6">
        <div className="mx-auto max-w-[1170px] space-y-3">
          <Image
            src="/brand/mls-vancouver.gif"
            alt="MIMLS"
            width={80}
            height={28}
            unoptimized
            className="h-7 w-auto"
          />
          <p>
            The data relating to real estate on this website comes in part from the MLS reciprocity
            program of the Real Estate Board of Greater Vancouver. This representation is based in
            whole or part on data generated by the Real Estate Board of Greater Vancouver which
            assumes no responsibility for its accuracy. Inventory shown here is not a live MLS feed.
          </p>
          <p>This site is powered by CINC: www.cincpro.com</p>
          <p>
            Listing data on this site is provided for search. Greater Vancouver
            REALTORS® is a data provider only and has no affiliation with {SITE.company}.
            <br />
            Technology &amp; Service Disclosure: This website is a real estate search platform
            styled after CINC. All real estate related services referenced on this site are provided
            exclusively by {SITE.company}.
          </p>
        </div>
      </div>
    </footer>
  );
}
