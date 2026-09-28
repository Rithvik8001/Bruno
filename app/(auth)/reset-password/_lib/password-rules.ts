import { authRules } from "@/lib/auth/rules";
import { resetCopy } from "../_data";

export type PasswordRuleId = keyof typeof resetCopy.rules;

export interface PasswordRule {
  readonly id: PasswordRuleId;
  readonly label: string;
  readonly ok: boolean;
}

const MIN_EMAIL_NAME_LENGTH = 3;

function containsEmailName(password: string, email: string): boolean {
  const name = email.trim().split("@")[0]?.toLowerCase() ?? "";
  return name.length >= MIN_EMAIL_NAME_LENGTH && password.toLowerCase().includes(name);
}

export function passwordRules(password: string, email: string): readonly PasswordRule[] {
  const { rules } = resetCopy;
  return [
    {
      id: "length",
      label: rules.length,
      ok: password.length >= authRules.password.min && password.length <= authRules.password.max,
    },
    { id: "numberOrSymbol", label: rules.numberOrSymbol, ok: /[\d\W_]/.test(password) },
    { id: "notEmail", label: rules.notEmail, ok: password.length > 0 && !containsEmailName(password, email) },
  ];
}

export function isPasswordAcceptable(password: string, email: string): boolean {
  return passwordRules(password, email).every((rule) => rule.ok);
}
