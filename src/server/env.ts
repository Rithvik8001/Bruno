function required(name: string, value: string | undefined): string {
  if (value === undefined || value.length === 0) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

export function readServerEnv() {
  return {
    supabaseUrl: required(
      "EXPO_PUBLIC_SUPABASE_URL",
      process.env.EXPO_PUBLIC_SUPABASE_URL,
    ),
    supabaseSecretKey: required(
      "SUPABASE_SECRET_KEY",
      process.env.SUPABASE_SECRET_KEY,
    ),
  };
}
