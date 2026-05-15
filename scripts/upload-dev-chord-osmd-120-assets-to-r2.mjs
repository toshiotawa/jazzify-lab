/**
 * 開発者用 chord_osmd 120BPM テスト: クリック MP3（2本）+ MusicXML v2（2本、`*-v2.musicxml`）を R2 の `fantasy-bgm/` に置く。
 * 先に `node scripts/build-dev-chord-osmd-120-click-mp3.mjs` で MP3 を生成すること（XML は repo の public/fantasy-bgm に同梱）。
 *
 * Usage:
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs --dry-run
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs --dir /path/to/folder
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs --purge-cdn
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs --purge-only
 *   node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs --s3
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
const purgeOnly = process.argv.includes('--purge-only');
const runPurge = purgeCdn || purgeOnly;
const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.DEV_OSMD120_UPLOAD_RETRIES || '4', 10) || 4);

const dirArgIdx = process.argv.indexOf('--dir');
const SRC_DIR =
  dirArgIdx >= 0 && process.argv[dirArgIdx + 1]
    ? resolve(process.argv[dirArgIdx + 1])
    : join(ROOT, 'public', 'fantasy-bgm');

const BUCKET =
  process.env.R2_BUCKET || envR2.R2_BUCKET || envR2.VITE_R2_BUCKET_NAME || 'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

/** @type {readonly { name: string; contentType: string }[]} */
const FILES = [
  { name: 'ear-training-dev-chord-osmd-120-phrase-01.mp3', contentType: 'audio/mpeg' },
  { name: 'ear-training-dev-chord-osmd-120-phrase-02.mp3', contentType: 'audio/mpeg' },
  {
    name: 'ear-training-dev-chord-osmd-120-phrase-01-v2.musicxml',
    contentType: 'application/vnd.recordare.musicxml+xml',
  },
  {
    name: 'ear-training-dev-chord-osmd-120-phrase-02-v2.musicxml',
    contentType: 'application/vnd.recordare.musicxml+xml',
  },
];

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

/**
 * @param {string} localPath
 * @param {string} objectPath
 * @param {string} contentType
 */
function putWithWrangler(localPath, objectPath, contentType) {
  const childEnv = wranglerSpawnEnv(envR2);
  const wranglerArgs = [
    'r2',
    'object',
    'put',
    objectPath,
    '-f',
    localPath,
    '--content-type',
    contentType,
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
    if (r.error && useShell === false) {
      r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: true });
    }
  }

  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText, spawnError: r.error };
}

/**
 * @param {string} localPath
 * @param {string} objectPath
 * @param {string} contentType
 */
async function putWithWranglerRetry(localPath, objectPath, contentType) {
  let last = /** @type {{ ok: boolean; errText: string; spawnError?: Error }} */ ({
    ok: false,
    errText: '',
  });
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

function cdnFileUrls() {
  const raw =
    process.env.VITE_R2_PUBLIC_URL ||
    envR2.VITE_R2_PUBLIC_URL ||
    process.env.R2_PUBLIC_URL ||
    envR2.R2_PUBLIC_URL ||
    'https://jazzify-cdn.com';
  const base = raw.replace(/\/$/, '');
  return FILES.map((f) => `${base}/fantasy-bgm/${f.name}`);
}

async function purgeCdnCacheIfRequested() {
  if (!runPurge) return;

  const zoneId =
    process.env.CLOUDFLARE_ZONE_ID || process.env.CF_ZONE_ID || envR2.CF_ZONE_ID || envR2.CLOUDFLARE_ZONE_ID || '';
  const token =
    process.env.CLOUDFLARE_API_TOKEN ||
    process.env.CF_API_TOKEN ||
    envR2.CF_API_TOKEN ||
    envR2.CLOUDFLARE_API_TOKEN ||
    '';

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

let uploaded = 0;
let errors = 0;

if (!purgeOnly) {
  if (!useS3 && !dryRun) {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
      process.exit(1);
    }
  }

  for (const { name, contentType } of FILES) {
    const localPath = join(SRC_DIR, name);
    const r2Key = `fantasy-bgm/${name}`;
    const objectPath = `${BUCKET}/${r2Key}`;

    if (!existsSync(localPath)) {
      console.error(`見つかりません: ${localPath}`);
      errors++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${localPath} -> ${objectPath} (${contentType})`);
      uploaded++;
      continue;
    }

    if (useS3 && s3) {
      try {
        const body = readFileSync(localPath);
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: r2Key,
            Body: body,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000',
          }),
        );
        uploaded++;
        console.log(`OK  ${name} -> ${r2Key}`);
      } catch (err) {
        errors++;
        console.error(`ERR ${name}: ${/** @type {Error} */ (err).message}`);
      }
    } else {
      const { ok, errText, spawnError } = await putWithWranglerRetry(localPath, objectPath, contentType);
      if (ok) {
        uploaded++;
        const st = readFileSync(localPath);
        console.log(`OK  ${name} -> ${r2Key} (${(st.length / 1024).toFixed(0)} KB)`);
      } else {
        errors++;
        const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
        console.error(`ERR ${name}:\n${detail}\n`);
      }
    }
  }

  console.log(`\nDone. uploaded=${uploaded} errors=${errors}`);
  if (errors > 0) process.exit(1);
}

if (purgeOnly) {
  console.log('モード: --purge-only（アップロードはスキップ）');
}

await purgeCdnCacheIfRequested();
