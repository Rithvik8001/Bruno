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
  settingsNotifications: "/settings#notifications",
  emailMark: "/email-assets/mark.png",
  unsubscribe: (token: string) => `/unsubscribe/${encodeURIComponent(token)}`,
  unsubscribeApi: (token: string) => `/api/email/unsubscribe?token=${encodeURIComponent(token)}`,
  secure: (token: string) => `/secure/${encodeURIComponent(token)}`,
  welcome: "/welcome",
  join: "/j",
  authApi: "/api/auth",
  ask: "/ask",
  askApi: "/api/ask",
  askAbout: (groupId?: string | null, listen?: boolean) => {
    const query = [groupId ? `group=${encodeURIComponent(groupId)}` : "", listen ? "listen=1" : ""].filter(Boolean).join("&");
    return query ? `/ask?${query}` : "/ask";
  },
  group: (id: string) => `/groups/${encodeURIComponent(id)}`,
  groupTab: (id: string, tab: "bills" | "balances" | "members") =>
    tab === "bills" ? `/groups/${encodeURIComponent(id)}` : `/groups/${encodeURIComponent(id)}?tab=${tab}`,
  newBillFor: (groupId: string) => `/bills/new?group=${encodeURIComponent(groupId)}`,
  manualBill: (groupId: string) => `/bills/new/manual?group=${encodeURIComponent(groupId)}`,
  scanReview: (scanId: string) => `/bills/new/scan/${encodeURIComponent(scanId)}`,
  tellBill: (groupId: string, fromDraftId?: string, text?: string) =>
    `/bills/new/tell?group=${encodeURIComponent(groupId)}${fromDraftId ? `&from=${encodeURIComponent(fromDraftId)}` : ""}${text ? `&text=${encodeURIComponent(text)}` : ""}`,
  tellReview: (draftId: string) => `/bills/new/tell/${encodeURIComponent(draftId)}`,
  bill: (slug: string) => `/bills/${encodeURIComponent(slug)}`,
  editBill: (slug: string, step?: "items" | "claim" | "split") =>
    `/bills/${encodeURIComponent(slug)}/edit${step ? `?step=${step}` : ""}`,
  invite: (slug: string) => `/j/${encodeURIComponent(slug)}`,
  claimGuest: (token: string) => `/j/claim/${encodeURIComponent(token)}`,
  claimBill: (code: string) => `/b/${encodeURIComponent(code)}`,
  settle: (groupId: string, personId: string, back?: string) =>
    `/groups/${encodeURIComponent(groupId)}/settle/${encodeURIComponent(personId)}${back ? `?back=${encodeURIComponent(back)}` : ""}`,
} as const;

export const authParams = {
  next: "next",
  email: "email",
} as const;

export const billParams = {
  group: "group",
  from: "from",
  text: "text",
} as const;

export const askParams = {
  group: "group",
  listen: "listen",
} as const;

export const guestOnlyRoutes: readonly string[] = [routes.signUp, routes.signIn, routes.resetPassword];

export const signedInRoutePrefixes: readonly string[] = [
  routes.app,
  routes.groups,
  routes.activity,
  routes.bills,
  routes.settings,
  routes.welcome,
  routes.join,
  routes.ask,
];

export const publicRoutePrefixes: readonly string[] = ["/j/claim", "/b"];

export const otpExpiresInMinutes = authRules.otp.expiresInSeconds / 60;
