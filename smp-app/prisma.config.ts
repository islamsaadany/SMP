// Prisma 7 keeps the connection URL out of the schema file. The URL is only
// used by CLI commands (introspection); the running app connects through the
// adapter in lib/db.ts.
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
