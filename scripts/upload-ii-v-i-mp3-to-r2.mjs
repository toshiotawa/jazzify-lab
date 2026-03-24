/**
 * II-V-I MP3 120ファイルを Cloudflare R2 にアップロードする。
 *
 * 既定: npx wrangler（事前に `npx wrangler login` で OAuth ログイン）
 * 代替: --s3 で .env.r2 の S3 API トークン（非対話 CI 向け）
 *   キーローテーション時: ダッシュボードで新トークン発行→古いもの失効→.env.r2 の
 *   CF_ACCESS_KEY / CF_SECRET_KEY だけ差し替え（wrangler ログイン方式では未使用）。
 *
 * wrangler 利用時: .env.r2 に CF_ACCOUNT_ID（= CLOUDFLARE_ACCOUNT_ID）が必要。
 *   プロジェクト直下に wrangler.toml が無いと R2 コマンドはアカウント ID 未設定で失敗しやすい。
 *
 * Usage:
 *   npx wrangler login
 *   # .env.r2 に CF_ACCOUNT_ID=... と R2_BUCKET=...（任意）
 *   node scripts/upload-ii-v-i-mp3-to-r2.mjs
 *   node scripts/upload-ii-v-i-mp3-to-r2.mjs --dry-run
 *   node scripts/upload-ii-v-i-mp3-to-r2.mjs --s3   # .env.r2 必須
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};
  const map = {};
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    map[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return map;
}

const ROOT = resolve(import.meta.dirname, '..');
const envR2Path = join(ROOT, '.env.r2');
const envR2 = loadEnvFile(envR2Path);

const useS3 = process.argv.includes('--s3');
const dryRun = process.argv.includes('--dry-run');

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  'jazzify-assets';

/** wrangler r2 はアカウントID必須（wrangler.toml が無い場合は環境変数） */
const CLOUDFLARE_ACCOUNT_ID =
  process.env.CLOUDFLARE_ACCOUNT_ID ||
  envR2.CF_ACCOUNT_ID ||
  '';

const KEYS = [
  { slug: 'c', suffix: 'C' },
  { slug: 'f', suffix: '+5st_F' },
  { slug: 'bb', suffix: '-2st_Bb' },
  { slug: 'eb', suffix: '+3st_Eb' },
  { slug: 'ab', suffix: '-4st_Ab' },
  { slug: 'db', suffix: '+1st_Db' },
  { slug: 'gb', suffix: '+6st_Gb' },
  { slug: 'b', suffix: '-1st_B' },
  { slug: 'e', suffix: '+4st_E' },
  { slug: 'a', suffix: '-3st_A' },
  { slug: 'd', suffix: '+2st_D' },
  { slug: 'g', suffix: '-5st_G' },
];

const RANGES = ['1-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31-35', '36-40', '41-45', '46-50'];

const SRC_DIR = join(ROOT, 'public', 'II-V-I_1-50');

/** @type {S3Client | null} */
let s3 = null;
if (useS3) {
  const ACCOUNT_ID = envR2.CF_ACCOUNT_ID || process.env.CF_ACCOUNT_ID;
  const ACCESS_KEY = envR2.CF_ACCESS_KEY || process.env.CF_ACCESS_KEY;
  const SECRET_KEY = envR2.CF_SECRET_KEY || process.env.CF_SECRET_KEY;
  if (!ACCOUNT_ID || !ACCESS_KEY || !SECRET_KEY) {
    console.error('--s3 モード: .env.r2 または環境変数に CF_ACCOUNT_ID / CF_ACCESS_KEY / CF_SECRET_KEY が必要です');
    process.exit(1);
  }
  s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
    forcePathStyle: true,
  });
}

function putWithWrangler(localPath, objectPath) {
  const childEnv = {
    ...process.env,
    ...(CLOUDFLARE_ACCOUNT_ID ? { CLOUDFLARE_ACCOUNT_ID } : {}),
  };
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

  /** devDependency の wrangler を node で直起動（Windows の npx ENOENT を避ける） */
  const wranglerCli = join(ROOT, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  let r;
  if (existsSync(wranglerCli)) {
    r = spawnSync(process.execPath, [wranglerCli, ...wranglerArgs], { ...opts, shell: false });
  } else {
    /** Windows: shell:true で npx.cmd が解決される。Git Bash 単体では npx が見えないことがある */
    const useShell = process.platform === 'win32';
    r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: useShell });
    if (r.error && useShell === false) {
      r = spawnSync('npx', ['wrangler', ...wranglerArgs], { ...opts, shell: true });
    }
  }

  const errText = [r.stderr?.toString(), r.stdout?.toString()].filter(Boolean).join('\n').trim();
  return { ok: r.status === 0 && !r.error, errText, spawnError: r.error };
}

let uploaded = 0;
let skipped = 0;
let errors = 0;

if (!useS3 && !dryRun) {
  if (!CLOUDFLARE_ACCOUNT_ID) {
    console.error(
      'wrangler モード: Cloudflare のアカウント ID が必要です。\n' +
        '  .env.r2 に CF_ACCOUNT_ID=... を書く、または環境変数 CLOUDFLARE_ACCOUNT_ID を設定してください。\n' +
        '  （ダッシュボード右サイドバー「アカウント ID」、または R2 の URL に含まれる 32 桁 hex）',
    );
    process.exit(1);
  }
  console.log(
    `R2 バケット: ${BUCKET} / アカウント: ${CLOUDFLARE_ACCOUNT_ID.slice(0, 8)}…（先に npx wrangler login）\n`,
  );
}

for (const range of RANGES) {
  for (const key of KEYS) {
    const localName = `II-V-I_${range}_${key.suffix}.mp3`;
    const localPath = join(SRC_DIR, localName);
    const r2Key = `fantasy-bgm/ii-v-i-${range}-${key.slug}.mp3`;
    const objectPath = `${BUCKET}/${r2Key}`;

    if (!existsSync(localPath)) {
      console.warn(`SKIP (not found): ${localName}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] ${localName} -> ${objectPath}`);
      uploaded++;
      continue;
    }

    if (useS3) {
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
        console.log(`OK  ${localName} -> ${r2Key}  (${(body.length / 1024).toFixed(0)} KB)`);
      } catch (err) {
        errors++;
        console.error(`ERR ${localName}: ${err.message}`);
      }
    } else {
      const { ok, errText, spawnError } = putWithWrangler(localPath, objectPath);
      if (ok) {
        uploaded++;
        const st = readFileSync(localPath);
        console.log(`OK  ${localName} -> ${r2Key}  (${(st.length / 1024).toFixed(0)} KB)`);
      } else {
        errors++;
        const detail = spawnError
          ? spawnError.message
          : errText || '（出力なし。npx wrangler login / バケット名 / R2 権限を確認）';
        console.error(`ERR ${localName}:\n${detail}\n`);
        if (errors === 1 && detail) {
          console.error('--- 以降は同じ原因で失敗する可能性があります。上記を修正してから再実行してください。 ---\n');
        }
      }
    }
  }
}

console.log(`\nDone. uploaded=${uploaded}  skipped=${skipped}  errors=${errors}`);
if (errors > 0) process.exit(1);
