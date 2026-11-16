import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "vast.gov.vn" }],
    formats: ["image/webp"],
  },
};

export default nextConfig;
