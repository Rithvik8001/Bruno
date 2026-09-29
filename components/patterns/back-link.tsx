import Link from "next/link";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";

export const backClassName =
  "-ml-1.5 inline-flex h-9 cursor-pointer items-center gap-1.5 justify-self-start rounded-sm bg-transparent pr-2.5 pl-1.5 text-small font-medium text-text-2 no-underline hover:bg-surface hover:text-text";

type BackLinkProps = { label: string; className?: string } & (
  | { href: string; onClick?: never }
  | { onClick: () => void; href?: never }
);

export function BackLink({ label, className, href, onClick }: BackLinkProps) {
  const content = (
    <>
      <Icon name="chevron-left" size={18} />
      {label}
    </>
  );
  if (href !== undefined) {
    return (
      <Link href={href} className={cn(backClassName, className)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cn(backClassName, className)}>
      {content}
    </button>
  );
}
