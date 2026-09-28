import type { PaletteTint } from "@/lib/design-system/tokens";
import { authRules } from "@/lib/auth/rules";

export interface PasswordStrength {
  readonly label: "Weak" | "Okay" | "Strong";
  readonly tint: PaletteTint;
}

const LEVELS = {
  weak: { label: "Weak", tint: "red" },
  okay: { label: "Okay", tint: "amber" },
  strong: { label: "Strong", tint: "green" },
} as const satisfies Record<string, PasswordStrength>;

export function passwordStrength(password: string): PasswordStrength | null {
  if (!password) return null;
  const checks = [
    password.length >= authRules.password.min,
    password.length >= 12,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^\w\s]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  if (score <= 1) return LEVELS.weak;
  if (score <= 3) return LEVELS.okay;
  return LEVELS.strong;
}
