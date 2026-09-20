export const authModes = ["signUp", "signIn"] as const;

export type AuthMode = (typeof authModes)[number];

export const defaultAuthMode: AuthMode = "signIn";

export function isAuthMode(value: unknown): value is AuthMode {
  return (
    typeof value === "string" &&
    (authModes as readonly string[]).includes(value)
  );
}

export function parseAuthMode(value: string | string[] | undefined): AuthMode {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isAuthMode(candidate) ? candidate : defaultAuthMode;
}
