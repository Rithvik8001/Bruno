export const requestTimeoutMs = 12_000;

export function timeoutFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const caller = init?.signal ?? null;
  const abort = () => controller.abort();
  if (caller !== null) {
    if (caller.aborted) {
      controller.abort();
    } else {
      caller.addEventListener("abort", abort);
    }
  }
  setTimeout(() => {
    caller?.removeEventListener("abort", abort);
    controller.abort();
  }, requestTimeoutMs);
  return fetch(input, { ...init, signal: controller.signal });
}
