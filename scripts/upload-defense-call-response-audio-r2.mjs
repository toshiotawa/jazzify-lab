/**
 * Upload 1:3 call-response MP3s for Stage 1-1 to R2 `sozai/defense-call-response/`.
 * Generate first: `python3 scripts/generate-defense-call-response-audio.py` (1c3r files only run that block or full main).
 *
 * Usage:
 *   node scripts/upload-defense-call-response-audio-r2.mjs
 *   node scripts/upload-defense-call-response-audio-r2.mjs --dry-run
 *   node scripts/upload-defense-call-response-audio-r2.mjs --s3
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2AccountIdFrom, r2S3CredentialsFrom, wranglerSpawnEnv } from './r2-env-helpers.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const envR2 = loadEnvR2Map(ROOT);

const useS3 = process.argv.includes('--s3');
const dryRun = process.argv.includes('--dry-run');
const noRetry = process.argv.includes('--no-retry');
const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.SOZAI_UPLOAD_RETRIES || '4', 10) || 4);

const SRC_DIR = join(ROOT, 'public', 'sozai', 'defense-call-response');

const FILES = /** @type {const} */ ([
  'defense-stage-1-1-cr-phrase-1-1c3r-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-2-1c3r-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-3-1c3r-bpm120.mp3',
  'defense-stage-1-1-cr-phrase-4-1c3r-bpm120.mp3',
]);

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';

/** @type {S3Client | null} */
let s3 = null;
if (useS3) {
  const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
  if (!accountId || !accessKey || !secretKey) {
    console.error('--s3 モード: CF_ACCOUNT_ID と S3 互換キーが必要です。');
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
  const wranglerArgs = [
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
  const opts = {
    cwd: ROOT,
    stdio: /** @type {const} */ (['ignore', 'pipe', 'pipe']),
    env: childEnv,
  };

  const wranglerCli = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  let r;
  if (existsSync(wranglerCli)) {
    r = spawnSync(process.execPath, [wranglerCli, ...wranglerArgs], { ...opts, shell: false });
  } else {
    const useShell = process.platform === 'win32';
    r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: useShell });
  }
  if (r.error) throw r.error;
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').toString().trim();
    throw new Error(`wrangler put failed: ${err || `exit ${r.status}`}`);
  }
}

async function putObject(localPath, r2Key) {
  const objectPath = `${BUCKET}/${r2Key}`;
  if (dryRun) {
    console.log(`[dry-run] ${localPath} -> ${objectPath}`);
    return;
  }
  if (s3) {
    const body = readFileSync(localPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: body,
        ContentType: 'audio/mpeg',
        CacheControl: 'public,max-age=31536000',
      }),
    );
    console.log(`Uploaded (s3): ${r2Key}`);
    return;
  }

  let lastErr = null;
  for (let attempt = 1; attempt <= wranglerRetries; attempt += 1) {
    try {
      putWithWrangler(localPath, objectPath);
      console.log(`Uploaded: sozai/defense-call-response/${r2Key.split('/').pop()}`);
      return;
    } catch (e) {
      lastErr = e;
      if (attempt < wranglerRetries) {
        await delay(1500 * attempt);
      }
    }
  }
  throw lastErr;
}

async function main() {
  for (const file of FILES) {
    const localPath = join(SRC_DIR, file);
    if (!existsSync(localPath)) {
      console.error(`Missing: ${localPath}`);
      process.exit(1);
    }
    const r2Key = `sozai/defense-call-response/${file}`;
    await putObject(localPath, r2Key);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});