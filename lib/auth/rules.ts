export const authRules = {
  password: { min: 8, max: 128 },
  username: { min: 3, max: 30, pattern: /^[a-z0-9_.]+$/ },
  name: { max: 60 },
  otp: { length: 6, expiresInSeconds: 600, allowedAttempts: 5, resendCooldownSeconds: 30 },
} as const;

export const routes = {
  home: "/",
  signUp: "/sign-up",
  signIn: "/sign-in",
  app: "/home",
  authApi: "/api/auth",
} as const;

export const otpExpiresInMinutes = authRules.otp.expiresInSeconds / 60;
