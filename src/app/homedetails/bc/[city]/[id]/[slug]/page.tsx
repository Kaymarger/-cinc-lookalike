import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";
import { catalogListing } from "@/lib/catalog";
import { creaPhotoUrl } from "@/lib/crea-photo";
import { propertyHref, propertySlug } from "@/lib/listing-url";
import { formatPrice } from "@/lib/search";
import { properties } from "@/lib/properties";

type Params = Promise<{ city: string; id: string; slug: string }>;

export const dynamicParams = true;

export function generateStaticParams() {
  return properties.slice(0, 24).map((p) => {
    const href = propertyHref(p);
    // /homedetails/bc/{city}/{id}/{slug}
    const parts = href.split("/");
    return {
      city: parts[3],
      id: parts[4],
      slug: parts[5],
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await catalogListing(id);
  if (!property) return { title: "Listing not found" };
  const canonical = propertyHref(property);
  const title = `${property.address}, ${property.city} ${property.province} ${property.postalCode} Home for Sale`;
  const description = `${formatPrice(property.price)} · ${property.beds} beds · ${property.baths} baths · ${property.description.slice(0, 140)}`;
  const image = property.images?.[0] ? creaPhotoUrl(property.images[0], "med") : "/brand/hero.jpg";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, images: [image] },
  };
}

export default async function HomeDetailsPage({
  params,
}: {
  params: Params;
}) {
  const { id, slug } = await params;
  const property = await catalogListing(id);
  if (!property) notFound();

  const canonicalSlug = propertySlug(property);
  if (slug !== canonicalSlug) {
    redirect(propertyHref(property));
  }

  const photo = property.images?.[0];
  return (
    <>
      {photo ? (
        <>
          <link rel="preload" as="image" href={creaPhotoUrl(photo, "med")} media="(max-width: 767px)" />
          <link rel="preload" as="image" href={creaPhotoUrl(photo, "high")} media="(min-width: 768px)" />
        </>
      ) : null}
      <PropertyDetail property={property} />
    </>
  );
}
