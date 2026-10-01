import "server-only";
import type { EmailChrome } from "@/emails/_components/chrome";
import { routes } from "@/lib/auth/rules";
import { appUrl } from "@/lib/site";

export function emailChrome(unsubscribeToken: string | null = null): EmailChrome {
  return {
    markUrl: appUrl(routes.emailMark),
    settingsUrl: appUrl(routes.settingsNotifications),
    unsubscribeUrl: unsubscribeToken ? appUrl(routes.unsubscribe(unsubscribeToken)) : null,
  };
}
