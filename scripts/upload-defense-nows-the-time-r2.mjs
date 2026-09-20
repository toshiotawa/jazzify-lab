/**
 * Now's The Time shared-progression test phrase audio (12 bars / 160 BPM = 18s) to R2.
 *
 * Source files are trimmed to 18.000s before upload when longer than expected.
 *
 * Usage:
 *   node scripts/upload-defense-nows-the-time-r2.mjs
 *   node scripts/upload-defense-nows-the-time-r2.mjs --dry-run
 *   node scripts/upload-defense-nows-the-time-r2.mjs --s3
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

const EXPECTED_SEC = 18;
const TOLERANCE_SEC = 1 / 44100;

const UPLOADS = [
  {
    source: '/Users/apple/Downloads/Now\'s The Time.m4a',
    r2Key: 'fantasy-bgm/defense-nows-the-time-phrase-1.m4a',
  },
  {
    source: '/Users/apple/Downloads/Now\'s The Time 2.m4a',
    r2Key: 'fantasy-bgm/defense-nows-the-time-phrase-2.m4a',
  },
];

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
  return (r.stdout || '').trim();
}

function probeDuration(path) {
  return Number.parseFloat(
    run('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      path,
    ], `ffprobe ${path}`),
  );
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
    'audio/mp4',
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

const WORK_DIR = join(tmpdir(), 'defense-nows-the-time-upload');
mkdirSync(WORK_DIR, { recursive: true });

/** @type {string[]} */
const tempPaths = [];

for (const item of UPLOADS) {
  if (!existsSync(item.source)) {
    console.error(`Source not found: ${item.source}`);
    process.exit(1);
  }

  const sourceDuration = probeDuration(item.source);
  const outPath = join(WORK_DIR, item.r2Key.replace(/\//g, '-'));
  tempPaths.push(outPath);

  if (Math.abs(sourceDuration - EXPECTED_SEC) <= TOLERANCE_SEC) {
    run('cp', [item.source, outPath], `copy ${item.source}`);
  } else if (sourceDuration > EXPECTED_SEC) {
    console.log(`Trim ${item.source}: ${sourceDuration.toFixed(6)}s -> ${EXPECTED_SEC}s`);
    run('ffmpeg', [
      '-y', '-i', item.source,
      '-t', String(EXPECTED_SEC),
      '-c:a', 'aac', '-b:a', '256k',
      outPath,
    ], `trim ${item.source}`);
  } else {
    console.error(
      `Source too short: ${item.source} (${sourceDuration.toFixed(6)}s < ${EXPECTED_SEC}s)`,
    );
    process.exit(1);
  }

  const finalDuration = probeDuration(outPath);
  if (Math.abs(finalDuration - EXPECTED_SEC) > TOLERANCE_SEC) {
    console.error(`Duration mismatch after prepare: ${outPath} = ${finalDuration}s`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(`[dry-run] ${outPath} -> ${item.r2Key} (${finalDuration}s)`);
    continue;
  }

  if (useS3 && s3) {
    const body = readFileSync(outPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: item.r2Key,
        Body: body,
        ContentType: 'audio/mp4',
        CacheControl: 'public, max-age=31536000',
      }),
    );
    console.log(`OK  ${item.r2Key} (${(body.length / 1024).toFixed(0)} KB)`);
  } else {
    if (!CLOUDFLARE_ACCOUNT_ID) {
      console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
      process.exit(1);
    }
    const objectPath = `${BUCKET}/${item.r2Key}`;
    const { ok, errText, spawnError } = await putWithWranglerRetry(outPath, objectPath);
    if (!ok) {
      const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
      console.error(`ERR ${item.r2Key}:\n${detail}\n`);
      process.exit(1);
    }
    const st = readFileSync(outPath);
    console.log(`OK  ${item.r2Key} (${(st.length / 1024).toFixed(0)} KB)`);
  }
}

for (const path of tempPaths) {
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

if (dryRun) {
  process.exit(0);
}

console.log('Done.');
