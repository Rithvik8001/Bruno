"use client";

import type { InputHTMLAttributes } from "react";
import { Field, type FieldFeedback } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/text-field";
import { signUpCopy } from "../_data";
import type { UsernameAvailability } from "../_lib/use-username-availability";

export interface UsernameFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "value" | "onChange" | "size"> {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  availability: UsernameAvailability;
}

function feedbackFor(error: string | undefined, availability: UsernameAvailability): FieldFeedback | undefined {
  if (error) return { tone: "error", message: error };
  if (availability.status === "taken") return { tone: "error", message: signUpCopy.username.taken };
  if (availability.status === "available") {
    return { tone: "success", message: signUpCopy.username.available(availability.username) };
  }
  return undefined;
}

export function UsernameField({ value, onValueChange, error, availability, ...input }: UsernameFieldProps) {
  const copy = signUpCopy.fields.username;
  return (
    <Field label={copy.label} feedback={feedbackFor(error, availability)}>
      {(control) => (
        <span className="relative block">
          <span aria-hidden className="pointer-events-none absolute top-0 left-3.5 flex h-12 items-center text-muted">
            @
          </span>
          <Input
            {...input}
            {...control}
            value={value}
            onChange={(e) => onValueChange(e.target.value.replace(/\s/g, "").toLowerCase())}
            placeholder={copy.placeholder}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="pr-11 pl-8"
          />
          {availability.status === "checking" && (
            <span className="absolute top-0 right-3.5 flex h-12 items-center text-muted">
              <Spinner label={signUpCopy.username.checking} />
            </span>
          )}
        </span>
      )}
    </Field>
  );
}
