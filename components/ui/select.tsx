"use client";

import type { ReactNode, Ref, SelectHTMLAttributes } from "react";
import { Icon } from "@/components/icons/icon";
import { cn } from "@/lib/utils/cn";
import { Field, type FieldFeedback } from "./field";

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps<T extends string>
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "defaultValue" | "onChange" | "id"> {
  options: readonly SelectOption<T>[];
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  label: ReactNode;
  feedback?: FieldFeedback;
  fieldClassName?: string;
  ref?: Ref<HTMLSelectElement>;
}

export function Select<T extends string>({
  options,
  onValueChange,
  label,
  feedback,
  fieldClassName,
  className,
  ...rest
}: SelectProps<T>) {
  const byValue = new Map(options.map((o) => [o.value as string, o.value]));

  return (
    <Field label={label} feedback={feedback} className={fieldClassName}>
      {(control) => (
        <div className="relative">
          <select
            {...rest}
            {...control}
            onChange={(e) => {
              const v = byValue.get(e.target.value);
              if (v !== undefined) onValueChange?.(v);
            }}
            className={cn(
              "h-12 w-full cursor-pointer appearance-none rounded-btn border border-field-rim bg-field pr-10 pl-3.5 text-body font-medium shadow-field",
              "transition-[border-color] duration-150 ease-standard hover:border-border",
              className,
            )}
          >
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <Icon
            name="chevron-down"
            size={18}
            className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-muted"
          />
        </div>
      )}
    </Field>
  );
}
