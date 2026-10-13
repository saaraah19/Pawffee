import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Image uploads must survive restarts/redeploys, so they can't live on a
 * serverless function's local filesystem (e.g. Vercel's /tmp, or any
 * container that's rebuilt on deploy), that storage is wiped constantly.
 *
 * Three backends are supported, tried in this order:
 *   1. Cloudinary, if CLOUDINARY_* env vars are set (preferred).
 *   2. Any S3-compatible bucket (AWS S3, R2, Spaces, Supabase, MinIO...),
 *      if S3_* env vars are set.
 *   3. Local disk under public/uploads, dev-only fallback, NOT persistent
 *      on most production hosting.
 */

// Cloudinary

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "pawffee/recipes";

const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

let cloudinaryConfigured = false;
function configureCloudinary() {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
    cloudinaryConfigured = true;
  }
}

// S3-compatible

const BUCKET = process.env.S3_BUCKET;
const REGION = process.env.S3_REGION || "auto";
const ENDPOINT = process.env.S3_ENDPOINT; // needed for R2 / Spaces / MinIO, omit for AWS S3
const ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const PUBLIC_URL_BASE = process.env.S3_PUBLIC_URL_BASE; // e.g. https://cdn.pawffee.com or the bucket's public URL

const isS3Configured = Boolean(BUCKET && ACCESS_KEY_ID && SECRET_ACCESS_KEY);

let s3Client: S3Client | null = null;
function getS3Client() {
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

export const activeStorageBackend: "cloudinary" | "s3" | "local" = isCloudinaryConfigured
  ? "cloudinary"
  : isS3Configured
    ? "s3"
    : "local";

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
  // 1. Cloudinary
  if (isCloudinaryConfigured) {
    configureCloudinary();
    const publicId = randomUUID();
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: CLOUDINARY_FOLDER, public_id: publicId, resource_type: "image" },
          (error, uploadResult) => {
            if (error || !uploadResult) reject(error || new Error("Cloudinary upload failed"));
            else resolve(uploadResult);
          }
        );
        stream.end(buffer);
      }
    );
    return { url: result.secure_url, key: result.public_id };
  }

  // 2. S3-compatible
  if (isS3Configured) {
    const key = `recipes/${randomUUID()}${safeExtension(originalFilename)}`;
    const client = getS3Client();
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

  // 3. Dev-only fallback: local disk under public/uploads.
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  const localName = `${randomUUID()}${safeExtension(originalFilename)}`;
  await fs.writeFile(path.join(uploadsDir, localName), buffer);
  return { url: `/uploads/${localName}`, key: localName };
}

export async function deleteUploadedImage(key: string): Promise<void> {
  if (!key) return;

  if (isCloudinaryConfigured) {
    configureCloudinary();
    await cloudinary.uploader.destroy(key).catch(() => {});
    return;
  }

  if (isS3Configured) {
    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `recipes/${key}` }));
    return;
  }

  const localPath = path.join(process.cwd(), "public", "uploads", key);
  await fs.unlink(localPath).catch(() => {});
}
