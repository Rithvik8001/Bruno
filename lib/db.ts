import "server-only";
import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "@/prisma/schema.d";
import contractJson from "@/prisma/schema.json" with { type: "json" };
import { requireEnv } from "./env";

export const db = postgres<Contract>({
  contractJson,
  url: requireEnv("DATABASE_URL"),
});
