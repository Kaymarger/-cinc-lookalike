import Image from "next/image";
import Link from "next/link";
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
      <section className="relative isolate min-h-[78vh] overflow-hidden">
        <Image
          src="/brand/hero.jpg"
          alt="Greater Vancouver skyline"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_0%,rgba(31,41,48,0.6)_100%)]"
        />
        <div className="relative z-10 mx-auto flex min-h-[78vh] max-w-[1170px] flex-col items-center justify-center px-4 py-[18vh] text-center">
          <p className="text-base font-bold tracking-wide text-white uppercase [text-shadow:2px_2px_5px_rgba(31,41,48,0.3)]">
            Archibald Real Estate Group
          </p>
          <h1 className="mt-2 max-w-4xl font-[family-name:var(--font-display)] text-4xl font-normal leading-tight text-white [text-shadow:2px_2px_5px_rgba(31,41,48,0.3)] sm:text-5xl md:text-[64px] md:leading-[1.3]">
            Greater Vancouver Area Home Search
          </h1>
          <HeroSearch />
        </div>
      </section>

      <section id="featured" className="bg-white py-12">
        <div className="mx-auto max-w-[1170px] px-4 sm:px-6">
          <h2 className="text-center font-[family-name:var(--font-display)] text-3xl font-normal text-[#1f2930]">
            Featured Listings
          </h2>
          <div className="mt-8">
            <FeaturedCarousel properties={featured} />
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/featured"
              aria-label="View More Featured Properties"
              className="inline-flex h-10 items-center bg-[#1976d2] px-6 text-sm font-bold tracking-[1px] !text-white uppercase hover:bg-[#145ca4]"
            >
              View More
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white pb-14">
        <div className="mx-auto max-w-[1170px] px-4 sm:px-6">
          <h2 className="border-b border-[#dbe3e8] pb-2 font-[family-name:var(--font-display)] text-2xl text-[#1f2930]">
            Quick Searches
          </h2>
          <ul className="mt-4 columns-1 gap-x-8 text-sm sm:columns-2 lg:columns-3">
            {HOME_QUICK.map((item) => (
              <li key={item.id} className="mb-2 break-inside-avoid">
                <Link href={quickSearchHref(item)} className="hover:underline">
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
