"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { pressMotion } from "@/components/motion/press";
import { EASE, SOFT_SPRING, T } from "@/lib/motion/tokens";
import { faqs, SECTION_IDS, type Faq as FaqItem } from "../_data";
import { SectionHeading } from "../_components/primitives";

function FaqEntry({ item, open, onToggle }: { item: FaqItem; open: boolean; onToggle: () => void }) {
  const panelId = useId();
  return (
    <div className="border-t border-line">
      <motion.button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        {...pressMotion(true)}
        className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 bg-transparent p-0 text-left text-[1rem] font-semibold text-text"
      >
        <span>{item.question}</span>
        <motion.span
          aria-hidden
          initial={false}
          animate={{ rotate: open ? 45 : 0 }}
          transition={SOFT_SPRING}
          className="inline-flex shrink-0 text-muted"
        >
          <Icon name="plus" size={18} strokeWidth={2} />
        </motion.span>
      </motion.button>
      <motion.div
        id={panelId}
        role="region"
        inert={!open}
        initial={false}
        animate={open ? { height: "auto", opacity: 1 } : { height: 0, opacity: 0 }}
        transition={{ duration: T.t3, ease: EASE }}
        className="overflow-hidden"
      >
        <p className="m-0 max-w-[60ch] pb-5 leading-6 text-text-2">{item.answer}</p>
      </motion.div>
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
