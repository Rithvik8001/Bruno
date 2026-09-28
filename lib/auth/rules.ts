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
  resetPassword: "/reset-password",
  app: "/home",
  groups: "/groups",
  activity: "/activity",
  newBill: "/bills/new",
  bills: "/bills",
  settings: "/settings",
  authApi: "/api/auth",
} as const;

export const authParams = {
  next: "next",
  email: "email",
} as const;

export const guestOnlyRoutes: readonly string[] = [routes.signUp, routes.signIn, routes.resetPassword];

export const signedInRoutePrefixes: readonly string[] = [
  routes.app,
  routes.groups,
  routes.activity,
  routes.bills,
  routes.settings,
];

export const otpExpiresInMinutes = authRules.otp.expiresInSeconds / 60;
