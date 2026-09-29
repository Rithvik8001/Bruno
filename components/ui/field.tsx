"use client";

import { useId, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon } from "@/components/icons/icon";
import { CheckIn } from "@/components/motion/check-in";
import { EASE, T } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

export type FieldFeedback =
  | { readonly tone: "error"; readonly message: ReactNode }
  | { readonly tone: "success"; readonly message: ReactNode };

export interface FieldRenderProps {
  id: string;
  "aria-invalid": boolean | undefined;
  "aria-describedby": string | undefined;
}

export interface FieldProps {
  label: ReactNode;
  feedback?: FieldFeedback;
  hint?: ReactNode;
  className?: string;
  children: (control: FieldRenderProps) => ReactNode;
}

export function Field({ label, feedback, hint, className, children }: FieldProps) {
  const id = useId();
  const feedbackId = `${id}-feedback`;
  const hintId = `${id}-hint`;
  const isError = feedback?.tone === "error";
  const showHint = hint !== undefined && !feedback;
  const describedBy = feedback ? feedbackId : showHint ? hintId : undefined;

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": isError || undefined,
        "aria-describedby": describedBy,
      })}
      <AnimatePresence mode="wait" initial={false}>
        {feedback && (
          <motion.span
            key={feedback.tone}
            id={feedbackId}
            role={isError ? "alert" : "status"}
            data-tint={isError ? "red" : "green"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: T.t1 } }}
            transition={{ duration: T.t2, ease: EASE }}
            className="flex items-center gap-1.5 text-footnote font-medium text-tint"
          >
            {isError ? (
              <Icon name="alert" size={14} strokeWidth={2.2} className="shrink-0" />
            ) : (
              <CheckIn className="grid shrink-0">
                <Icon name="check" size={14} strokeWidth={2.2} />
              </CheckIn>
            )}
            {feedback.message}
          </motion.span>
        )}
      </AnimatePresence>
      {showHint && (
        <span id={hintId} className="text-footnote text-muted">
          {hint}
        </span>
      )}
    </div>
  );
}
