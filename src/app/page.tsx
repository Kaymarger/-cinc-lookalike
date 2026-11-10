import Image from "next/image";
import Link from "next/link";
import { FeaturedCarousel } from "@/components/featured-carousel";
import { PublicPageSections } from "@/components/public-page-sections";
import { HeroSearch } from "@/components/hero-search";
import { catalogFeatured } from "@/lib/catalog";
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

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const featured = await catalogFeatured(8);

  return (
    <>
      <section className="relative isolate overflow-hidden bg-[#3498d8]">
        <Image
          src="/brand/hero.jpg"
          alt="Greater Vancouver skyline"
          fill
          priority
          quality={60}
          className="object-cover object-center"
          sizes="100vw"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_0%,rgba(31,41,48,0.6)_100%)]"
        />
        <div className="relative z-10 mx-auto flex max-w-[1350px] flex-col items-center justify-center px-4 py-[22vh] text-center">
          <p className="font-sans text-base font-bold tracking-normal text-white uppercase [text-shadow:2px_2px_5px_rgba(31,41,48,0.3)]">
            Archibald Real Estate Group
          </p>
          <h1 className="mt-2 max-w-none whitespace-nowrap font-[family-name:var(--font-accent)] text-[clamp(28px,4.7vw,67px)] font-normal leading-[1.3] text-white [text-shadow:2px_2px_5px_rgba(31,41,48,0.3)]">
            Greater Vancouver Area Home Search
          </h1>
          <HeroSearch />
        </div>
      </section>

      <section id="featured" className="bg-white py-12">
        <div className="mx-auto max-w-[1350px] px-4">
          <h2 className="text-center font-[family-name:var(--font-display)] text-[28px] font-normal text-[#1f2930]">
            Featured Listings
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#4a5560]">
            Homes Casey Archibald is featuring right now.
          </p>
          {featured.length ? (
            <div className="mt-8">
              <FeaturedCarousel properties={featured} />
            </div>
          ) : (
            <p className="mx-auto mt-8 max-w-xl text-center text-sm text-[#4a5560]">
              No featured listings are available right now.
            </p>
          )}
          <div className="mt-8 text-center">
            <Link
              href="/featured"
              aria-label="View More Featured Properties"
              className="inline-flex h-10 items-center bg-[#3498d8] px-6 text-sm font-bold tracking-[1px] !text-white uppercase hover:brightness-90"
            >
              View More
            </Link>
          </div>
        </div>
      </section>
      <PublicPageSections page="home" />

      <section className="bg-white pb-14">
        <div className="mx-auto max-w-[1350px] px-4">
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
