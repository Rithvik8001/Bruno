import { supabase } from "@/lib/supabase";

export type AuthFailure =
  | "invalid"
  | "invalidCode"
  | "invalidCredentials"
  | "unverified"
  | "rateLimited"
  | "network"
  | "unknown";

export type AuthResult = { ok: true } | { ok: false; reason: AuthFailure };

const success: AuthResult = { ok: true };

function failure(reason: AuthFailure): AuthResult {
  return { ok: false, reason };
}

const invalidCodeErrors = ["otp_expired", "validation_failed", "bad_json"];
const rateLimitErrors = [
  "over_request_rate_limit",
  "over_email_send_rate_limit",
];

async function post(
  path: string,
  body: Record<string, string>,
): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      return success;
    }
    if (response.status === 400) {
      return failure("invalid");
    }
    if (response.status === 401) {
      return failure("invalidCode");
    }
    if (response.status === 429) {
      return failure("rateLimited");
    }
    return failure("unknown");
  } catch {
    return failure("network");
  }
}

export function signUp(email: string, password: string): Promise<AuthResult> {
  return post("/api/auth/signup", { email, password });
}

export function resendCode(email: string): Promise<AuthResult> {
  return post("/api/auth/resend", { email });
}

export function requestPasswordReset(email: string): Promise<AuthResult> {
  return post("/api/auth/reset", { email });
}

export async function confirmPasswordReset(
  email: string,
  code: string,
  password: string,
): Promise<AuthResult> {
  const confirmed = await post("/api/auth/reset-confirm", {
    email,
    code,
    password,
  });
  if (!confirmed.ok) {
    return confirmed;
  }
  return signIn(email, password);
}

async function announceVerified(): Promise<void> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token === undefined) {
      return;
    }
    await fetch("/api/auth/welcome", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {}
}

export async function verifyCode(
  email: string,
  token: string,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error === null) {
      void announceVerified();
      return success;
    }
    if (__DEV__) {
      console.log("[bruno auth] verify failed", error.code, error.message);
    }
    if (error.code !== undefined && invalidCodeErrors.includes(error.code)) {
      return failure("invalidCode");
    }
    if (error.code !== undefined && rateLimitErrors.includes(error.code)) {
      return failure("rateLimited");
    }
    return failure(
      error.status === undefined || error.status === 0 ? "network" : "unknown",
    );
  } catch {
    return failure("network");
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error === null) {
      return success;
    }
    if (__DEV__) {
      console.log("[bruno auth] sign in failed", error.code, error.message);
    }
    if (error.code === "invalid_credentials") {
      return failure("invalidCredentials");
    }
    if (error.code === "email_not_confirmed") {
      return failure("unverified");
    }
    if (error.code !== undefined && rateLimitErrors.includes(error.code)) {
      return failure("rateLimited");
    }
    return failure(
      error.status === undefined || error.status === 0 ? "network" : "unknown",
    );
  } catch {
    return failure("network");
  }
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function deleteAccount(): Promise<AuthResult> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token === undefined) {
      return failure("unknown");
    }

    const response = await fetch("/api/auth/delete", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 429) {
      return failure("rateLimited");
    }
    if (!response.ok) {
      return failure("unknown");
    }
    await supabase.auth.signOut({ scope: "local" });
    return success;
  } catch {
    return failure("network");
  }
}
