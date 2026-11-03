import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/agent", "/dashboard", "/api"],
    },
    sitemap: "https://vancouverpropertysearch.ca/sitemap.xml",
    host: "https://vancouverpropertysearch.ca",
  };
}
