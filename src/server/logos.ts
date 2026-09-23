import { isValidServiceKey } from "@/lib/logos";

import { readLogoEnv } from "./env";

export type ServiceSuggestion = {
  name: string;
  domain: string;
};

const searchUrl = "https://api.logo.dev/search";
const timeoutMs = 3000;
const cacheTtlMs = 60 * 60 * 1000;
const cacheMax = 500;
const maxResults = 6;
const nameMax = 80;

const cache = new Map<string, { results: ServiceSuggestion[]; until: number }>();

function toSuggestions(payload: unknown): ServiceSuggestion[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const seen = new Set<string>();
  const results: ServiceSuggestion[] = [];
  for (const entry of payload) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const name = "name" in entry && typeof entry.name === "string" ? entry.name.trim() : "";
    const domain =
      "domain" in entry && typeof entry.domain === "string"
        ? entry.domain.trim().toLowerCase()
        : "";
    if (name.length === 0 || !isValidServiceKey(domain) || seen.has(domain)) {
      continue;
    }
    seen.add(domain);
    results.push({ name: name.slice(0, nameMax), domain });
    if (results.length === maxResults) {
      break;
    }
  }
  return results;
}

export async function searchLogos(query: string): Promise<ServiceSuggestion[]> {
  const key = query.toLowerCase();
  const now = Date.now();
  const cached = cache.get(key);
  if (cached !== undefined && cached.until > now) {
    return cached.results;
  }

  const params = new URLSearchParams({ q: query, strategy: "suggest" });
  const response = await fetch(`${searchUrl}?${params.toString()}`, {
    headers: { Authorization: `Bearer ${readLogoEnv().secretKey}` },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`logo.dev search ${response.status}`);
  }
  const results = toSuggestions((await response.json()) as unknown);

  if (cache.size >= cacheMax) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) {
      cache.delete(oldest);
    }
  }
  cache.set(key, { results, until: now + cacheTtlMs });
  return results;
}
