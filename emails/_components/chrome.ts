export interface EmailChrome {
  readonly markUrl: string;
  readonly settingsUrl: string;
  readonly unsubscribeUrl: string | null;
}

export const previewChrome = {
  markUrl: "http://localhost:3000/email-assets/mark.png",
  settingsUrl: "http://localhost:3000/settings#notifications",
  unsubscribeUrl: "http://localhost:3000/unsubscribe/preview",
} as const satisfies EmailChrome;

export const previewChromeRequired = { ...previewChrome, unsubscribeUrl: null } as const satisfies EmailChrome;
