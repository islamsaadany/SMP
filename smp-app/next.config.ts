import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The Prisma client and the pg driver must stay server-side. */
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-pg", "pg"],
  /* lib/frozen.cjs reads the frozen product's sources at runtime (D4): they
     are part of the server's files wherever it is packed. */
  outputFileTracingIncludes: { "/**": ["../SMP-Project-Folder/src/*.js", "./lib/rules.cjs", "./shell/body.html", "./shell/platform.html", "../db/seed-state.json"] },
};

export default nextConfig;
