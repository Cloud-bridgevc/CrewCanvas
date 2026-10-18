import "server-only";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = () => process.env.S3_EVIDENCE_BUCKET;
let s3: S3Client | null = null;
const client = () => (s3 ??= new S3Client({ region: process.env.AWS_REGION }));

export function storageConfigured() {
  return Boolean(bucket());
}

/** Key layout: {project}/{workPackage}/{yyyy-mm-dd}/{uuid}-{filename} */
export function evidenceKey(projectId: string, workPackageId: string, filename: string) {
  const safe = filename.toLowerCase().replace(/[^a-z0-9.\-]+/g, "-").slice(-80);
  return `${projectId}/${workPackageId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID().slice(0, 8)}-${safe}`;
}

const ALLOWED = ["image/jpeg", "image/png", "image/heic", "image/webp", "application/pdf"];

/** Browser uploads go straight to S3 with a short-lived presigned PUT. */
export async function presignUpload(key: string, contentType: string) {
  if (!ALLOWED.includes(contentType)) throw new Error(`Unsupported file type ${contentType}`);
  if (!storageConfigured()) return null;
  return getSignedUrl(client(), new PutObjectCommand({ Bucket: bucket(), Key: key, ContentType: contentType, ServerSideEncryption: "aws:kms" }), {
    expiresIn: 300,
  });
}
