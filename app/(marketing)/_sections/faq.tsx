"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";
import { faqs, SECTION_IDS, type Faq as FaqItem } from "../_data";
import { SectionHeading } from "../_components/primitives";

function FaqEntry({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 bg-transparent p-0 text-left text-[1rem] font-semibold text-text"
      >
        <span>{item.question}</span>
        <Icon
          name="plus"
          size={18}
          strokeWidth={2}
          className={cn("shrink-0 text-muted transition-transform duration-220 ease-standard", open && "rotate-45")}
        />
      </button>
      <div
        id={panelId}
        role="region"
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-standard",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <p
          className={cn(
            "m-0 max-w-[60ch] overflow-hidden leading-6 text-text-2 transition-[padding] duration-300 ease-standard",
            open ? "pb-5" : "pb-0",
          )}
        >
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <section
      id={SECTION_IDS.faq}
      aria-labelledby="faq-title"
      className="flex scroll-mt-16 flex-wrap gap-x-16 gap-y-8 border-t border-line py-24"
    >
      <div className="max-w-80 grow basis-60">
        <SectionHeading id="faq-title">Questions</SectionHeading>
      </div>
      <div className="min-w-0 grow-2 basis-90">
        {faqs.map((item, i) => (
          <FaqEntry
            key={item.question}
            item={item}
            open={openIndex === i}
            onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
          />
        ))}
        <div className="border-t border-line" />
      </div>
    </section>
  );
}
