/**
 * Now's The Time separate-tracks test audio (BGM 12 bars + melody 2×2 bars @ 160 BPM) to R2.
 *
 * BGM: first chorus of local F-blues comping.
 * Melody: first 2 bars of each Now's The Time CDN phrase, concatenated.
 *
 * Usage:
 *   node scripts/upload-defense-separate-tracks-nows-the-time-r2.mjs
 *   node scripts/upload-defense-separate-tracks-nows-the-time-r2.mjs --dry-run
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { loadEnvR2Map } from './load-env-r2.mjs';
import { r2AccountIdFrom, wranglerSpawnEnv } from './r2-env-helpers.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const envR2 = loadEnvR2Map(ROOT);
const dryRun = process.argv.includes('--dry-run');
const wranglerRetries = Math.max(1, Number.parseInt(process.env.SOZAI_UPLOAD_RETRIES || '4', 10) || 4);

const SAMPLE_RATE = 44100;
const BPM = 160;
const BEATS_PER_BAR = 4;
const PHRASE_BARS = 2;
const PROGRESSION_BARS = 12;
const FRAMES_PER_BAR = Math.round((SAMPLE_RATE * 60 * BEATS_PER_BAR) / BPM);
const BGM_FRAMES = FRAMES_PER_BAR * PROGRESSION_BARS;
const MELODY_PHRASE_FRAMES = FRAMES_PER_BAR * PHRASE_BARS;

const BGM_SOURCE = '/Users/apple/Downloads/Blues_Comping.mp3';
const PHRASE_URLS = [
  'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-1.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-2.mp3',
];

const UPLOADS = [
  {
    r2Key: 'fantasy-bgm/defense-nows-the-time-separate-bgm.wav',
    frames: BGM_FRAMES,
  },
  {
    r2Key: 'fantasy-bgm/defense-nows-the-time-separate-melody.wav',
    frames: MELODY_PHRASE_FRAMES * PHRASE_URLS.length,
  },
];

const BUCKET =
  process.env.R2_BUCKET ||
  envR2.R2_BUCKET ||
  envR2.VITE_R2_BUCKET_NAME ||
  'jazzify-assets';
const CLOUDFLARE_ACCOUNT_ID = r2AccountIdFrom(envR2);

const WORK_DIR = join(tmpdir(), 'defense-separate-tracks-nows-the-time');
mkdirSync(WORK_DIR, { recursive: true });

function run(cmd, args, label) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(`${label} failed: ${r.stderr || r.stdout}`);
  }
  return (r.stdout || '').trim();
}

function probeSamples(path) {
  return Number.parseInt(
    run(
      'python3',
      ['-c', `import wave; print(wave.open(${JSON.stringify(path)}).getnframes())`],
      `wave frames ${path}`,
    ),
    10,
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
    'audio/wav',
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
  for (let attempt = 0; attempt < wranglerRetries; attempt += 1) {
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

if (!existsSync(BGM_SOURCE)) {
  console.error(`Source not found: ${BGM_SOURCE}`);
  process.exit(1);
}

const bgmPath = join(WORK_DIR, 'defense-nows-the-time-separate-bgm.wav');
const melodyPath = join(WORK_DIR, 'defense-nows-the-time-separate-melody.wav');
const phrasePaths = PHRASE_URLS.map((_, index) => join(WORK_DIR, `phrase-${index + 1}.mp3`));

console.log(`Encode BGM ${BGM_FRAMES} frames @ ${SAMPLE_RATE}`);
run('ffmpeg', [
  '-y',
  '-i', BGM_SOURCE,
  '-af', `aformat=sample_rates=${SAMPLE_RATE}:channel_layouts=stereo,atrim=end_sample=${BGM_FRAMES},asetpts=PTS-STARTPTS`,
  '-c:a', 'pcm_s16le',
  bgmPath,
], 'encode BGM wav');

for (let i = 0; i < PHRASE_URLS.length; i += 1) {
  const url = PHRASE_URLS[i];
  if (!url) continue;
  console.log(`Download ${url}`);
  run('curl', ['-fsSL', url, '-o', phrasePaths[i]], `download phrase ${i + 1}`);
}

const concatListPath = join(WORK_DIR, 'melody-concat.txt');
const slicedPaths = phrasePaths.map((source, index) => {
  const sliced = join(WORK_DIR, `melody-slice-${index}.wav`);
  run('ffmpeg', [
    '-y',
    '-i', source,
    '-af', `aformat=sample_rates=${SAMPLE_RATE}:channel_layouts=stereo,atrim=end_sample=${MELODY_PHRASE_FRAMES},asetpts=PTS-STARTPTS`,
    '-c:a', 'pcm_s16le',
    sliced,
  ], `slice melody ${index + 1}`);
  return sliced;
});
writeFileSync(
  concatListPath,
  slicedPaths.map((path) => `file '${path.replaceAll("'", "'\\''")}'`).join('\n'),
);
run('ffmpeg', [
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', concatListPath,
  '-c', 'copy',
  melodyPath,
], 'concat melody wav');

const encoded = [
  { path: bgmPath, frames: BGM_FRAMES, r2Key: UPLOADS[0]?.r2Key ?? '' },
  { path: melodyPath, frames: MELODY_PHRASE_FRAMES * PHRASE_URLS.length, r2Key: UPLOADS[1]?.r2Key ?? '' },
];

for (const item of encoded) {
  const samples = probeSamples(item.path);
  if (Math.abs(samples - item.frames) > 1) {
    console.error(`Frame mismatch ${item.path}: expected ${item.frames}, got ${samples}`);
    process.exit(1);
  }
  console.log(`OK local ${item.r2Key} ${samples} frames`);
}

if (dryRun) {
  process.exit(0);
}

if (!CLOUDFLARE_ACCOUNT_ID) {
  console.error('wrangler モード: `.env.r2` または `env.r2` に CF_ACCOUNT_ID が必要です。');
  process.exit(1);
}

for (const item of encoded) {
  const objectPath = `${BUCKET}/${item.r2Key}`;
  const { ok, errText, spawnError } = await putWithWranglerRetry(item.path, objectPath);
  if (!ok) {
    const detail = spawnError ? spawnError.message : errText || 'wrangler 失敗';
    console.error(`ERR ${item.r2Key}:\n${detail}\n`);
    process.exit(1);
  }
  const st = readFileSync(item.path);
  console.log(`OK  ${item.r2Key} (${(st.length / 1024).toFixed(0)} KB)`);
}

for (const path of [bgmPath, melodyPath, concatListPath, ...phrasePaths, ...slicedPaths]) {
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

console.log('Done.');
