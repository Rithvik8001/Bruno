import { UnauthorizedError, deleteAccount } from "@/server/accounts";
import { bearerToken, json } from "@/server/http";
import { clientIp, consume, rateLimits } from "@/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  const token = bearerToken(request);
  if (token === null) {
    return json(401, { error: "unauthorized" });
  }

  if (!consume(`delete:ip:${clientIp(request)}`, rateLimits.deletePerIp)) {
    return json(429, { error: "rate_limited" });
  }

  try {
    await deleteAccount(token);
    return json(200, { ok: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return json(401, { error: "unauthorized" });
    }
    console.error("[bruno auth] delete failed", error);
    return json(500, { error: "server_error" });
  }
}
