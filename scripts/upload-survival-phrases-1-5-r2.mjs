/**
 * Survival Phrases 1-5 MP3 を 4 小節（160 BPM = 6s）ごとに分割して R2 にアップロードする。
 *
 * Usage:
 *   node scripts/upload-survival-phrases-1-5-r2.mjs
 *   node scripts/upload-survival-phrases-1-5-r2.mjs --dry-run
 *   node scripts/upload-survival-phrases-1-5-r2.mjs --s3
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
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
  : Math.max(1, Number.parseInt(process.env.SURVIVAL_PHRASES_UPLOAD_RETRIES || '4', 10) || 4);

const SOURCE = join(ROOT, 'public', 'Survival_Phrases', '1-5.mp3');
const WORK_DIR = join(ROOT, 'public', 'Survival_Phrases', '.r2-out');
const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

const BPM = 160;
const MEASURES_PER_STAGE = 4;
const BEATS_PER_MEASURE = 4;
const SEGMENT_SEC = (60 / BPM) * BEATS_PER_MEASURE * MEASURES_PER_STAGE;
const STAGE_COUNT = 5;
const R2_PREFIX = 'survival-phrases-dm7-1-5-stage';

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

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed: ${r.stderr || r.stdout}`);
  }
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

function splitStageMp3(stageNumber) {
  const outName = `${R2_PREFIX}-${String(stageNumber).padStart(2, '0')}.mp3`;
  const outPath = join(WORK_DIR, outName);
  const start = (stageNumber - 1) * SEGMENT_SEC;
  run('ffmpeg', [
    '-y',
    '-ss',
    String(start),
    '-t',
    String(SEGMENT_SEC),
    '-i',
    SOURCE,
    '-c:a',
    'libmp3lame',
    '-q:a',
    '2',
    outPath,
  ]);
  return { outName, outPath, r2Key: `fantasy-bgm/${outName}` };
}

if (!existsSync(SOURCE)) {
  console.error(`見つかりません: ${SOURCE}`);
  process.exit(1);
}

if (!dryRun) {
  mkdirSync(WORK_DIR, { recursive: true });
}

if (!useS3 && !dryRun && !CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

let uploaded = 0;
let errors = 0;

for (let stage = 1; stage <= STAGE_COUNT; stage += 1) {
  const { outName, outPath, r2Key } = splitStageMp3(stage);
  const objectPath = `${BUCKET}/${r2Key}`;

  if (dryRun) {
    console.log(
      `[dry-run] stage ${stage}: ${SOURCE} @ ${((stage - 1) * SEGMENT_SEC).toFixed(3)}s + ${SEGMENT_SEC}s -> ${objectPath}`,
    );
    uploaded++;
    continue;
  }

  if (useS3 && s3) {
    try {
      const body = readFileSync(outPath);
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
      console.log(`OK  ${outName} -> ${r2Key}`);
    } catch (err) {
      errors++;
      console.error(`ERR ${outName}: ${/** @type {Error} */ (err).message}`);
    }
  } else {
    const { ok, errText, spawnError } = await putWithWranglerRetry(outPath, objectPath);
    if (ok) {
      uploaded++;
      const st = readFileSync(outPath);
      console.log(`OK  ${outName} -> ${r2Key} (${(st.length / 1024).toFixed(0)} KB)`);
    } else {
      errors++;
      const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
      console.error(`ERR ${outName}:\n${detail}\n`);
    }
  }

  if (!dryRun && existsSync(outPath)) {
    unlinkSync(outPath);
  }
}

console.log(`\nDone. uploaded=${uploaded} errors=${errors} segmentSec=${SEGMENT_SEC}`);
if (errors > 0) process.exit(1);
