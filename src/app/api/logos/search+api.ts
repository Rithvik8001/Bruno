import { bearerToken, json } from "@/server/http";
import { searchLogos } from "@/server/logos";
import { clientIp, consume, rateLimits } from "@/server/rateLimit";
import { supabaseAdmin } from "@/server/supabaseAdmin";

const minLength = 2;
const maxLength = 64;
const verifiedTtlMs = 5 * 60 * 1000;
const verified = new Map<string, { userId: string; until: number }>();

async function verify(token: string): Promise<string | null> {
  const now = Date.now();
  const cached = verified.get(token);
  if (cached !== undefined && cached.until > now) {
    return cached.userId;
  }
  const { data, error } = await supabaseAdmin().auth.getUser(token);
  if (error !== null || data.user === null) {
    return null;
  }
  verified.set(token, { userId: data.user.id, until: now + verifiedTtlMs });
  return data.user.id;
}

export async function GET(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < minLength || query.length > maxLength) {
    return json(400, { error: "invalid_query" });
  }

  const token = bearerToken(request);
  if (token === null) {
    return json(401, { error: "unauthorized" });
  }
  if (!consume(`logos:ip:${clientIp(request)}`, rateLimits.logoSearchPerIp)) {
    return json(429, { error: "rate_limited" });
  }

  const userId = await verify(token);
  if (userId === null) {
    return json(401, { error: "unauthorized" });
  }
  if (!consume(`logos:user:${userId}`, rateLimits.logoSearchPerUser)) {
    return json(429, { error: "rate_limited" });
  }

  try {
    const results = await searchLogos(query);
    return Response.json(
      { results },
      { status: 200, headers: { "Cache-Control": "private, max-age=3600" } },
    );
  } catch (error) {
    console.error("[bruno logos] search failed", error);
    return json(502, { error: "upstream_error" });
  }
}
