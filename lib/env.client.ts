import { z } from "zod";

const publicEnvSchema = z.object({
  supabaseUrl: z.url(),
  supabasePublishableKey: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function publicEnv(): PublicEnv | null {
  const parsed = publicEnvSchema.safeParse({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

const pushPublicKeySchema = z.string().regex(/^[A-Za-z0-9_-]{80,}$/);

export function pushPublicKey(): string | null {
  const parsed = pushPublicKeySchema.safeParse(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
  return parsed.success ? parsed.data : null;
}
