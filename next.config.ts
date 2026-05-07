import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents is opt-in PPR. Re-enable once Suspense boundaries are added
  // around all dynamic data fetches.
  // cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
