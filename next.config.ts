import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
    // Keep Leaflet and other route-only stylesheets off the landing pages.
    cssChunking: "strict",
  },
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.cursor.sh",
    "*.cursorapi.com",
    "*.cursor.com",
    "*.trycloudflare.com",
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
