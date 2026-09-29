import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import type { PersonView } from "@/lib/people/person";
import { firstNameOf } from "@/lib/people/defaults";
import { cn } from "@/lib/utils/cn";
import { welcomeCopy } from "../_data";
import type { ProfileValue } from "./profile-step";

export interface DoneStepProps {
  profile: ProfileValue;
  friends: readonly PersonView[];
  line: string;
  href: string;
}

export function DoneStep({ profile, friends, line, href }: DoneStepProps) {
  const [left, right] = friends;
  const party = [
    left ? { key: left.id, name: left.displayName, tint: left.tint, buddy: left.buddy, me: false } : null,
    { key: "me", name: profile.displayName, tint: profile.tint, buddy: profile.buddy, me: true },
    right ? { key: right.id, name: right.displayName, tint: right.tint, buddy: right.buddy, me: false } : null,
  ].filter((p) => p !== null);

  return (
    <div className="grid animate-rise gap-6">
      <div data-tint={profile.tint} className="relative flex h-60 items-center justify-center gap-2.5 rounded-[28px] bg-tint-bg">
        {party.map((p, i) => (
          <span
            key={p.key}
            className="animate-pop-spring rounded-full ring-4 ring-bg"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="block animate-wave" style={{ animationDelay: `${500 + i * 140}ms` }}>
              <Avatar name={p.name} tint={p.tint} buddy={p.buddy} size={p.me ? "3xl" : "2xl"} />
            </span>
          </span>
        ))}
      </div>
      <div className="grid gap-1.5 text-center">
        <h1 className="m-0 text-heading">{welcomeCopy.done.title(firstNameOf(profile.displayName))}</h1>
        <p className="m-0 text-text-2 text-pretty">{line}</p>
      </div>
      <Link href={href} className={cn(buttonVariants({ size: "lg", fullWidth: true }))}>
        {welcomeCopy.done.cta}
      </Link>
    </div>
  );
}
