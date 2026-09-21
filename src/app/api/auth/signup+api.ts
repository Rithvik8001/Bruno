import {
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/features/auth/validation";
import { startSignUp } from "@/server/accounts";
import { json, readJson, readString } from "@/server/http";
import { clientIp, consume, rateLimits } from "@/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const rawEmail = body === null ? null : readString(body, "email");
  const password = body === null ? null : readString(body, "password");

  if (rawEmail === null || password === null) {
    return json(400, { error: "invalid_request" });
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || !isValidPassword(password)) {
    return json(400, { error: "invalid_request" });
  }

  if (
    !consume(`signup:ip:${clientIp(request)}`, rateLimits.signupPerIp) ||
    !consume(`code:email:${email}`, rateLimits.codePerEmail)
  ) {
    return json(429, { error: "rate_limited" });
  }

  try {
    await startSignUp(email, password);
    return json(200, { ok: true });
  } catch (error) {
    console.error("[bruno auth] signup failed", error);
    return json(500, { error: "server_error" });
  }
}
