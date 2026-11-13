import type { Metadata } from "next";
import { propertyHref } from "@/lib/listing-url";
import { getFeaturedProperties } from "@/lib/search";
import { registrationWelcome } from "@/lib/welcome-email";

export const metadata: Metadata = {
  title: "Welcome email preview",
  robots: { index: false, follow: false },
};

export default function WelcomePreviewPage() {
  const message = registrationWelcome(
    { name: "Alex Morgan", email: "preview@example.com" },
    getFeaturedProperties().slice(0, 3).map((property) => ({
      address: property.address,
      city: property.city,
      price: property.price,
      href: propertyHref(property),
      image: property.images[0],
    }))
  );
  return (
    <iframe
      title="Welcome email preview"
      srcDoc={message.html}
      className="h-screen w-full border-0 bg-[#f4f7fb]"
    />
  );
}
