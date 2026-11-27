import type { Metadata } from "next";
import { catalogFeatured } from "@/lib/catalog";
import { propertyHref } from "@/lib/listing-url";
import { registrationWelcome } from "@/lib/welcome-email";

export const metadata: Metadata = {
  title: "Welcome email preview",
  robots: { index: false, follow: false },
};

export default async function WelcomePreviewPage() {
  const featured = await catalogFeatured(3).catch(() => []);
  const message = registrationWelcome(
    { name: "Alex Morgan", email: "preview@example.com" },
    featured.flatMap((property) => {
      const image = property.images.find((url) => url.startsWith("http") && !/unsplash\.com/i.test(url));
      if (!image) return [];
      return [{
        address: property.address,
        city: property.city,
        price: property.price,
        href: propertyHref(property),
        image,
      }];
    }),
  );
  return (
    <iframe
      title="Welcome email preview"
      srcDoc={message.html}
      className="h-screen w-full border-0 bg-[#f4f7fb]"
    />
  );
}
