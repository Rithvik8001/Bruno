import "server-only";
import { setVapidDetails } from "web-push";
import { serverEnv } from "@/lib/env";

let configured: boolean | undefined;

export function pushConfigured(): boolean {
  if (configured !== undefined) return configured;
  const env = serverEnv();
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = env.VAPID_PRIVATE_KEY;
  const subject = env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    configured = false;
    return configured;
  }
  setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return configured;
}
