import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { createCode } from "@/lib/slug";
import { scanEnv } from "./config";
import {
  ALLOWED_FORMATS,
  BILLS_PREFIX,
  isPdfMime,
  PDF_PAGES_MAX,
  SCANS_PREFIX,
  TRANSFORM_WIDTH,
  UPLOAD_TAG,
  UPLOAD_TTL_MS,
  type ScanMime,
} from "./rules";

const DELIVERY = { type: "authenticated", resource_type: "image" } as const;

let configured = false;

function client(): typeof cloudinary {
  if (!configured) {
    const { cloudName, apiKey, apiSecret } = scanEnv();
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true, urlAnalytics: false });
    configured = true;
  }
  return cloudinary;
}

export function scanPublicId(personId: string): string {
  return `${SCANS_PREFIX}/${personId}/${createCode()}`;
}

export function billPublicId(billId: string): string {
  return `${BILLS_PREFIX}/${billId}/${createCode()}`;
}

export interface SignedUpload {
  readonly uploadUrl: string;
  readonly fields: Readonly<Record<string, string>>;
  readonly expiresAt: number;
}

export function signUpload(publicId: string): SignedUpload {
  const { cloudName, apiKey, apiSecret } = scanEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    allowed_formats: ALLOWED_FORMATS.join(","),
    public_id: publicId,
    tags: UPLOAD_TAG,
    timestamp,
    type: DELIVERY.type,
  };
  const signature = client().utils.api_sign_request(params, apiSecret);
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    fields: {
      api_key: apiKey,
      timestamp: String(timestamp),
      signature,
      public_id: params.public_id,
      type: params.type,
      allowed_formats: params.allowed_formats,
      tags: params.tags,
    },
    expiresAt: Date.now() + UPLOAD_TTL_MS,
  };
}

export interface StoredObject {
  readonly bytes: number;
  readonly format: string;
  readonly pages: number;
}

interface ExplicitResponse {
  readonly bytes?: number;
  readonly format?: string;
  readonly pages?: number;
}

function isNotFound(error: unknown): boolean {
  const status = (error as { http_code?: number } | null)?.http_code;
  const message = (error as { message?: string } | null)?.message ?? "";
  return status === 404 || /not found/i.test(message);
}

export async function inspectObject(publicId: string): Promise<StoredObject | null> {
  try {
    const response = (await client().uploader.explicit(publicId, { ...DELIVERY })) as ExplicitResponse;
    if (typeof response.bytes !== "number" || typeof response.format !== "string") return null;
    return { bytes: response.bytes, format: response.format, pages: response.pages ?? 1 };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function deleteObject(publicId: string): Promise<void> {
  await client().uploader.destroy(publicId, { ...DELIVERY, invalidate: true });
}

export async function moveObject(from: string, to: string): Promise<void> {
  await client().uploader.rename(from, to, { ...DELIVERY, invalidate: true });
}

export function pageUrl(publicId: string, page: number): string {
  return client().url(publicId, {
    ...DELIVERY,
    sign_url: true,
    secure: true,
    format: "jpg",
    page,
    width: TRANSFORM_WIDTH,
    crop: "limit",
    quality: 85,
  });
}

export interface ModelFile {
  readonly data: Uint8Array;
  readonly mediaType: "image/jpeg";
  readonly filename: string;
}

async function downloadJpeg(url: string): Promise<Uint8Array | null> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  if (!(response.headers.get("content-type") ?? "").startsWith("image/jpeg")) return null;
  return new Uint8Array(await response.arrayBuffer());
}

export async function fetchForModel(publicId: string, mime: ScanMime, pages: number): Promise<readonly ModelFile[] | null> {
  const count = isPdfMime(mime) ? Math.max(1, Math.min(pages, PDF_PAGES_MAX)) : 1;
  const name = publicId.slice(publicId.lastIndexOf("/") + 1);
  const files: ModelFile[] = [];
  for (let page = 1; page <= count; page++) {
    const data = await downloadJpeg(pageUrl(publicId, page));
    if (!data) return files.length > 0 ? files : null;
    files.push({ data, mediaType: "image/jpeg", filename: count > 1 ? `${name}-p${page}.jpg` : `${name}.jpg` });
  }
  return files;
}
