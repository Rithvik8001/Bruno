import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { getAppContext } from "@/lib/auth/session";
import { hasUnreadActivity } from "@/lib/feed/queries";
import { AppHeader } from "./_components/app-header";
import { TabBar } from "./_components/dock/tab-bar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const context = await getAppContext();
  if (!context) redirect(signInPath());
  if (!context.person.onboarded) redirect(routes.welcome);
  const unread = await hasUnreadActivity(context.person.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader person={context.person} unread={unread} />
      <main className="min-w-0 flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] nav:pb-0">
        <div className="mx-auto max-w-app">{children}</div>
      </main>
      <TabBar unread={unread} />
    </div>
  );
}
