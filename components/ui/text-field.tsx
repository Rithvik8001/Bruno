"use client";

import type { InputHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, type FieldFeedback } from "./field";

export const inputClassName = cn(
  "h-12 w-full rounded-btn border border-field-rim bg-field px-3.5 text-body font-normal shadow-field outline-none",
  "transition-[background-color,border-color,box-shadow] duration-150 ease-standard",
  "focus:border-brand focus:bg-bg focus:shadow-field-focus",
  "aria-invalid:border-red aria-invalid:shadow-field-error aria-invalid:focus:border-red aria-invalid:focus:shadow-field-error",
  "disabled:cursor-not-allowed disabled:text-muted",
);

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  ref?: Ref<HTMLInputElement>;
}

export function Input({ className, ...rest }: InputProps) {
  return <input className={cn(inputClassName, className)} {...rest} />;
}

export interface TextFieldProps extends Omit<InputProps, "id"> {
  label: ReactNode;
  feedback?: FieldFeedback;
  fieldClassName?: string;
}

export function TextField({ label, feedback, fieldClassName, ...input }: TextFieldProps) {
  return (
    <Field label={label} feedback={feedback} className={fieldClassName}>
      {(control) => <Input {...input} {...control} />}
    </Field>
  );
}
