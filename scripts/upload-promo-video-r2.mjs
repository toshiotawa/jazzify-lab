import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2S3CredentialsFrom } from './r2-env-helpers.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const PROMO_DIR = resolve(ROOT, 'assets-src/promo');
const envR2 = loadEnvR2Map(ROOT);
const apply = process.argv.includes('--apply');

const PROMO_FILES = [
  'jazzify-promo-ja-1080.mp4',
  'jazzify-promo-ja-720.mp4',
  'jazzify-promo-en-1080.mp4',
  'jazzify-promo-en-720.mp4',
];

const bucket =
  process.env.R2_BUCKET || envR2.R2_BUCKET || envR2.VITE_R2_BUCKET_NAME || 'jazzify-assets';

const objects = PROMO_FILES.map((filename) => ({
  localPath: resolve(PROMO_DIR, filename),
  key: `promo/${filename}`,
  contentType: 'video/mp4',
}));

let totalBytes = 0;
for (const object of objects) {
  totalBytes += (await stat(object.localPath)).size;
}

if (!apply) {
  process.stdout.write(
    `[dry-run] ${objects.length} objects (${(totalBytes / 1024 / 1024).toFixed(1)} MiB) -> ${bucket}/promo\n`,
  );
  for (const object of objects) {
    process.stdout.write(`${object.key}\n`);
  }
  process.exit(0);
}

const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
if (!accountId || !accessKey || !secretKey) {
  throw new Error('R2 S3 credentials are required for --apply');
}

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  forcePathStyle: true,
});

for (const object of objects) {
  const body = await readFile(object.localPath);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: object.key,
      Body: body,
      ContentType: object.contentType,
      CacheControl: 'public,max-age=31536000,immutable',
    }),
  );
  process.stdout.write(`Uploaded ${object.key}\n`);
}

process.stdout.write(`Uploaded ${objects.length} promo video objects to R2.\n`);
