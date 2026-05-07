/**
 * 開発者用 chord_voicing テスト用クリック MP3（2本）を R2 の `fantasy-bgm/` に置く。
 * 先に `node scripts/build-dev-chord-voicing-click-mp3.mjs` で `public/fantasy-bgm/` に生成すること。
 *
 * wrangler: `npx wrangler login`、`.env.r2` または `env.r2` に `CF_ACCOUNT_ID`。手動 put は `npm run wrangler:r2 -- r2 object put …` 可。
 * 代替: `--s3` と CF_ACCESS_KEY / CF_SECRET_KEY（upload-ii-v-i-mp3-to-r2.mjs と同様）
 *
 * Usage:
 *   node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs
 *   node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs --dry-run
 *   node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs --dir /path/to/folder
 *   node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs --purge-cdn   # アップロード後、2 URL の CDN キャッシュをパージ（要 CF_ZONE_ID + CF_API_TOKEN）
 *   node scripts/upload-dev-chord-voicing-mp3-to-r2.mjs --purge-only   # アップロードせず CDN パージのみ
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
  : Math.max(1, Number.parseInt(process.env.DEV_CHORD_VOICING_UPLOAD_RETRIES || '4', 10) || 4);

const dirArgIdx = process.argv.indexOf('--dir');
const SRC_DIR =
  dirArgIdx >= 0 && process.argv[dirArgIdx + 1]
    ? resolve(process.argv[dirArgIdx + 1])
    : join(ROOT, 'public', 'fantasy-bgm');

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

const FILES = /** @type {const} */ ([
  'ear-training-dev-chord-voicing-phrase-01.mp3',
  'ear-training-dev-chord-voicing-phrase-02.mp3',
]);

/** @type {S3Client | null} */
let s3 = null;
if (useS3) {
  const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
  if (!accountId || !accessKey || !secretKey) {
    console.error(
      '--s3 モード: アカウント ID と S3 互換の Access / Secret が必要です。\n' +
        '  `.env.r2` に例: CF_ACCOUNT_ID, CF_ACCESS_KEY, CF_SECRET_KEY\n' +
        '  または: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY、R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY',
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
    if (r.error && useShell === false) {
      r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: true });
    }
  }

  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText, spawnError: r.error };
}

async function putWithWranglerRetry(localPath, objectPath) {
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
    last = putWithWrangler(localPath, objectPath);
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
  return FILES.map((name) => `${base}/fantasy-bgm/${name}`);
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

let uploaded = 0;
let errors = 0;

if (!purgeOnly) {
  if (!useS3 && !dryRun) {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
      process.exit(1);
    }
  }

  for (const name of FILES) {
    const localPath = join(SRC_DIR, name);
    const r2Key = `fantasy-bgm/${name}`;
    const objectPath = `${BUCKET}/${r2Key}`;

    if (!existsSync(localPath)) {
      console.error(
        `見つかりません: ${localPath}\n先に node scripts/build-dev-chord-voicing-click-mp3.mjs を実行してください。`,
      );
      errors++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${localPath} -> ${objectPath}`);
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
            ContentType: 'audio/mpeg',
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
      const { ok, errText, spawnError } = await putWithWranglerRetry(localPath, objectPath);
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
