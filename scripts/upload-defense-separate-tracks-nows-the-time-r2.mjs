/**
 * Now's The Time separate-tracks test audio (BGM 12 bars + melody 2×2 bars @ 160 BPM) to R2.
 *
 * BGM: synthesized C3 quarter notes, 12 bars at the stage BPM.
 * Melody: synthesized quarter notes at the stage BPM.
 *   Phrase 1: F4 F4 F4 rest / F4 F4 F4 rest
 *   Phrase 2: F4 Ab4 Bb4 rest / F4 Ab4 Bb4 rest
 *
 * Usage:
 *   node scripts/upload-defense-separate-tracks-nows-the-time-r2.mjs
 *   node scripts/upload-defense-separate-tracks-nows-the-time-r2.mjs --melody-only
 *   node scripts/upload-defense-separate-tracks-nows-the-time-r2.mjs --bgm-only --purge-cdn
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
const melodyOnly = process.argv.includes('--melody-only');
const bgmOnly = process.argv.includes('--bgm-only');
const purgeCdn = process.argv.includes('--purge-cdn');
const wranglerRetries = Math.max(1, Number.parseInt(process.env.SOZAI_UPLOAD_RETRIES || '4', 10) || 4);

const SAMPLE_RATE = 44100;
const BPM = 160;
const BEATS_PER_BAR = 4;
const PHRASE_BARS = 2;
const PROGRESSION_BARS = 12;
const FRAMES_PER_BAR = Math.round((SAMPLE_RATE * 60 * BEATS_PER_BAR) / BPM);
const BGM_FRAMES = FRAMES_PER_BAR * PROGRESSION_BARS;
const MELODY_PHRASE_FRAMES = FRAMES_PER_BAR * PHRASE_BARS;
const MELODY_PHRASE_COUNT = 2;

const BGM_MIDI = 48;
/** Quarter-note phrases. null is a quarter rest. */
const MELODY_PATTERNS = [
  [65, 65, 65, null, 65, 65, 65, null],
  [65, 68, 70, null, 65, 68, 70, null],
];

