import type { Property } from "./types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** CINC-style listing URL: /homedetails/bc/{city}/{id}/{address-slug} */
export function propertyHref(property: Property): string {
  const city = slugify(property.city);
  const slug = slugify(
    `${property.address} ${property.city} bc ${property.postalCode}`
  );
  return `/homedetails/bc/${city}/${property.id}/${slug}`;
}

export function propertySlug(property: Property): string {
  return slugify(
    `${property.address} ${property.city} bc ${property.postalCode}`
  );
}
