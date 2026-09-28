import "server-only";
import { randomInt } from "node:crypto";

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const SUFFIX_LENGTH = 4;
const MAX_BASE_LENGTH = 32;
const MAX_ATTEMPTS = 5;

export function slugify(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, MAX_BASE_LENGTH)
      .replace(/-+$/g, "") || "bruno"
  );
}

function suffix(): string {
  return Array.from({ length: SUFFIX_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export function createSlug(title: string): string {
  return `${slugify(title)}-${suffix()}`;
}

export async function uniqueSlug(title: string, taken: (slug: string) => Promise<boolean>): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const slug = createSlug(title);
    if (!(await taken(slug))) return slug;
  }
  throw new Error(`Could not find a free slug for "${title}"`);
}
