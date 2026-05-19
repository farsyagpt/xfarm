import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Env } from './env';

function getClient(env: Env) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function presignPut(env: Env, key: string, contentType: string, expiresInSec = 60 * 30) {
  const client = getClient(env);
  const cmd = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSec });
}

export async function presignGet(env: Env, key: string, expiresInSec = 60 * 30) {
  const client = getClient(env);
  const cmd = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSec });
}

