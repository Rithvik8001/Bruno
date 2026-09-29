import "server-only";
import { headers } from "next/headers";

const MAX_IP_LENGTH = 64;

export async function clientIp(): Promise<string | null> {
  const forwarded = (await headers()).get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim() ?? "";
  return first.length > 0 && first.length <= MAX_IP_LENGTH ? first : null;
}
