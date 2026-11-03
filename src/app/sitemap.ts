import type { MetadataRoute } from "next";

const PAGES = [
  "",
  "/search",
  "/featured",
  "/about",
  "/contact",
  "/account/register",
  "/account/login",
  "/lp/home-search",
  "/lp/home-value",
  "/seller/homeestimate",
  "/privacy",
  "/terms",
  "/unsubscribe",
  "/faq",
  "/disclaimer",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PAGES.map((path) => ({
    url: `https://vancouverpropertysearch.ca${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" || path === "/search" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));
}
