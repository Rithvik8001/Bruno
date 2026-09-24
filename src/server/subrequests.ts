let count = 0;
let installed = false;
const trace: string[] = [];
const traceMax = 80;

function describe(input: RequestInfo | URL): string {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return url.slice(0, 80);
  }
}

export function trackSubrequests(): void {
  count = 0;
  trace.length = 0;
  if (installed) {
    return;
  }
  const original = globalThis.fetch;
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    count += 1;
    if (trace.length < traceMax) {
      trace.push(describe(input));
    }
    return original(input, init);
  }) as typeof fetch;
  installed = true;
}

export function subrequestCount(): number {
  return count;
}

export function subrequestTrace(): readonly string[] {
  return trace;
}
