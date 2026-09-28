import { authRules } from "./rules";

const { min, max, pattern } = authRules.username;

export function normalizeUsername(input: string): string {
  return input.trim().replace(/^@+/, "").toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return username.length >= min && username.length <= max && pattern.test(username);
}

export function slugifyUsername(source: string): string {
  const slug = normalizeUsername(source)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_.]+/g, "_")
    .replace(/[_.]{2,}/g, "_")
    .replace(/^[_.]+|[_.]+$/g, "")
    .slice(0, max);
  return (slug || "user").padEnd(min, "0");
}

export function* usernameCandidates(base: string, randomSuffix: () => string): Generator<string> {
  yield base;
  for (let n = 2; n <= 9; n++) yield withSuffix(base, String(n));
  for (;;) yield withSuffix(base, randomSuffix());
}

function withSuffix(base: string, suffix: string): string {
  return `${base.slice(0, max - suffix.length)}${suffix}`;
}
