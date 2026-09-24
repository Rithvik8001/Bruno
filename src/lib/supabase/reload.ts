import type { DataResult } from "./result";

export const retryDelayMs = 1_500;
export const staleAfterMs = 5 * 60_000;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  load: () => Promise<DataResult<T>>,
): Promise<DataResult<T>> {
  const first = await load();
  if (first.ok || first.reason !== "network") {
    return first;
  }
  await wait(retryDelayMs);
  return load();
}
