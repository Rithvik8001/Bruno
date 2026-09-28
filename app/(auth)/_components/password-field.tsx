"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Field, type FieldFeedback } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/text-field";
import { authCopy } from "../_data";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "value" | "onChange" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  label?: ReactNode;
  labelAccessory?: ReactNode;
  hint?: ReactNode;
  feedback?: FieldFeedback;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  showToggle?: boolean;
}

export function PasswordField({
  value,
  onValueChange,
  label = authCopy.password.label,
  labelAccessory,
  hint,
  feedback,
  visible: controlledVisible,
  onVisibleChange,
  showToggle = true,
  ...input
}: PasswordFieldProps) {
  const [ownVisible, setOwnVisible] = useState(false);
  const visible = controlledVisible ?? ownVisible;
  const toggle = () => {
    setOwnVisible(!visible);
    onVisibleChange?.(!visible);
  };
  const copy = authCopy.password;

  return (
    <Field
      label={
        labelAccessory ? (
          <span className="flex items-center justify-between">
            {label}
            {labelAccessory}
          </span>
        ) : (
          label
        )
      }
      feedback={feedback}
      hint={hint}
    >
      {(control) => (
        <span className="relative block">
          <Input
            {...input}
            {...control}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className={showToggle ? "pr-12" : undefined}
          />
          {showToggle && (
            <IconButton
              icon={visible ? "eye-off" : "eye"}
              label={visible ? copy.hide : copy.show}
              onClick={toggle}
              className="absolute top-1.5 right-1.5 size-9 rounded-sm hover:bg-surface-2"
            />
          )}
        </span>
      )}
    </Field>
  );
}
