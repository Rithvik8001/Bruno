import "dotenv/config";
import { defineConfig } from "prisma/config";
import { requireEnv } from "./lib/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: requireEnv("DIRECT_URL"),
  },
});
