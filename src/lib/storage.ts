import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Image uploads must survive restarts/redeploys, so they can't live on a
 * serverless function's local filesystem (e.g. Vercel's /tmp, or any
 * container that's rebuilt on deploy) — that storage is wiped constantly.
 *
 * Production: uploads go to an S3-compatible bucket (AWS S3, Cloudflare R2,
 * Supabase Storage, DigitalOcean Spaces, MinIO, ...) configured via env vars.
 * This is the simplest persistent option that works the same way regardless
 * of which platform Pawffee is deployed to.
 *
 * Local development: if no bucket is configured, uploads fall back to
 * public/uploads on disk. This is fine for `npm run dev` but is NOT
 * persistent in most production hosting -- configure S3 env vars before
 * deploying for real.
 */

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || "auto";
const ENDPOINT = process.env.S3_ENDPOINT; // needed for R2 / Spaces / MinIO, omit for AWS S3
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE; // e.g. https://cdn.pawffee.com or the bucket's public URL

export const isObjectStorageConfigured = Boolean(
  BUCKET && ACCESS_KEY_ID && SECRET_ACCESS_KEY
);

let s3Client: S3Client | null = null;
function getClient() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: REGION,
      endpoint: ENDPOINT,
      forcePathStyle: Boolean(ENDPOINT), // most S3-compatible providers need path-style addressing
      credentials: {
        accessKeyId: ACCESS_KEY_ID!,
        secretAccessKey: SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3Client;
}

function safeExtension(filename: string) {
  const ext = path.extname(filename).toLowerCase().replace(/[^a-z0-9.]/g, "");
  return ext && ext.length <= 6 ? ext : "";
}

export type UploadedImage = { url: string; key: string };

export async function saveUploadedImage(
  buffer: Buffer,
  originalFilename: string,
  contentType: string
): Promise<UploadedImage> {
  const key = `recipes/${randomUUID()}${safeExtension(originalFilename)}`;

  if (isObjectStorageConfigured) {
    const client = getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: "public-read",
      })
    );
    const url = PUBLIC_URL_BASE
      ? `${PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`
      : ENDPOINT
        ? `${ENDPOINT.replace(/\/$/, "")}/${BUCKET}/${key}`
        : `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    return { url, key };
  }

  // Dev-only fallback: local disk under public/uploads.
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const localName = key.replace("recipes/", "");
  await fs.writeFile(path.join(uploadsDir, localName), buffer);
  return { url: `/uploads/${localName}`, key: localName };
}

export async function deleteUploadedImage(key: string): Promise<void> {
  if (!key) return;
  if (isObjectStorageConfigured) {
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `recipes/${key}` }));
    return;
  }
  const localPath = path.join(process.cwd(), "public", "uploads", key);
  await fs.unlink(localPath).catch(() => {});
}
