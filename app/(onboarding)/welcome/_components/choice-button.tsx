import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export interface ChoiceButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "role"> {
  selected: boolean;
}

export function ChoiceButton({ selected, className, children, ...rest }: ChoiceButtonProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        "grid cursor-pointer justify-items-center rounded-tile border-[1.5px] transition-[background-color,border-color,transform] duration-200 ease-standard hover:-translate-y-0.5 hover:bg-surface-2 active:scale-95",
        selected ? "border-brand bg-bg" : "border-transparent bg-surface",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
