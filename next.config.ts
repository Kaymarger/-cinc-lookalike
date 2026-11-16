import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "*.cursor.sh",
    "*.cursorapi.com",
    "*.cursor.com",
    "*.trycloudflare.com",
  ],
  images: {
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      { protocol: "https", hostname: "ddfcdn.realtor.ca" },
      { protocol: "https", hostname: "www.realtor.ca" },
    ],
  },
};

export default nextConfig;
