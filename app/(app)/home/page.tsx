import type { Metadata } from "next";
import { BrunoLockup } from "@/components/brand/bruno-mark";
import { Avatar } from "@/components/ui/avatar";
import { requireSession } from "@/lib/auth/session";
import { SignOutButton } from "./_components/sign-out-button";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const { user } = await requireSession();
  return (
    <main className="mx-auto grid min-h-dvh max-w-app content-center justify-items-start gap-6 px-5">
      <BrunoLockup />
      <div className="flex items-center gap-3.5">
        <Avatar name={user.name} tint="brand" size="xl" />
        <span className="grid">
          <span className="text-title">{user.name}</span>
          <span className="text-small text-text-2">@{user.username ?? "—"} · {user.email}</span>
        </span>
      </div>
      <SignOutButton />
    </main>
  );
}
