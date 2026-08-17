import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Local dev fallback uploads are served from /uploads on this same host.
    // Add remote patterns here for whichever S3-compatible endpoint is used
    // in production (e.g. an R2/S3 public bucket domain) via env-driven config
    // if needed -- kept permissive by pattern below for common S3-style hosts.
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "**.digitaloceanspaces.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
};

export default nextConfig;
