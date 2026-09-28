import type { ReactNode } from "react";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils/cn";
import type { StoryContent } from "../_data";
import { FeaturePills, SectionHeading, SectionLead } from "../_components/primitives";

export interface StoryProps {
  id: string;
  content: StoryContent;
  visual: ReactNode;
  flip?: boolean;
}

export function Story({ id, content, visual, flip = false }: StoryProps) {
  const headingId = `${id}-title`;
  const text = (
    <div className="min-w-0 max-w-110 grow basis-75">
      <Chip tint={content.tint} icon={content.icon} size="sm" className="mb-5">
        {content.label}
      </Chip>
      <SectionHeading id={headingId} className="mb-3.5">
        {content.title}
      </SectionHeading>
      <SectionLead>{content.body}</SectionLead>
      <FeaturePills features={content.features} />
    </div>
  );
  const art = (
    <div className="flex min-w-0 grow basis-75 justify-center">
      <div className="w-full max-w-100">{visual}</div>
    </div>
  );

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "flex items-center gap-x-16 gap-y-10 border-t border-line py-24",
        flip ? "flex-wrap-reverse" : "flex-wrap",
      )}
    >
      {flip ? (
        <>
          {art}
          {text}
        </>
      ) : (
        <>
          {text}
          {art}
        </>
      )}
    </section>
  );
}
