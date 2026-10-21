import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PropertyDetail } from "@/components/property-detail";
import { propertyHref, propertySlug } from "@/lib/listing-url";
import { formatPrice, getPropertyById } from "@/lib/search";
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
  const property = getPropertyById(id);
  if (!property) return { title: "Listing not found" };
  return {
    title: `${property.address}, ${property.city} ${property.province} ${property.postalCode} Home for Sale`,
    description: `${formatPrice(property.price)} · ${property.beds} beds · ${property.baths} baths · ${property.description.slice(0, 140)}`,
  };
}

export default async function HomeDetailsPage({
  params,
}: {
  params: Params;
}) {
  const { id, slug } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();

  const canonicalSlug = propertySlug(property);
  if (slug !== canonicalSlug) {
    redirect(propertyHref(property));
  }

  return <PropertyDetail property={property} />;
}
