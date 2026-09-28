import type { Metadata } from "next";
import { Avatar } from "@/components/ui/avatar";
import { routes } from "@/lib/auth/rules";
import { requireAppContext } from "@/lib/auth/session";
import { settingsCopy } from "./_data";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = { title: settingsCopy.metaTitle };

export default async function SettingsPage() {
  const { session, person } = await requireAppContext(routes.settings);
  const { user } = session;

  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      <h1 className="m-0 text-heading">{settingsCopy.title}</h1>
      <section className="flex items-center gap-4 rounded-card bg-surface p-5">
        <Avatar name={person.displayName} tint={person.tint} buddy={person.buddy} size="2xl" />
        <span className="grid min-w-0">
          <span className="truncate text-title">{person.displayName}</span>
          <span className="truncate text-small text-text-2">
            {user.username ? `@${user.username} · ` : ""}
            {user.email}
          </span>
        </span>
      </section>
      <p className="m-0 text-small text-text-2">{settingsCopy.more}</p>
      <div>
        <SignOutButton />
      </div>
    </div>
  );
}
