import "server-only";
import { isProduction, serverEnv } from "@/lib/env";

export function limitOverride(): number | undefined {
  if (isProduction()) return undefined;
  return serverEnv().AI_DAILY_LIMIT_OVERRIDE;
}
