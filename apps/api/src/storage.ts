/**
 * storage.ts — Supabase Storage via S3-compatible API
 *
 * Supabase Storage exposes an S3-compatible endpoint:
 *   https://<project-ref>.supabase.co/storage/v1/s3
 *
 * Required env vars:
 *   SUPABASE_URL          — e.g. https://xxxx.supabase.co
 *   SUPABASE_S3_ACCESS_KEY — from Supabase dashboard → Storage → S3 Access Keys
 *   SUPABASE_S3_SECRET_KEY — same
 *   SUPABASE_BUCKET        — bucket name, e.g. "xfarming"
 */

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from './env';

function getClient(env: Env): S3Client {
  // Supabase S3 endpoint: https://<ref>.supabase.co/storage/v1/s3
  const endpoint = `${env.SUPABASE_URL.replace(/\/$/, '')}/storage/v1/s3`;

  return new S3Client({
    region: 'ap-southeast-1', // Supabase requires a region; ap-southeast-1 works globally
    endpoint,
    credentials: {
      accessKeyId: env.SUPABASE_S3_ACCESS_KEY,
      secretAccessKey: env.SUPABASE_S3_SECRET_KEY,
    },
    forcePathStyle: true, // required for Supabase S3
  });
}

export async function presignPut(
  env: Env,
  key: string,
  contentType: string,
  expiresInSec = 60 * 30,
): Promise<string> {
  const client = getClient(env);
  const cmd = new PutObjectCommand({
    Bucket: env.SUPABASE_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSec });
}

export async function presignGet(
  env: Env,
  key: string,
  expiresInSec = 60 * 30,
): Promise<string> {
  const client = getClient(env);
  const cmd = new GetObjectCommand({
    Bucket: env.SUPABASE_BUCKET,
    Key: key,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSec });
}
