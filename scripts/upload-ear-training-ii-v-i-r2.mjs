/**
 * II-V-I 1-5（C）耳コピ用 MP3（5本）を R2 にアップロードする。
 * 事前に `node scripts/build-ii-v-i-ear-training-mp3.mjs` で生成したファイルを配置するか、
 * デフォルトの `public/II-V-I_1-50/ear-training-out/` を使う。
 *
 * wrangler: `npx wrangler login`、`.env.r2` または `env.r2` に `CF_ACCOUNT_ID`。手動 put は `npm run wrangler:r2 -- r2 object put …` 可。
 * 代替: `--s3` と CF_ACCESS_KEY / CF_SECRET_KEY（upload-ii-v-i-mp3-to-r2.mjs と同様）
 *
 * Usage:
 *   node scripts/upload-ear-training-ii-v-i-r2.mjs
 *   node scripts/upload-ear-training-ii-v-i-r2.mjs --dry-run
 *   node scripts/upload-ear-training-ii-v-i-r2.mjs --dir /path/to/mp3folder
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
  : Math.max(1, Number.parseInt(process.env.II_V_I_UPLOAD_RETRIES || '4', 10) || 4);

const dirArgIdx = process.argv.indexOf('--dir');
const SRC_DIR =
  dirArgIdx >= 0 && process.argv[dirArgIdx + 1]
    ? resolve(process.argv[dirArgIdx + 1])
    : join(ROOT, 'public', 'II-V-I_1-50', 'ear-training-out');

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

let uploaded = 0;
let errors = 0;

if (!useS3 && !dryRun) {
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
    process.exit(1);
  }
}

for (let i = 1; i <= 5; i += 1) {
  const name = `ear-training-ii-v-i-1-5-c-phrase-${String(i).padStart(2, '0')}.mp3`;
  const localPath = join(SRC_DIR, name);
  const r2Key = `fantasy-bgm/${name}`;
  const objectPath = `${BUCKET}/${r2Key}`;

  if (!existsSync(localPath)) {
    console.error(`見つかりません: ${localPath}\n先に node scripts/build-ii-v-i-ear-training-mp3.mjs を実行してください。`);
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
