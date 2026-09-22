import {
  isValidCode,
  isValidEmail,
  isValidPassword,
  normalizeEmail,
} from "@/features/auth/validation";
import { InvalidResetCodeError, confirmPasswordReset } from "@/server/accounts";
import { json, readJson, readString } from "@/server/http";
import { consume, rateLimits } from "@/server/rateLimit";

export async function POST(request: Request): Promise<Response> {
  const body = await readJson(request);
  const rawEmail = body === null ? null : readString(body, "email");
  const code = body === null ? null : readString(body, "code");
  const password = body === null ? null : readString(body, "password");

  if (rawEmail === null || code === null || password === null) {
    return json(400, { error: "invalid_request" });
  }

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email) || !isValidCode(code) || !isValidPassword(password)) {
    return json(400, { error: "invalid_request" });
  }

  if (
    !consume(`reset-confirm:email:${email}`, rateLimits.resetConfirmPerEmail)
  ) {
    return json(429, { error: "rate_limited" });
  }

  try {
    await confirmPasswordReset(email, code, password);
    return json(200, { ok: true });
  } catch (error) {
    if (error instanceof InvalidResetCodeError) {
      return json(401, { error: "invalid_code" });
    }
    console.error("[bruno auth] reset confirm failed", error);
    return json(500, { error: "server_error" });
  }
}
