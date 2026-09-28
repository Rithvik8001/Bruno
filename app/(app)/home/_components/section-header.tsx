import type { ReactNode } from "react";

export function SectionHeader({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="m-0 text-body font-semibold">{title}</h2>
      {aside}
    </div>
  );
}
