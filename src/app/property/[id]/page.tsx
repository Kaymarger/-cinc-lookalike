import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { propertyHref } from "@/lib/listing-url";
import { formatPrice, getPropertyById } from "@/lib/search";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) return { title: "Listing not found" };
  return {
    title: `${property.address}, ${property.city} ${property.province} ${property.postalCode} Home for Sale`,
    description: `${formatPrice(property.price)} · ${property.description.slice(0, 140)}`,
  };
}

/** Keep /property/[id] working — redirect to CINC-style /homedetails URL. */
export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = getPropertyById(id);
  if (!property) notFound();
  redirect(propertyHref(property));
}
