import { redirect } from "next/navigation";
import { TimeZoneCookie } from "@/components/patterns/time-zone-cookie";
import { signInPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { getAppContext } from "@/lib/auth/session";
import { runInBackground } from "@/lib/background";
import { hasUnreadActivity } from "@/lib/feed/queries";
import { rememberTimeZone } from "@/lib/people/time-zone";
import { cookieTimeZone } from "@/lib/time-zone";
import { AppHeader } from "./_components/app-header";
import { CommandPalette } from "./_components/command-palette";
import { TabBar } from "./_components/dock/tab-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const context = await getAppContext();
  if (!context) redirect(signInPath());
  if (!context.person.onboarded) redirect(routes.welcome);
  const [unread, timeZone] = await Promise.all([hasUnreadActivity(context.person.id), cookieTimeZone()]);
  if (timeZone) runInBackground("time zone", () => rememberTimeZone(context.person.id, timeZone));

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader person={context.person} unread={unread} />
      <main className="min-w-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] nav:pb-0">
        <div className="mx-auto max-w-app">{children}</div>
      </main>
      <TabBar unread={unread} />
      <CommandPalette />
      <TimeZoneCookie serverTimeZone={timeZone} />
    </div>
  );
}
