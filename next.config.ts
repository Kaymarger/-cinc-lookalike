import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    agentUpgrade: "security",
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
