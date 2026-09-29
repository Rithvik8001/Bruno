import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";
import { clientIp } from "./ip";
import { rateRules, type RateRuleName, type RateScope, type RateWindow } from "./rules";

const CLEANUP_CHANCE = 0.01;

export type RateVerdict = { readonly ok: true } | { readonly ok: false; readonly retryAfter: number };

interface RateKey {
  readonly key: string;
  readonly window: RateWindow;
}

interface CounterRow {
  key: string;
  count: number;
  windowStart: Date;
}

function keysFor(rule: RateRuleName, scope: RateScope, id: string | null): RateKey[] {
  const windows: readonly RateWindow[] = (rateRules[rule] as { [K in RateScope]?: readonly RateWindow[] })[scope] ?? [];
  if (!id) return [];
  return windows.map((window) => ({ key: `rl:${rule}:${scope}:${window.seconds}:${id}`, window }));
}

async function consumeKeys(keys: readonly RateKey[]): Promise<RateVerdict> {
  if (keys.length === 0) return { ok: true };
  const values = Prisma.join(keys.map((k) => Prisma.sql`(${k.key}, 1, now(), ${k.window.seconds}::int)`));
  const rows = await db.$queryRaw<CounterRow[]>(Prisma.sql`
    WITH input(key, count, "windowStart", seconds) AS (VALUES ${values})
    INSERT INTO "app_rate_limit" (key, count, "windowStart")
    SELECT key, count, "windowStart" FROM input
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN "app_rate_limit"."windowStart" <= now() - make_interval(secs => (SELECT seconds FROM input WHERE input.key = EXCLUDED.key))
        THEN 1 ELSE "app_rate_limit".count + 1 END,
      "windowStart" = CASE
        WHEN "app_rate_limit"."windowStart" <= now() - make_interval(secs => (SELECT seconds FROM input WHERE input.key = EXCLUDED.key))
        THEN now() ELSE "app_rate_limit"."windowStart" END
    RETURNING key, count, "windowStart"
  `);

  if (Math.random() < CLEANUP_CHANCE) {
    void db.$executeRaw`DELETE FROM "app_rate_limit" WHERE "windowStart" < now() - interval '1 day'`.catch(() => undefined);
  }

  const now = Date.now();
  let retryAfter = 0;
  for (const row of rows) {
    const spec = keys.find((k) => k.key === row.key);
    if (!spec || row.count <= spec.window.max) continue;
    const endsAt = row.windowStart.getTime() + spec.window.seconds * 1000;
    retryAfter = Math.max(retryAfter, Math.ceil((endsAt - now) / 1000));
  }
  return retryAfter > 0 ? { ok: false, retryAfter } : { ok: true };
}

export async function consumeRate(rule: RateRuleName, personId: string | null): Promise<RateVerdict> {
  const ip = await clientIp();
  return consumeKeys([...keysFor(rule, "person", personId), ...keysFor(rule, "ip", ip)]);
}
