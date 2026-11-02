import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "pg"],
  async rewrites() {
    return [
      {
        source: "/api/mobile/:path*",
        destination: "/api/auth/mobile/:path*",
      },
    ];
  },
};

export default nextConfig;
