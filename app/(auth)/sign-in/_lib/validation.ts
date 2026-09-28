import { z } from "zod";
import { emailSchema, firstIssue } from "../../_lib/fields";
import { signInCopy } from "../_data";

export const signInFieldSchemas = {
  email: emailSchema(signInCopy.fields.email.required),
  password: z.string().min(1, signInCopy.fields.password.required),
} as const;

export type SignInField = keyof typeof signInFieldSchemas;
export type SignInValues = Record<SignInField, string>;
export type SignInInput = { [K in SignInField]: z.output<(typeof signInFieldSchemas)[K]> };

export const emptySignInValues: SignInValues = { email: "", password: "" };

export function validateSignInField(field: SignInField, value: string): string | undefined {
  return firstIssue(signInFieldSchemas[field], value);
}

export function parseSignIn(values: SignInValues): SignInInput | null {
  const parsed = z.object(signInFieldSchemas).safeParse(values);
  return parsed.success ? parsed.data : null;
}