const UPLOADS = [
  {
    r2Key: 'fantasy-bgm/defense-nows-the-time-separate-bgm-v2.wav',
    frames: BGM_FRAMES,
  },
  {
    r2Key: 'fantasy-bgm/defense-nows-the-time-separate-melody-v2.wav',
    frames: MELODY_PHRASE_FRAMES * MELODY_PHRASE_COUNT,
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

function probeHead40msRms(path) {
  const value = run(
    'python3',
    [
      '-c',
      `import wave, math, struct
path = ${JSON.stringify(path)}
with wave.open(path, 'rb') as w:
    nch = w.getnchannels()
    sw = w.getsampwidth()
    sr = w.getframerate()
    count = min(int(sr * 0.04), w.getnframes())
    raw = w.readframes(count)
fmt = '<' + 'h' * (len(raw) // sw)
samples = struct.unpack(fmt, raw)
frames = len(samples) // nch
acc = 0.0
for i in range(frames):
    left = samples[i * nch] / 32768.0
    right = samples[i * nch + (1 if nch > 1 else 0)] / 32768.0
    acc += left * left + right * right
print(math.sqrt(acc / max(1, frames)))`,
    ],
    `head40ms rms ${path}`,
  );
  return Number.parseFloat(value);
}

function midiToHz(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function writeSynthQuarterWav(path, notes, totalFrames) {
  const pcm = new Int16Array(totalFrames * 2);
  const beatSec = 60 / BPM;
  const noteRatio = 0.88;
  const peak = 0.42;

  for (let beat = 0; beat < notes.length; beat += 1) {
    const midi = notes[beat];
    if (midi == null) continue;
    const start = Math.round(beat * beatSec * SAMPLE_RATE);
    const duration = Math.round(beatSec * noteRatio * SAMPLE_RATE);
    const hz = midiToHz(midi);
    for (let i = 0; i < duration; i += 1) {
      const index = start + i;
      if (index < 0 || index >= totalFrames) continue;
      const t = i / SAMPLE_RATE;
      const attackSec = 0.006;
      let envelope = t < attackSec ? t / attackSec : Math.exp(-(t - attackSec) * 7.5);
      const remainSec = (duration - 1 - i) / SAMPLE_RATE;
      if (remainSec < 0.018) {
        envelope *= Math.max(0, remainSec / 0.018);
      }
      const sample = (
        Math.sin(2 * Math.PI * hz * t)
        + Math.sin(2 * Math.PI * hz * 2 * t) * 0.28
        + Math.sin(2 * Math.PI * hz * 3 * t) * 0.12
      ) * envelope * peak;
      const clamped = Math.max(-1, Math.min(1, sample));
      const value = Math.round(clamped * 32767);
      pcm[index * 2] = value;
      pcm[index * 2 + 1] = value;
    }
  }

  const dataBytes = Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataBytes.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataBytes.length, 40);
  writeFileSync(path, Buffer.concat([header, dataBytes]));
}

function writeSynthMelodyWav(path) {
  const notes = MELODY_PATTERNS.flat();
  writeSynthQuarterWav(path, notes, MELODY_PHRASE_FRAMES * MELODY_PHRASE_COUNT);
}

function writeSynthBgmWav(path) {
  const beatCount = PROGRESSION_BARS * BEATS_PER_BAR;
  writeSynthQuarterWav(path, Array.from({ length: beatCount }, () => BGM_MIDI), BGM_FRAMES);
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

const bgmPath = join(WORK_DIR, 'defense-nows-the-time-separate-bgm.wav');
const melodyPath = join(WORK_DIR, 'defense-nows-the-time-separate-melody.wav');
const previewDir = join(ROOT, 'supabase/exported-audio/nows-the-time-separate');

if (!melodyOnly) {
  console.log(`Synthesize BGM C3 quarters, ${PROGRESSION_BARS} bars @ ${BPM} BPM`);
  writeSynthBgmWav(bgmPath);
  const bgmHeadRms = probeHead40msRms(bgmPath);
  if (bgmHeadRms < 0.01) {
    throw new Error(`BGM head40ms RMS too low: ${bgmHeadRms}`);
  }
  console.log(`OK BGM head40ms RMS ${bgmHeadRms.toFixed(4)}`);
}

if (!bgmOnly) {
  console.log('Synthesize melody quarters @ 160 BPM');
  writeSynthMelodyWav(melodyPath);
  const headRms = probeHead40msRms(melodyPath);
  if (headRms < 0.01) {
    throw new Error(`melody head40ms RMS too low: ${headRms}`);
  }
  console.log(`OK melody head40ms RMS ${headRms.toFixed(4)}`);
}

const encoded = [
  ...(melodyOnly ? [] : [{ path: bgmPath, frames: BGM_FRAMES, r2Key: UPLOADS[0]?.r2Key ?? '' }]),
  ...(bgmOnly ? [] : [{
    path: melodyPath,
    frames: MELODY_PHRASE_FRAMES * MELODY_PHRASE_COUNT,
    r2Key: UPLOADS[1]?.r2Key ?? '',
  }]),
];

for (const item of encoded) {
  const samples = probeSamples(item.path);
  if (Math.abs(samples - item.frames) > 1) {
    console.error(`Frame mismatch ${item.path}: expected ${item.frames}, got ${samples}`);
    process.exit(1);
  }
  console.log(`OK local ${item.r2Key} ${samples} frames`);
}

mkdirSync(previewDir, { recursive: true });
if (!melodyOnly) {
  writeFileSync(
    join(previewDir, 'defense-nows-the-time-separate-bgm.wav'),
    readFileSync(bgmPath),
  );
}
if (!bgmOnly) {
  const previewMelody = join(previewDir, 'defense-nows-the-time-separate-melody.wav');
  writeFileSync(previewMelody, readFileSync(melodyPath));
  for (let phrase = 0; phrase < MELODY_PHRASE_COUNT; phrase += 1) {
    const previewPhrase = join(previewDir, `melody-phrase-${phrase + 1}-synth.wav`);
    const start = phrase * MELODY_PHRASE_FRAMES;
    run('ffmpeg', [
      '-y',
      '-i', melodyPath,
      '-af', `atrim=start_sample=${start}:end_sample=${start + MELODY_PHRASE_FRAMES},asetpts=PTS-STARTPTS`,
      '-c:a', 'pcm_s16le',
      previewPhrase,
    ], `preview phrase ${phrase + 1}`);
  }
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

for (const path of [bgmPath, melodyPath]) {
  try {
    unlinkSync(path);
  } catch {
    /* ignore */
  }
}

if (purgeCdn) {
  const zoneId = process.env.CF_ZONE_ID || envR2.CF_ZONE_ID || envR2.CLOUDFLARE_ZONE_ID || '';
  const token = process.env.CF_API_TOKEN || envR2.CF_API_TOKEN || envR2.CLOUDFLARE_API_TOKEN || '';
  const files = encoded.map((item) => `https://jazzify-cdn.com/${item.r2Key}`);
  if (!zoneId || !token) {
    console.error('CDN パージには CF_ZONE_ID と CF_API_TOKEN が必要です。');
    process.exit(1);
  }
  const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    console.error('CDN パージ失敗:', res.status, JSON.stringify(body));
    process.exit(1);
  }
  console.log(`CDN: purged ${files.length} file(s)`);
}

console.log('Done.');
