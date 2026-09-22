import { UnauthorizedError, sendWelcome } from "@/server/accounts";
import { bearerToken, json } from "@/server/http";
import { clientIp, consume, rateLimits } from "@/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request);
  if (token === null) {
    return json(401, { error: "unauthorized" });
  }

  if (!consume(`welcome:ip:${clientIp(request)}`, rateLimits.welcomePerIp)) {
    return json(429, { error: "rate_limited" });
  }

  try {
    await sendWelcome(token);
    return json(200, { ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json(401, { error: "unauthorized" });
    }
    console.error("[bruno auth] welcome failed", error);
    return json(500, { error: "server_error" });
  }
}
