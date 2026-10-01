import { authRules } from "./rules";

export const authErrorMessages = {
  USERNAME_IS_ALREADY_TAKEN: "That username is taken. Try another.",
  USERNAME_TOO_SHORT: "Usernames need at least 3 characters.",
  USERNAME_TOO_LONG: "Usernames can be 30 characters at most.",
  INVALID_USERNAME: "Use lowercase letters, numbers, dots or underscores.",
  PASSWORD_TOO_SHORT: `Choose a password with at least ${authRules.password.min} characters.`,
  PASSWORD_TOO_LONG: `Choose a password with no more than ${authRules.password.max} characters.`,
  INVALID_EMAIL: "Enter an email like name@example.com.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don’t match. Check for typos, or reset your password.",
  EMAIL_NOT_VERIFIED: "Confirm your email to keep going. A new code is on its way.",
  USER_NOT_FOUND: "No account matches that email. Check it, or create an account.",
  INVALID_OTP: "That code didn’t match. Try again or resend.",
  OTP_EXPIRED: "That code has expired. Resend to get a new one.",
  TOO_MANY_ATTEMPTS: "Too many tries. Send a new code to keep going.",
  PROVIDER_NOT_FOUND: "Google sign-in isn’t available. Use your email instead.",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;

export interface AuthClientError {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
  readonly status: number;
}

const RATE_LIMITED = "Too many attempts. Wait a minute and try again.";
const FALLBACK = "Unable to finish that. Check your connection and try again.";
const RETRY_AFTER_HEADER = "X-Retry-After";
const DEFAULT_RETRY_AFTER_SECONDS = 60;

export function isAuthErrorCode(code: string | undefined): code is AuthErrorCode {
  return code !== undefined && code in authErrorMessages;
}

export function hasAuthErrorCode(error: AuthClientError, ...codes: readonly AuthErrorCode[]): boolean {
  return isAuthErrorCode(error.code) && codes.includes(error.code);
}

export function isRateLimited(error: AuthClientError): boolean {
  return error.status === 429;
}

export function authErrorMessage(error: AuthClientError): string {
  if (isRateLimited(error)) return RATE_LIMITED;
  if (isAuthErrorCode(error.code)) return authErrorMessages[error.code];
  return FALLBACK;
}

export function retryAfterSeconds(response: Response): number {
  const seconds = Number.parseInt(response.headers.get(RETRY_AFTER_HEADER) ?? "", 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
}
