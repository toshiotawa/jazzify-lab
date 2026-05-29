/**
 * Survival composite phrase karaoke BGM (11 keys, C excluded) を R2 にアップロード。
 *
 * Usage:
 *   node scripts/upload-survival-composite-karaoke-r2.mjs
 *   node scripts/upload-survival-composite-karaoke-r2.mjs --dry-run
 *   node scripts/upload-survival-composite-karaoke-r2.mjs --s3
 *   node scripts/upload-survival-composite-karaoke-r2.mjs --key F
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
const KARAOKE_ROOT = join(ROOT, 'public', 'attack_icons', 'survival_phrases', 'karaoke');
const R2_PREFIX = 'survival-composite-phrases-karaoke';
const CDN_BASE = 'https://jazzify-cdn.com/fantasy-bgm';

/** @type {readonly { label: string; r2Slug: string }[]} */
const KEYS = [
  { label: 'F', r2Slug: 'f' },
  { label: 'Bb', r2Slug: 'bb' },
  { label: 'Eb', r2Slug: 'eb' },
  { label: 'Ab', r2Slug: 'ab' },
  { label: 'Db', r2Slug: 'db' },
  { label: 'Gb', r2Slug: 'gb' },
  { label: 'B', r2Slug: 'b' },
  { label: 'E', r2Slug: 'e' },
  { label: 'A', r2Slug: 'a' },
  { label: 'D', r2Slug: 'd' },
  { label: 'G', r2Slug: 'g' },
];

const useS3 = process.argv.includes('--s3');
const dryRun = process.argv.includes('--dry-run');
const noRetry = process.argv.includes('--no-retry');
const keyFilterIdx = process.argv.indexOf('--key');
const keyFilter = keyFilterIdx >= 0 ? process.argv[keyFilterIdx + 1] : null;

const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.SURVIVAL_KARAOKE_UPLOAD_RETRIES || '4', 10) || 4);

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

/** @type {S3Client | null} */
let s3 = null;
if (useS3) {
  const { accountId, accessKey, secretKey } = r2S3CredentialsFrom(envR2);
  if (!accountId || !accessKey || !secretKey) {
    console.error('--s3 モード: CF_ACCOUNT_ID / CF_ACCESS_KEY / CF_SECRET_KEY が必要です。');
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
    r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: true });
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

function localMp3Path(key) {
  return join(KARAOKE_ROOT, `${key.label}.mp3`);
}

function r2KeyFor(key) {
  return `fantasy-bgm/${R2_PREFIX}-${key.r2Slug}.mp3`;
}

const selectedKeys = keyFilter
  ? KEYS.filter((k) => k.label === keyFilter)
  : KEYS;

if (keyFilter && selectedKeys.length === 0) {
  console.error(`Unknown key: ${keyFilter}`);
  process.exit(1);
}

if (!useS3 && !dryRun && !CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

let uploaded = 0;
let errors = 0;

for (const key of selectedKeys) {
  const localPath = localMp3Path(key);
  const r2Key = r2KeyFor(key);
  const objectPath = `${BUCKET}/${r2Key}`;
  const cdnUrl = `${CDN_BASE}/${R2_PREFIX}-${key.r2Slug}.mp3`;

  if (!existsSync(localPath)) {
    console.error(`MISSING ${localPath}`);
    errors++;
    continue;
  }

  if (dryRun) {
    console.log(`[dry-run] ${key.label}: ${localPath} -> ${objectPath}`);
    console.log(`  CDN: ${cdnUrl}`);
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
      console.log(`OK  ${r2Key} (${(body.length / 1024).toFixed(0)} KB)`);
      console.log(`  CDN: ${cdnUrl}`);
    } catch (err) {
      errors++;
      console.error(`ERR ${key.label}: ${/** @type {Error} */ (err).message}`);
    }
  } else {
    const { ok, errText, spawnError } = await putWithWranglerRetry(localPath, objectPath);
    if (ok) {
      uploaded++;
      const st = readFileSync(localPath);
      console.log(`OK  ${r2Key} (${(st.length / 1024).toFixed(0)} KB)`);
      console.log(`  CDN: ${cdnUrl}`);
    } else {
      errors++;
      const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
      console.error(`ERR ${key.label}:\n${detail}\n`);
    }
  }
}

console.log(`\nDone. uploaded=${uploaded} errors=${errors}`);
if (errors > 0) process.exit(1);
