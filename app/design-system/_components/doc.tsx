import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface DocSectionProps {
  index: number;
  title: string;
  description: ReactNode;
  children: ReactNode;
  contentClassName?: string;
}

export function DocSection({ index, title, description, children, contentClassName }: DocSectionProps) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id} className="flex flex-wrap gap-x-12 gap-y-8 border-t border-line py-12">
      <div className="max-w-60 flex-[1_1_200px]">
        <div className="mb-2 text-caption text-muted">{String(index).padStart(2, "0")}</div>
        <h2 id={id} className="m-0 text-title">
          {title}
        </h2>
        <p className="mt-2 mb-0 text-small text-text-2">{description}</p>
      </div>
      <div className={cn("min-w-0 flex-[4_1_360px]", contentClassName)}>{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mb-3 text-footnote font-semibold text-muted", className)}>{children}</div>;
}

export interface DemoProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Demo({ title, description, children, className }: DemoProps) {
  return (
    <div className={className}>
      <h3 className="m-0 mb-1 text-body font-semibold">{title}</h3>
      {description && <p className="mt-0 mb-4 max-w-prose text-small text-text-2">{description}</p>}
      {children}
    </div>
  );
}

export function DemoGrid({ children, min = 260 }: { children: ReactNode; min?: 200 | 220 | 240 | 260 | 280 }) {
  return (
    <div
      className="grid gap-8"
      style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))` }}
    >
      {children}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-card bg-surface p-5", className)}>{children}</div>;
}

export function SpecRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
