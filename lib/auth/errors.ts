export const authErrorMessages = {
  USERNAME_IS_ALREADY_TAKEN: "That username is taken. Try another.",
  USERNAME_TOO_SHORT: "Usernames need at least 3 characters.",
  USERNAME_TOO_LONG: "Usernames can be 30 characters at most.",
  INVALID_USERNAME: "Use lowercase letters, numbers, dots or underscores.",
  PASSWORD_TOO_SHORT: "That password is too short.",
  PASSWORD_TOO_LONG: "That password is too long.",
  INVALID_EMAIL: "That doesn't look like an email.",
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

export function isAuthErrorCode(code: string | undefined): code is AuthErrorCode {
  return code !== undefined && code in authErrorMessages;
}

export function authErrorMessage(error: AuthClientError): string {
  if (error.status === 429) return RATE_LIMITED;
  if (isAuthErrorCode(error.code)) return authErrorMessages[error.code];
  return FALLBACK;
}
