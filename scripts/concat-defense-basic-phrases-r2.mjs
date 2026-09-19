/**
 * Basic コースの 4 フレーズ音源（各 4 小節 / 160BPM）を 1 本に結合して R2 へ置く。
 *
 * Usage:
 *   node scripts/concat-defense-basic-phrases-r2.mjs
 *   node scripts/concat-defense-basic-phrases-r2.mjs --dry-run
 *   node scripts/concat-defense-basic-phrases-r2.mjs --s3
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
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

const SOURCE_URLS = [
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-01.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-02.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-03.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-04.mp3',
];

const R2_KEY = 'fantasy-bgm/defense-phrases-i-iv-concat-160bpm.mp3';
const WORK_DIR = join(tmpdir(), 'defense-phrases-concat');
const OUT_PATH = join(WORK_DIR, 'defense-phrases-i-iv-concat-160bpm.mp3');

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

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`${label} failed: ${r.stderr || r.stdout}`);
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
  let last = { ok: false, errText: '', spawnError: undefined };
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

if (dryRun) {
  console.log(`[dry-run] concat ${SOURCE_URLS.length} files -> ${R2_KEY}`);
  process.exit(0);
}

mkdirSync(WORK_DIR, { recursive: true });
const inputs = SOURCE_URLS.map((_, index) => join(WORK_DIR, `phrase-${index + 1}.mp3`));
for (const [index, url] of SOURCE_URLS.entries()) {
  run('curl', ['-fsSL', '-o', inputs[index], url], `download ${index + 1}`);
}

run('ffmpeg', [
  '-y',
  '-i', inputs[0],
  '-i', inputs[1],
  '-i', inputs[2],
  '-i', inputs[3],
  '-filter_complex', '[0:a][1:a][2:a][3:a]concat=n=4:v=0:a=1[a]',
  '-map', '[a]',
  '-c:a', 'libmp3lame',
  '-q:a', '2',
  OUT_PATH,
], 'ffmpeg concat');

if (!useS3 && !CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

const objectPath = `${BUCKET}/${R2_KEY}`;

if (useS3 && s3) {
  const body = readFileSync(OUT_PATH);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: R2_KEY,
      Body: body,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000',
    }),
  );
  console.log(`OK  ${R2_KEY} (${(body.length / 1024).toFixed(0)} KB)`);
} else {
  const { ok, errText, spawnError } = await putWithWranglerRetry(OUT_PATH, objectPath);
  if (!ok) {
    const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
    console.error(`ERR:\n${detail}\n`);
    process.exit(1);
  }
  const st = readFileSync(OUT_PATH);
  console.log(`OK  ${R2_KEY} (${(st.length / 1024).toFixed(0)} KB)`);
}

for (const path of [...inputs, OUT_PATH]) {
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

console.log('Done.');
