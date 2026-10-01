import { z } from "zod";

export const INVALID_EMAIL_MESSAGE = "Enter an email like name@example.com.";

export function emailSchema(requiredMessage: string) {
  return z.string().trim().min(1, requiredMessage).pipe(z.email(INVALID_EMAIL_MESSAGE));
}

export function firstIssue(schema: z.ZodType, value: unknown): string | undefined {
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0]?.message;
}
