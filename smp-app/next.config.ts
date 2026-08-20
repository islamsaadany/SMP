import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The Prisma client and the pg driver must stay server-side. */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
};

export default nextConfig;
