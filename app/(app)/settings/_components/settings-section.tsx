import type { ReactNode } from "react";
import { Icon3d } from "@/components/ui/icon-3d";
import { cn } from "@/lib/utils/cn";
import type { SectionCopy } from "../_data";

export interface SettingsSectionProps {
  copy: SectionCopy;
  id?: string;
  rows?: boolean;
  children: ReactNode;
}

export function SettingsSection({ copy, id, rows = false, children }: SettingsSectionProps) {
  return (
    <section id={id} className="grid scroll-mt-20 gap-2">
      <h2 className="m-0 flex items-center gap-2 px-1 text-footnote font-semibold text-muted">
        {copy.icon && <Icon3d icon={copy.icon} size={20} />}
        {copy.title}
      </h2>
      <div className={cn("grid rounded-card bg-surface", rows ? "divide-y divide-line px-4 py-1" : "gap-4 p-4")}>{children}</div>
    </section>
  );
}
