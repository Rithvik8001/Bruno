"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Chip } from "@/components/ui/chip";
import { Field, type FieldFeedback } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { Input } from "@/components/ui/text-field";
import { signUpCopy } from "../_data";
import { passwordStrength } from "../_lib/password-strength";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id" | "value" | "onChange" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  feedback?: FieldFeedback;
}

export function PasswordField({ value, onValueChange, feedback, ...input }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);
  const copy = signUpCopy.fields.password;

  return (
    <Field
      label={
        <span className="flex items-center justify-between">
          {copy.label}
          {strength && (
            <Chip tint={strength.tint} size="xs" dot className="h-5.5 px-2 text-caption">
              {strength.label}
            </Chip>
          )}
        </span>
      }
      feedback={feedback}
      hint={value ? undefined : copy.hint}
    >
      {(control) => (
        <span className="relative block">
          <Input
            {...input}
            {...control}
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={copy.placeholder}
            className="pr-12"
          />
          <IconButton
            icon={visible ? "eye-off" : "eye"}
            label={visible ? copy.hide : copy.show}
            onClick={() => setVisible((v) => !v)}
            className="absolute top-1.5 right-1.5 size-9 rounded-sm hover:bg-surface-2"
          />
        </span>
      )}
    </Field>
  );
}
