import { useId, type ReactNode } from "react";
import { Icon } from "@/components/icons/icon";
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
  className?: string;
  children: (control: FieldRenderProps) => ReactNode;
}

export function Field({ label, feedback, className, children }: FieldProps) {
  const id = useId();
  const feedbackId = `${id}-feedback`;
  const isError = feedback?.tone === "error";

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-small font-medium">
        {label}
      </label>
      {children({
        id,
        "aria-invalid": isError || undefined,
        "aria-describedby": feedback ? feedbackId : undefined,
      })}
      {feedback && (
        <span
          id={feedbackId}
          role={isError ? "alert" : "status"}
          data-tint={isError ? "red" : "green"}
          className="flex items-center gap-1.5 text-footnote font-medium text-tint"
        >
          <Icon name={isError ? "alert" : "check"} size={14} strokeWidth={2.2} />
          {feedback.message}
        </span>
      )}
    </div>
  );
}
