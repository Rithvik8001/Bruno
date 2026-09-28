import { Chip } from "@/components/ui/chip";
import type { PasswordStrength } from "../_lib/password-strength";

export function PasswordStrengthChip({ strength }: { strength: PasswordStrength | null }) {
  if (!strength) return null;
  return (
    <Chip tint={strength.tint} size="xs" dot className="h-5.5 px-2 text-caption">
      {strength.label}
    </Chip>
  );
}
