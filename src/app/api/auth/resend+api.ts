import { isValidEmail, normalizeEmail } from "@/features/auth/validation";
import { resendSignUpCode } from "@/server/accounts";
import { json, readJson, readString } from "@/server/http";
import { clientIp, consume, rateLimits } from "@/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const rawEmail = body === null ? null : readString(body, "email");

  if (rawEmail === null) {
    return json(400, { error: "invalid_request" });
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) {
    return json(400, { error: "invalid_request" });
  }

  if (
    !consume(`resend:ip:${clientIp(request)}`, rateLimits.resendPerIp) ||
    !consume(`code:email:${email}`, rateLimits.codePerEmail)
  ) {
    return json(429, { error: "rate_limited" });
  }

  try {
    await resendSignUpCode(email);
    return json(200, { ok: true });
  } catch (error) {
    console.error("[bruno auth] resend failed", error);
    return json(500, { error: "server_error" });
  }
}
