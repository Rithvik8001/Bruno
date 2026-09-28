import "dotenv/config";
import { definePrismaConfig } from "@prisma/cli-engine";
import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { requireEnv } from "./lib/env";

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/schema.prisma",
    migrations: { dir: "prisma/migrations" },
    db: {
      connection: requireEnv("DIRECT_URL"),
    },
  }),
});
