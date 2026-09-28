import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { requireEnv } from "./env";

const PRISMA_ONLY_PARAMS = ["pgbouncer", "schema", "connection_limit"] as const;

function driverConnectionString(raw: string): string {
  const url = new URL(raw);
  for (const param of PRISMA_ONLY_PARAMS) url.searchParams.delete(param);
  return url.toString();
}

function createClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: driverConnectionString(requireEnv("DATABASE_URL")),
    max: 5,
  });
  return new PrismaClient({ adapter });
}

const globalForDb = globalThis as typeof globalThis & { __brunoDb?: PrismaClient };

export const db: PrismaClient = globalForDb.__brunoDb ?? createClient();

if (process.env.NODE_ENV !== "production") globalForDb.__brunoDb = db;
