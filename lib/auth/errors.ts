export const authErrorMessages = {
  USERNAME_IS_ALREADY_TAKEN: "That username is taken. Try another.",
  USERNAME_TOO_SHORT: "Usernames need at least 3 characters.",
  USERNAME_TOO_LONG: "Usernames can be 30 characters at most.",
  INVALID_USERNAME: "Use lowercase letters, numbers, dots or underscores.",
  PASSWORD_TOO_SHORT: "That password is too short.",
  PASSWORD_TOO_LONG: "That password is too long.",
  INVALID_EMAIL: "That doesn't look like an email.",
  INVALID_EMAIL_OR_PASSWORD: "That email and password don't match.",
  EMAIL_NOT_VERIFIED: "Confirm your email to keep going. We sent you a new code.",
  USER_NOT_FOUND: "We couldn't find that account. Request a new code.",
  INVALID_OTP: "That code didn't match. Try again or resend.",
  OTP_EXPIRED: "That code has expired. We can send a new one.",
  TOO_MANY_ATTEMPTS: "Too many tries. Send a new code to keep going.",
  PROVIDER_NOT_FOUND: "Google sign-in isn't set up yet.",
} as const;

export type AuthErrorCode = keyof typeof authErrorMessages;

export interface AuthClientError {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
  readonly status: number;
}

const RATE_LIMITED = "Too many attempts. Wait a minute and try again.";
const FALLBACK = "Something went wrong. Please try again.";
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
