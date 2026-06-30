/**
 * Bluesy Licks 資産を R2 の `sozai/bluesy-licks/` にアップロード。
 * .musicxml をアップロードした場合、Supabase 用 cache-bust マイグレーションも自動生成する。
 *
 * Usage:
 *   node scripts/upload-bluesy-licks-r2.mjs
 *   node scripts/upload-bluesy-licks-r2.mjs --dry-run
 *   node scripts/upload-bluesy-licks-r2.mjs --s3
 *   node scripts/upload-bluesy-licks-r2.mjs --skip-cache-bust-migration
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2AccountIdFrom, r2S3CredentialsFrom, wranglerSpawnEnv } from './r2-env-helpers.mjs';
import { OUT_DIR, PHRASE_SPECS, phraseAssetBase } from './bluesy-licks-config.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const envR2 = loadEnvR2Map(ROOT);

const args = process.argv.slice(2);
const useS3 = args.includes('--s3');
const dryRun = args.includes('--dry-run');
const skipCacheBustMigration = args.includes('--skip-cache-bust-migration');
const noRetry = args.includes('--no-retry');
const phraseOnly = args.includes('--phrase') ? Number.parseInt(args[args.indexOf('--phrase') + 1], 10) : null;
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

function contentType(name) {
  if (name.endsWith('.mp3')) {
    return 'audio/mpeg';
  }
  if (name.endsWith('.musicxml')) {
    return 'application/vnd.recordare.musicxml+xml';
  }
  if (name.endsWith('.mid')) {
    return 'audio/midi';
  }
  return 'application/octet-stream';
}

function listUploadFiles() {
  if (!existsSync(OUT_DIR)) {
    return [];
  }
  return readdirSync(OUT_DIR).filter(
    (name) => name.startsWith('bluesy-licks-') && (
      name.endsWith('.mp3')
      || name.endsWith('.musicxml')
      || name.endsWith('.mid')
    ),
  );
}

function putWithWrangler(localPath, objectPath, ct) {
  const childEnv = wranglerSpawnEnv(envR2);
  const wranglerArgs = [
    'r2',
    'object',
    'put',
    objectPath,
    '-f',
    localPath,
    '--content-type',
    ct,
    '--cache-control',
    'public,max-age=31536000',
  ];
  const opts = {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: childEnv,
  };
  const wranglerCli = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  let r;
  if (existsSync(wranglerCli)) {
    r = spawnSync(process.execPath, [wranglerCli, ...wranglerArgs], { ...opts, shell: false });
  } else {
    const useShell = process.platform === 'win32';
    r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: useShell });
  }
  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText };
}

async function putWithWranglerRetry(localPath, objectPath, ct) {
  for (let attempt = 1; attempt <= wranglerRetries; attempt += 1) {
    const { ok, errText } = putWithWrangler(localPath, objectPath, ct);
    if (ok) {
      return;
    }
    if (attempt >= wranglerRetries) {
      throw new Error(`wrangler put failed: ${errText}`);
    }
    await delay(1500 * attempt);
  }
}

async function uploadOne(name) {
  const localPath = join(OUT_DIR, name);
  const objectPath = `${BUCKET}/sozai/bluesy-licks/${name}`;
  const ct = contentType(name);
  if (dryRun) {
    console.log(`[dry-run] ${localPath} -> ${objectPath}`);
    return name.endsWith('.musicxml');
  }
  if (useS3 && s3) {
    const body = readFileSync(localPath);
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `sozai/bluesy-licks/${name}`,
      Body: body,
      ContentType: ct,
      CacheControl: 'public,max-age=31536000',
    }));
  } else {
    await putWithWranglerRetry(localPath, objectPath, ct);
  }
  console.log(`uploaded ${name}`);
  return name.endsWith('.musicxml');
}

/** @returns {string} e.g. 202606301930 */
function cacheBustVersionTag() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

/** @param {string} version */
function writeMusicXmlCacheBustMigration(version) {
  const migrationStamp = `${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
  const migrationPath = join(ROOT, 'supabase', 'migrations', `${migrationStamp}_bluesy_licks_musicxml_url_cache_bust.sql`);
  const sql = `-- Bluesy Licks: MusicXML 差し替え後のブラウザキャッシュ回避（upload-bluesy-licks-r2.mjs 自動生成）
BEGIN;

UPDATE public.ear_training_phrases
SET
  music_xml_url = regexp_replace(
    music_xml_url,
    '\\?v=[^&]+$',
    ''
  ) || '?v=${version}',
  updated_at = now()
WHERE music_xml_url LIKE 'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-%_loop4_ci.musicxml%';

COMMIT;
`;
  writeFileSync(migrationPath, sql, 'utf8');
  console.log(`Wrote ${migrationPath} (?v=${version})`);
}

async function main() {
  const files = listUploadFiles();
  if (files.length === 0) {
    console.error(`No files in ${OUT_DIR}. Run prepare-bluesy-licks-assets.mjs first.`);
    process.exit(1);
  }
  const expected = new Set();
  for (const spec of PHRASE_SPECS) {
    expected.add(`${phraseAssetBase(spec.phraseIndex, false)}_loop4_ci.musicxml`);
    expected.add(`${phraseAssetBase(spec.phraseIndex, false)}_loop4_ci.mp3`);
    expected.add(`${phraseAssetBase(spec.phraseIndex, true)}_loop4_ci.mp3`);
  }
  for (const name of expected) {
    if (!files.includes(name)) {
      console.warn(`Missing expected asset: ${name}`);
    }
  }
  let uploadedAnyMusicXml = false;
  for (const name of files.sort()) {
    if (phraseOnly !== null && !name.includes(`-${String(phraseOnly).padStart(2, '0')}-`)) {
      continue;
    }
    if (await uploadOne(name)) {
      uploadedAnyMusicXml = true;
    }
  }
  if (uploadedAnyMusicXml && !dryRun && !skipCacheBustMigration) {
    writeMusicXmlCacheBustMigration(cacheBustVersionTag());
  }
  console.log('Done upload-bluesy-licks-r2');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
