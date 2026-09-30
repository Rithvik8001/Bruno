import "server-only";
import { isProduction, serverEnv } from "@/lib/env";

export interface ScanEnv {
  readonly openAiKey: string;
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
}

export class ScanNotConfiguredError extends Error {
  constructor() {
    super("Receipt scanning is not configured");
    this.name = "ScanNotConfiguredError";
  }
}

export function scanEnv(): ScanEnv {
  const {
    OPENAI_API_KEY,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
  } = serverEnv();
  if (
    !OPENAI_API_KEY ||
    !CLOUDINARY_CLOUD_NAME ||
    !CLOUDINARY_API_KEY ||
    !CLOUDINARY_API_SECRET
  ) {
    throw new ScanNotConfiguredError();
  }
  return {
    openAiKey: OPENAI_API_KEY,
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
  };
}

export function isScanConfigured(): boolean {
  try {
    scanEnv();
    return true;
  } catch {
    return false;
  }
}

export function dailyLimitOverride(): number | undefined {
  if (isProduction()) return undefined;
  return serverEnv().SCAN_DAILY_LIMIT_OVERRIDE;
}
