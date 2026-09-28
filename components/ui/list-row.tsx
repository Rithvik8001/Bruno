import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface ListRowContent {
  leading?: ReactNode;
  title: ReactNode;
  caption?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}

export type ListRowProps = ListRowContent &
  (
    | { href: string; onClick?: never }
    | { onClick: MouseEventHandler<HTMLButtonElement>; href?: never }
    | { href?: never; onClick?: never }
  );

const rowClass =
  "-mx-3 grid min-h-16 w-[calc(100%+1.5rem)] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3.5 rounded-control px-3 text-left text-text no-underline";
const interactiveClass =
  "cursor-pointer transition-[background-color] duration-150 ease-standard hover:bg-surface hover:text-text active:bg-surface-2";

export function ListRow(props: ListRowProps) {
  const { leading, title, caption, trailing, className } = props;
  const body = (
    <>
      {leading ?? <span />}
      <span className="grid min-w-0">
        <span className="truncate font-medium">{title}</span>
        {caption && <span className="truncate text-small text-text-2">{caption}</span>}
      </span>
      {trailing}
    </>
  );

  if (props.href !== undefined) {
    return (
      <Link href={props.href} className={cn(rowClass, interactiveClass, className)}>
        {body}
      </Link>
    );
  }
  if (props.onClick !== undefined) {
    return (
      <button type="button" onClick={props.onClick} className={cn(rowClass, interactiveClass, className)}>
        {body}
      </button>
    );
  }
  return <div className={cn(rowClass, className)}>{body}</div>;
}

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid [&>*+*]:border-t [&>*+*]:border-line", className)}>{children}</div>;
}
