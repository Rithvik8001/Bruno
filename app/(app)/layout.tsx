import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/redirect";
import { getAppContext } from "@/lib/auth/session";
import { AppHeader } from "./_components/app-header";
import { TabBar } from "./_components/nav-links";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const context = await getAppContext();
  if (!context) redirect(signInPath());

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader person={context.person} />
      <main className="min-w-0 flex-1 pb-26 nav:pb-0">
        <div className="mx-auto max-w-app">{children}</div>
      </main>
      <TabBar />
    </div>
  );
}
