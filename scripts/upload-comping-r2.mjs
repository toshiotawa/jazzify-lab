/**
 * Comping 資産を R2 の `sozai/Comping/` にアップロード。
 *
 * Usage:
 *   node scripts/upload-comping-r2.mjs
 *   node scripts/upload-comping-r2.mjs --dry-run
 *   node scripts/upload-comping-r2.mjs --purge-cdn
 *   node scripts/upload-comping-r2.mjs --purge-only
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
const SRC_DIR = join(ROOT, 'public', 'sozai', 'Comping');

const args = process.argv.slice(2);
const useS3 = args.includes('--s3');
const dryRun = args.includes('--dry-run');
const noRetry = args.includes('--no-retry');
const purgeCdn = args.includes('--purge-cdn');
const purgeOnly = args.includes('--purge-only');
const runPurge = purgeCdn || purgeOnly;
const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.SOZAI_UPLOAD_RETRIES || '4', 10) || 4);

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';

const FILES = /** @type {const} */ ([
  'Donna Lee Comping precision_lyrics.musicxml',
  'Donna Lee Comping.musicxml',
  'Donna_Lee_Comping.mid',
  'Donna Lee_Comping.mp3',
]);

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

/** @param {string} name */
function contentType(name) {
  if (name.endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  if (name.endsWith('.musicxml')) {
    return 'application/vnd.recordare.musicxml+xml';
  }
  if (name.endsWith('.mid')) {
    return 'audio/midi';
  }
  return 'application/octet-stream';
}

/** @param {string} localPath @param {string} objectPath @param {string} ct */
function putWithWrangler(localPath, objectPath, ct) {
  const childEnv = wranglerSpawnEnv(envR2);
  const wranglerArgs = [
    'r2',
    'object',
    'put',
    objectPath,
    '-f',
    localPath,
    '--content-type',
    ct,
    '--cache-control',
    'public,max-age=31536000',
  ];
  const opts = {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
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
  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText };
}

/** @param {string} localPath @param {string} objectPath @param {string} ct */
async function putWithWranglerRetry(localPath, objectPath, ct) {
  for (let attempt = 1; attempt <= wranglerRetries; attempt += 1) {
    const { ok, errText } = putWithWrangler(localPath, objectPath, ct);
    if (ok) {
      return;
    }
    if (attempt >= wranglerRetries) {
      throw new Error(`wrangler put failed: ${errText}`);
    }
    await delay(1500 * attempt);
  }
}

/** @param {string} name */
async function uploadOne(name) {
  const localPath = join(SRC_DIR, name);
  if (!existsSync(localPath)) {
    throw new Error(`Missing local file: ${localPath}`);
  }
  const objectPath = `${BUCKET}/sozai/Comping/${name}`;
  const ct = contentType(name);
  if (dryRun) {
    console.log(`[dry-run] ${localPath} -> ${objectPath}`);
    return;
  }
  if (useS3 && s3) {
    const body = readFileSync(localPath);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `sozai/Comping/${name}`,
      Body: body,
      ContentType: ct,
      CacheControl: 'public,max-age=31536000',
    }));
  } else {
    await putWithWranglerRetry(localPath, objectPath, ct);
  }
  console.log(`uploaded ${name}`);
}

function cdnFileUrls() {
  const raw =
    process.env.VITE_R2_PUBLIC_URL ||
    envR2.VITE_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    envR2.R2_PUBLIC_URL ||
    'https://jazzify-cdn.com';
  const base = raw.replace(/\/$/, '');
  return FILES.map((name) => `${base}/sozai/Comping/${name.replace(/ /g, '%20')}`);
}

async function purgeCdnCacheIfRequested() {
  if (!runPurge) return;

  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID || envR2.CF_ZONE_ID || envR2.CLOUDFLARE_ZONE_ID || '';
  const token =
    process.env.CLOUDFLARE_API_TOKEN || process.env.CF_API_TOKEN || envR2.CF_API_TOKEN || envR2.CLOUDFLARE_API_TOKEN || '';

  const urls = cdnFileUrls();
  if (dryRun) {
    console.log(`[dry-run] CDN パージ: ${urls.length} URLs（例: ${urls[0]}）`);
    return;
  }

  if (!zoneId || !token) {
    console.error(
      'CDN パージ: CF_ZONE_ID（または CLOUDFLARE_ZONE_ID）と CF_API_TOKEN（または CLOUDFLARE_API_TOKEN）が必要です。',
    );
    process.exit(1);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files: urls }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    console.error('CDN パージ失敗:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`CDN: ${urls.length} ファイルのキャッシュをパージしました。`);
}

async function main() {
  if (!purgeOnly) {
    for (const name of FILES) {
      await uploadOne(name);
    }
  }
  await purgeCdnCacheIfRequested();
  console.log('Done upload-comping-r2');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
