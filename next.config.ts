import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bengurion-herzliya.mashov.info",
      },
    ],
  },
};

export default nextConfig;
