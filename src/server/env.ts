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
    supabasePublishableKey: required(
      "EXPO_PUBLIC_SUPABASE_KEY",
      process.env.EXPO_PUBLIC_SUPABASE_KEY,
    ),
  };
}

const defaultFrom = "Bruno <no-reply@notifications.bruno.vin>";

export function readMailerEnv() {
  const replyTo = process.env.RESEND_REPLY_TO;
  return {
    resendApiKey:
      process.env.RESEND_API_KEY === undefined ||
      process.env.RESEND_API_KEY.length === 0
        ? null
        : process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM ?? defaultFrom,
    replyTo: replyTo === undefined || replyTo.length === 0 ? null : replyTo,
  };
}

export function readCronEnv() {
  return { cronSecret: required("CRON_SECRET", process.env.CRON_SECRET) };
}
