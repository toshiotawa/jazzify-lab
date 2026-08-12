/**
 * メインクエスト Ch6 (mq-b5) Fブルース sozai を R2 の `sozai/` にアップロード。
 *
 * Usage:
 *   node scripts/upload-sozai-main-quest-block5-r2.mjs
 *   node scripts/upload-sozai-main-quest-block5-r2.mjs --dry-run
 *   node scripts/upload-sozai-main-quest-block5-r2.mjs --s3
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
const SRC_DIR = join(ROOT, 'public', 'sozai');

const useS3 = process.argv.includes('--s3');
const dryRun = process.argv.includes('--dry-run');
const noRetry = process.argv.includes('--no-retry');
const wranglerRetries = noRetry
  ? 1
  : Math.max(1, Number.parseInt(process.env.SOZAI_UPLOAD_RETRIES || '4', 10) || 4);

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

const BASES = [
  'mq-b5-6-1-2',
  'mq-b5-6-2-6',
  'mq-b5-6-3-6',
  'mq-b5-6-4-3',
  'mq-b5-6-4-4',
  'mq-b5-6-4-5',
  'mq-b5-6-4-6',
  'mq-b5-6-5-2',
  'mq-b5-6-5-3',
  'mq-b5-6-5-4',
  'mq-b5-6-6-1',
  'mq-b5-6-6-2',
  'mq-b5-6-7-2',
  'mq-b5-6-8-2',
  'mq-b5-6-8-3',
  'mq-b5-6-8-4',
  'mq-b5-6-9',
  'mq-b5-6-10-2',
];

const CUE_BASES = new Set([
  'mq-b5-6-1-2',
  'mq-b5-6-4-6',
  'mq-b5-6-5-2',
  'mq-b5-6-5-3',
  'mq-b5-6-5-4',
  'mq-b5-6-6-1',
  'mq-b5-6-6-2',
  'mq-b5-6-7-2',
]);

const MP3_BASES = new Set([
  'mq-b5-6-1-2',
  'mq-b5-6-4-3',
  'mq-b5-6-4-4',
  'mq-b5-6-4-5',
  'mq-b5-6-5-2',
  'mq-b5-6-5-3',
  'mq-b5-6-5-4',
  'mq-b5-6-6-1',
  'mq-b5-6-6-2',
  'mq-b5-6-7-2',
  'mq-b5-6-8-2',
  'mq-b5-6-8-3',
  'mq-b5-6-8-4',
  'mq-b5-6-9',
  'mq-b5-6-10-2',
]);

const NO_PRECISION = new Set(['mq-b5-6-9']);

/** @type {readonly { name: string; contentType: string }[]} */
const FILES = [
  ...BASES.flatMap((base) => {
    /** @type {{ name: string; contentType: string }[]} */
    const out = [{ name: `${base}.musicxml`, contentType: 'application/vnd.recordare.musicxml+xml' }];
    if (MP3_BASES.has(base)) {
      out.push({ name: `${base}.mp3`, contentType: 'audio/mpeg' });
    }
    if (CUE_BASES.has(base)) {
      out.push({
        name: `${base}-guide-voice4-cue.musicxml`,
        contentType: 'application/vnd.recordare.musicxml+xml',
      });
    }
    if (!NO_PRECISION.has(base)) {
      out.push({
        name: `${base}-precision.musicxml`,
        contentType: 'application/vnd.recordare.musicxml+xml',
      });
    }
    return out;
  }),
  { name: 'mq-b5-6-karaoke.mp3', contentType: 'audio/mpeg' },
  ...[1, 2, 3, 4, 5].map((i) => ({
    name: `mq-b5-6-9-${i}-loop.mp3`,
    contentType: 'audio/mpeg',
  })),
];

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

async function putWithWranglerRetry(localPath, objectPath, contentType) {
  let last = { ok: false, errText: '', spawnError: undefined };
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

let uploaded = 0;
let errors = 0;

if (!useS3 && !dryRun && !CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

for (const { name, contentType } of FILES) {
  const localPath = join(SRC_DIR, name);
  const r2Key = `sozai/${name}`;
  const objectPath = `${BUCKET}/${r2Key}`;

  if (!existsSync(localPath)) {
    console.error(`見つかりません: ${localPath}`);
    errors++;
    continue;
  }

  if (dryRun) {
    console.log(`[dry-run] ${localPath} -> ${r2Key}`);
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
