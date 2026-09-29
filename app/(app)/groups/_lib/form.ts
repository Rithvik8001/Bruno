import type { GroupFormErrors } from "../_components/group-form-fields";

const FIELDS = ["name", "tint", "art", "currency"] as const;

export function toGroupErrors(fields: Readonly<Record<string, string>> | undefined): GroupFormErrors {
  if (!fields) return {};
  const errors: GroupFormErrors = {};
  for (const field of FIELDS) {
    const message = fields[field];
    if (message) errors[field] = message;
  }
  return errors;
}
