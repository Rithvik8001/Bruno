import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";

export function CheckIndicator({
  checked,
  className,
}: {
  checked?: boolean;
  className?: string;
}) {
  const controlled = checked !== undefined;
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-5.5 shrink-0 place-items-center rounded-[7px] border-[1.5px] transition-[background-color,border-color] duration-150 ease-standard",
        controlled
          ? checked
            ? "border-brand bg-brand"
            : "border-border bg-transparent"
          : "border-border bg-transparent peer-checked:border-brand peer-checked:bg-brand peer-disabled:border-transparent peer-disabled:bg-surface-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand",
        className,
      )}
    >
      <Icon
        name="check"
        size={13}
        strokeWidth={3}
        className={cn(
          "text-white transition-opacity duration-150 ease-standard",
          controlled ? (checked ? "opacity-100" : "opacity-0") : "opacity-0 [.peer:checked~*_&]:opacity-100",
        )}
      />
    </span>
  );
}

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  children: ReactNode;
  ref?: Ref<HTMLInputElement>;
}

export function Checkbox({ children, className, disabled, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-1 transition-[background-color] duration-150 ease-standard hover:bg-surface",
        disabled && "cursor-not-allowed text-muted hover:bg-transparent",
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" disabled={disabled} {...rest} />
      <CheckIndicator />
      <span>{children}</span>
    </label>
  );
}
