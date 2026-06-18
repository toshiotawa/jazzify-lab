/**
 * Drop2 II-V-I ABA デモ BGM を R2 の `sozai/` にアップロード。
 *
 * 先に `node scripts/build-drop2-iivi-aba-demo-bgm.mjs` を実行すること。
 *
 * Usage:
 *   node scripts/upload-drop2-iivi-aba-demo-r2.mjs
 *   node scripts/upload-drop2-iivi-aba-demo-r2.mjs --dry-run
 *   node scripts/upload-drop2-iivi-aba-demo-r2.mjs --s3
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
const LOCAL_PATH = join(ROOT, 'public', 'sozai', 'drop2_iivi_aba_demo_100bpm_bgm.mp3');
const R2_KEY = 'sozai/drop2_iivi_aba_demo_100bpm_bgm.mp3';

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

if (!existsSync(LOCAL_PATH)) {
  console.error(`Missing: ${LOCAL_PATH}\n先に node scripts/build-drop2-iivi-aba-demo-bgm.mjs を実行してください。`);
  process.exit(1);
}

if (dryRun) {
  console.log(`[dry-run] ${LOCAL_PATH} -> ${R2_KEY}`);
  process.exit(0);
}

if (!useS3 && !CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

const objectPath = `${BUCKET}/${R2_KEY}`;

if (useS3 && s3) {
  try {
    const body = readFileSync(LOCAL_PATH);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: R2_KEY,
        Body: body,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000',
      }),
    );
    console.log(`OK  drop2_iivi_aba_demo_100bpm_bgm.mp3 -> ${R2_KEY}`);
  } catch (err) {
    console.error(`ERR: ${/** @type {Error} */ (err).message}`);
    process.exit(1);
  }
} else {
  const { ok, errText, spawnError } = await putWithWranglerRetry(LOCAL_PATH, objectPath, 'audio/mpeg');
  if (ok) {
    const st = readFileSync(LOCAL_PATH);
    console.log(`OK  drop2_iivi_aba_demo_100bpm_bgm.mp3 -> ${R2_KEY} (${(st.length / 1024).toFixed(0)} KB)`);
  } else {
    const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
    console.error(`ERR:\n${detail}\n`);
    process.exit(1);
  }
}

console.log('Done.');
