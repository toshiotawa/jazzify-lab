/**
 * 開発者用 chord_osmd レッスン8: Finale 製・2 staff の全音符 4 小節 MusicXML を R2 にアップロード。
 *
 * 入力: public/demo_lesson 8.musicxml
 * 出力: R2 の fantasy-bgm/ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml
 *
 * Usage:
 *   node scripts/upload-dev-chord-osmd-lesson8-two-staves.mjs
 *   node scripts/upload-dev-chord-osmd-lesson8-two-staves.mjs --dry-run
 *   node scripts/upload-dev-chord-osmd-lesson8-two-staves.mjs --purge-cdn
 *   node scripts/upload-dev-chord-osmd-lesson8-two-staves.mjs --s3
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
const purgeCdn = process.argv.includes('--purge-cdn');
const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.DEV_OSMD120_UPLOAD_RETRIES || '4', 10) || 4);

const SRC_PATH = join(ROOT, 'public', 'demo_lesson 8.musicxml');
const DEST_KEY = 'fantasy-bgm/ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml';
const CONTENT_TYPE = 'application/vnd.recordare.musicxml+xml';

const BUCKET =
  process.env.R2_BUCKET || envR2.R2_BUCKET || envR2.VITE_R2_BUCKET_NAME || 'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

/** @type {S3Client | null} */
let s3 = null;
if (useS3) {
  const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
  if (!accountId || !accessKey || !secretKey) {
    console.error(
      '--s3 モード: アカウント ID と S3 互換の Access / Secret が必要です。\n' +
        '  `.env.r2` に例: CF_ACCOUNT_ID, CF_ACCESS_KEY, CF_SECRET_KEY',
    );
    process.exit(1);
  }
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });
}

function putWithWrangler(localPath, objectPath, contentType) {
  const childEnv = wranglerSpawnEnv(envR2);
  const wranglerArgs = [
    'r2', 'object', 'put', objectPath,
    '-f', localPath,
    '--content-type', contentType,
    '--cache-control', 'public,max-age=31536000',
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
    if (r.error && useShell === false) {
      r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: true });
    }
  }

  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText, spawnError: r.error };
}

async function putWithWranglerRetry(localPath, objectPath, contentType) {
  let last = { ok: false, errText: '' };
  for (let attempt = 0; attempt < wranglerRetries; attempt++) {
    if (attempt > 0) {
      const ms = 1000 * 2 ** (attempt - 1);
      console.log(`  …再試行 ${attempt + 1}/${wranglerRetries}（${ms}ms 待機）`);
      await delay(ms);
    }
    last = putWithWrangler(localPath, objectPath, contentType);
    if (last.ok) return last;
  }
  return last;
}

function cdnFileUrl() {
  const raw =
    process.env.VITE_R2_PUBLIC_URL ||
    envR2.VITE_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    envR2.R2_PUBLIC_URL ||
    'https://jazzify-cdn.com';
  const base = raw.replace(/\/$/, '');
  return `${base}/${DEST_KEY}`;
}

async function purgeCdnCacheIfRequested() {
  if (!purgeCdn) return;

  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID || envR2.CF_ZONE_ID || envR2.CLOUDFLARE_ZONE_ID || '';
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    envR2.CF_API_TOKEN ||
    envR2.CLOUDFLARE_API_TOKEN ||
    '';

  const url = cdnFileUrl();
  if (dryRun) {
    console.log(`[dry-run] CDN パージ: ${url}`);
    return;
  }

  if (!zoneId || !token) {
    console.error('CDN パージ: CF_ZONE_ID と CF_API_TOKEN が必要です。');
    process.exit(1);
  }

  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: [url] }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    console.error('CDN パージ失敗:', res.status, JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`CDN: ${url} のキャッシュをパージしました。`);
}

if (!existsSync(SRC_PATH)) {
  console.error(`見つかりません: ${SRC_PATH}`);
  process.exit(1);
}

const objectPath = `${BUCKET}/${DEST_KEY}`;

if (dryRun) {
  console.log(`[dry-run] ${SRC_PATH} -> ${objectPath} (${CONTENT_TYPE})`);
} else if (useS3 && s3) {
  try {
    const body = readFileSync(SRC_PATH);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: DEST_KEY,
        Body: body,
        ContentType: CONTENT_TYPE,
        CacheControl: 'public, max-age=31536000',
      }),
    );
    console.log(`OK  -> ${DEST_KEY}`);
  } catch (err) {
    console.error(`ERR ${/** @type {Error} */ (err).message}`);
    process.exit(1);
  }
} else {
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
    process.exit(1);
  }
  const { ok, errText, spawnError } = await putWithWranglerRetry(SRC_PATH, objectPath, CONTENT_TYPE);
  if (ok) {
    const st = readFileSync(SRC_PATH);
    console.log(`OK  -> ${DEST_KEY} (${(st.length / 1024).toFixed(1)} KB)`);
  } else {
    const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
    console.error(`ERR ${detail}`);
    process.exit(1);
  }
}

await purgeCdnCacheIfRequested();
