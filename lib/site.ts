import "server-only";
import { serverEnv, type ServerEnv } from "@/lib/env";

const APP_ORIGINS = {
  production: "https://bruno.vin",
  development: "http://localhost:3000",
  test: "http://localhost:3000",
} as const satisfies Record<ServerEnv["NODE_ENV"], string>;

export function appOrigin(): string {
  return APP_ORIGINS[serverEnv().NODE_ENV];
}

export function appUrl(path: string): string {
  return new URL(path, appOrigin()).toString();
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "");
}
