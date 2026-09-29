const CONTROL = /[\p{Cc}\p{Cf}]/gu;
const SPACES = /\s+/g;

export function normalizeName(raw: string): string {
  return raw.normalize("NFKC").replace(CONTROL, "").replace(SPACES, " ").trim();
}

const NOT_LETTERS = /[^\p{L}\s]+/gu;
const GUESS_MAX = 24;

export function guessName(query: string): string {
  const handle = query.trim().replace(/^@/, "").split("@")[0] ?? "";
  const words = handle.replace(NOT_LETTERS, " ").trim().split(SPACES).filter(Boolean);
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .slice(0, GUESS_MAX)
    .trim();
}
