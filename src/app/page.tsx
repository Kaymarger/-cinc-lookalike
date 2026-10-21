import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { HeroSearch } from "@/components/hero-search";
import { getFeaturedProperties } from "@/lib/search";
import { QUICK_SEARCHES, quickSearchHref } from "@/lib/quick-searches";

const HOME_QUICK = QUICK_SEARCHES.filter((q) =>
  [
    "duplexes-for-sale-in-vancouver",
    "homes-for-sale-in-arbutus",
    "homes-for-sale-in-cambie",
    "homes-for-sale-in-coal-harbour",
    "homes-for-sale-in-downtown-vancouver",
    "homes-for-sale-in-dunbar",
    "homes-for-sale-in-east-vancouver",
    "homes-for-sale-in-edgemont",
    "homes-for-sale-in-fairview",
    "homes-for-sale-in-false-creek",
    "homes-for-sale-in-kitsilano",
    "homes-for-sale-in-lynn-valley",
    "homes-for-sale-in-mount-pleasant",
    "homes-for-sale-in-north-vancouver",
    "homes-for-sale-in-point-grey",
    "homes-for-sale-in-vancouver",
    "homes-for-sale-in-vancouver-west",
    "homes-for-sale-in-west-vancouver",
    "homes-for-sale-in-yaletown",
    "luxury-homes-for-sale-in-vancouver",
    "new-homes-for-sale-in-vancouver",
  ].includes(q.slug)
);

export default function HomePage() {
  const featured = getFeaturedProperties();

  return (
    <>
      <section className="relative isolate min-h-[85svh] overflow-hidden sm:min-h-[88vh]">
        <Image
          src="/brand/hero.jpg"
          alt="Greater Vancouver skyline and waterfront"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,66,125,0.25)_0%,rgba(0,0,0,0.4)_45%,rgba(0,0,0,0.62)_100%)]"
        />

        <div className="relative z-10 mx-auto flex min-h-[85svh] max-w-[1200px] flex-col items-center justify-center px-4 pb-16 pt-20 text-center sm:min-h-[88vh] sm:px-6 lg:px-8">
          <p className="text-sm font-medium tracking-[0.16em] text-white/90 uppercase">
            Archibald Real Estate Group
          </p>
          <h1 className="mt-3 max-w-3xl font-[family-name:var(--font-accent)] text-[2.4rem] font-normal leading-[1.12] text-white sm:text-5xl md:text-6xl">
            Find your next home in Greater Vancouver
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Search listings, save favourites, and get alerts — built for buyers
            and sellers on the go.
          </p>
          <div className="mt-8 flex w-full justify-center sm:mt-10">
            <HeroSearch />
          </div>
        </div>

        <a
          href="#featured"
          className="absolute bottom-5 left-1/2 z-10 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/50 text-white transition hover:bg-white/10"
          aria-label="Scroll to featured listings"
        >
          <ChevronDown className="size-5" />
        </a>
      </section>

      <section id="featured" className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-[#222] sm:text-4xl">
                Featured homes
              </h2>
              <p className="mt-2 text-[15px] text-[#666]">
                Hand-picked listings across Metro Vancouver.
              </p>
            </div>
            <Link
              href="/featured"
              className="inline-flex h-11 items-center rounded-full bg-[var(--cedar)] px-6 text-sm font-semibold text-white hover:brightness-95"
            >
              View more
            </Link>
          </div>
          <div className="mt-8">
            <FeaturedCarousel properties={featured} />
          </div>
        </div>
      </section>

      <section className="border-t border-[#eef2f5] bg-[#f7fafc] py-12 sm:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[#222] sm:text-3xl">
            Quick searches
          </h2>
          <p className="mt-2 text-[15px] text-[#666]">
            Jump into popular neighbourhoods and home types.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {HOME_QUICK.map((item) => (
              <li key={item.id}>
                <Link
                  href={quickSearchHref(item)}
                  className="flex min-h-12 items-center rounded-xl border border-[#e5eef5] bg-white px-4 text-[15px] text-[var(--cedar-deep)] transition hover:border-[var(--cedar)] hover:bg-[#edf5fd]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
