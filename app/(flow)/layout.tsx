import { redirect } from "next/navigation";
import { signInPath } from "@/lib/auth/redirect";
import { routes } from "@/lib/auth/rules";
import { getAppContext } from "@/lib/auth/session";

export default async function FlowLayout({ children }: LayoutProps<"/">) {
  const context = await getAppContext();
  if (!context) redirect(signInPath());
  if (!context.person.onboarded) redirect(routes.welcome);

  return (
    <main className="min-h-dvh min-w-0">
      <div className="mx-auto max-w-app">{children}</div>
    </main>
  );
}
