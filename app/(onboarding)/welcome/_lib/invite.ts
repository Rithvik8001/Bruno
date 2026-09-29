const INVITE_PATTERN = /(?:^|\/)j\/([a-z0-9-]{3,64})\/?(?:[?#].*)?$/i;

export function inviteSlugFrom(input: string): string | null {
  const match = INVITE_PATTERN.exec(input.trim());
  return match?.[1]?.toLowerCase() ?? null;
}
