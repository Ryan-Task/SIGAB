import type { NextConfig } from "next";
import { API_ORIGIN } from "./lib/api-origin";

const nextConfig: NextConfig = {
  // Allow dev resources (HMR, client chunks) when the app is opened via
  // 127.0.0.1 or the LAN IP instead of localhost. Without this, Next blocks
  // /_next/hmr for those origins and the client never hydrates.
  allowedDevOrigins: ["127.0.0.1", "192.168.1.29"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
    ];
  },
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
