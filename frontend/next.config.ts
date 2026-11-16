import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // content/ (crawled VAST articles) is read with fs at runtime: make sure Vercel bundles it.
  outputFileTracingIncludes: { "/**/*": ["./content/**/*"] },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "vast.gov.vn" }],
    formats: ["image/webp"],
  },
};

export default nextConfig;
