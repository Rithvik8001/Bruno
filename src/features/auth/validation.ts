export const passwordMinLength = 8;
export const emailMaxLength = 254;
export const passwordMaxLength = 72;
export const codeLength = 6;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digitPattern = /[0-9]/;
const codePattern = /^[0-9]{6}$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return value.length <= emailMaxLength && emailPattern.test(value);
}

export function isValidPassword(value: string): boolean {
  return (
    value.length >= passwordMinLength &&
    value.length <= passwordMaxLength &&
    digitPattern.test(value)
  );
}

export function isValidCode(value: string): boolean {
  return codePattern.test(value);
}

export function parseEmailParam(
  value: string | string[] | undefined,
): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate === undefined) {
    return null;
  }
  const email = normalizeEmail(candidate);
  return isValidEmail(email) ? email : null;
}
