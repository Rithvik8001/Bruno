const maxBodyBytes = 4096;

export function json(status: number, body: Record<string, unknown>): Response {
  return Response.json(body, { status });
}

export async function readJson(
  request: Request,
): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length === 0 || text.length > maxBodyBytes) {
      return null;
    }
    const parsed: unknown = JSON.parse(text);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function readString(
  body: Record<string, unknown>,
  key: string,
): string | null {
  const value = body[key];
  return typeof value === "string" ? value : null;
}
