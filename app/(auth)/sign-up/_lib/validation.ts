import { z } from "zod";
import { authRules } from "@/lib/auth/rules";
import { normalizeUsername } from "@/lib/auth/username";
import { emailSchema } from "../../_lib/fields";

const { password, username, name } = authRules;

const plural = (n: number, word: string) => `${n} more ${word}${n === 1 ? "" : "s"}`;

export const signUpFieldSchemas = {
  name: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(name.max, `Keep it under ${name.max} characters.`),
  username: z
    .string()
    .transform(normalizeUsername)
    .pipe(
      z
        .string()
        .min(1, "Pick a username.")
        .min(username.min, `At least ${username.min} characters.`)
        .max(username.max, `${username.max} characters at most.`)
        .regex(username.pattern, "Use letters, numbers, dots or underscores."),
    ),
  email: emailSchema("We need an email to send your code."),
  password: z
    .string()
    .min(1, "Pick a password.")
    .superRefine((value, ctx) => {
      if (value.length > 0 && value.length < password.min) {
        ctx.addIssue({ code: "custom", message: `${plural(password.min - value.length, "character")} to go.` });
      }
    })
    .pipe(z.string().max(password.max, `${password.max} characters at most.`)),
} as const;

export type SignUpField = keyof typeof signUpFieldSchemas;
export type SignUpValues = Record<SignUpField, string>;
export type SignUpInput = { [K in SignUpField]: z.output<(typeof signUpFieldSchemas)[K]> };
export type SignUpErrors = Partial<Record<SignUpField, string>>;

export const emptySignUpValues: SignUpValues = { name: "", username: "", email: "", password: "" };

export function validateField(field: SignUpField, value: string): string | undefined {
  const result = signUpFieldSchemas[field].safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validateSignUp(
  values: SignUpValues,
): { ok: true; data: SignUpInput } | { ok: false; errors: SignUpErrors } {
  const parsed = z.object(signUpFieldSchemas).safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data };
  const errors: SignUpErrors = {};
  for (const issue of parsed.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && isSignUpField(field) && !errors[field]) errors[field] = issue.message;
  }
  return { ok: false, errors };
}

function isSignUpField(value: string): value is SignUpField {
  return value in signUpFieldSchemas;
}
