/**
 * Upload call-and-response backing tracks in public/sozai/defense-call-response/ to R2.
 *
 * Usage:
 *   node scripts/upload-defense-call-response-r2.mjs
 *   node scripts/upload-defense-call-response-r2.mjs --dry-run
 *   node scripts/upload-defense-call-response-r2.mjs --s3
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2AccountIdFrom, r2S3CredentialsFrom, wranglerSpawnEnv } from './r2-env-helpers.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const envR2 = loadEnvR2Map(ROOT);

const useS3 = process.argv.includes('--s3');
const dryRun = process.argv.includes('--dry-run');

const FILES = [
  'defense-tutorial-call-response-cde-bpm60.mp3',
  'defense-stage-1-1-cr-phrase-1-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-2-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-3-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-4-bpm120.mp3',
];

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';

let s3 = null;
if (useS3) {
  const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
  if (!accountId || !accessKey || !secretKey) {
    console.error('--s3 mode requires CF_ACCOUNT_ID and R2 S3 credentials in .env.r2');
    process.exit(1);
  }
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });
}

function putWithWrangler(localPath, objectPath) {
  const childEnv = wranglerSpawnEnv(envR2);
  const wranglerCli = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const args = [
    'r2',
    'object',
    'put',
    objectPath,
    '-f',
    localPath,
    '--content-type',
    'audio/mpeg',
    '--cache-control',
    'public,max-age=31536000',
  ];
  const r = existsSync(wranglerCli)
    ? spawnSync(process.execPath, [wranglerCli, ...args], { cwd: ROOT, stdio: 'inherit', env: childEnv })
    : spawnSync('npx', ['wrangler', ...args], { cwd: ROOT, stdio: 'inherit', env: childEnv });
  if (r.status !== 0) {
    throw new Error(`wrangler upload failed for ${objectPath}`);
  }
}

async function main() {
  for (const filename of FILES) {
    const localPath = join(ROOT, 'public', 'sozai', 'defense-call-response', filename);
    const r2Key = `sozai/defense-call-response/${filename}`;
    if (!existsSync(localPath)) {
      throw new Error(`Missing local audio file: ${localPath}`);
    }
    if (dryRun) {
      console.log(`[dry-run] ${localPath} -> ${BUCKET}/${r2Key}`);
      continue;
    }
    if (s3) {
      await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: readFileSync(localPath),
        ContentType: 'audio/mpeg',
        CacheControl: 'public,max-age=31536000',
      }));
      console.log(`Uploaded via S3: https://jazzify-cdn.com/${r2Key}`);
    } else {
      putWithWrangler(localPath, `${BUCKET}/${r2Key}`);
      console.log(`Uploaded via wrangler: https://jazzify-cdn.com/${r2Key}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
