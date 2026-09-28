import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { ComingSoonContent } from "../_data";

export interface ComingSoonProps {
  content: ComingSoonContent;
  action?: ReactNode;
}

export function ComingSoon({ content, action }: ComingSoonProps) {
  return (
    <div className="grid gap-8 px-5 pt-7 pb-10">
      <h1 className="m-0 text-heading">{content.title}</h1>
      <EmptyState
        icon={{ moment: content.moment }}
        tint={content.tint}
        message={content.body}
        action={action}
        className="min-h-90"
      />
    </div>
  );
}
