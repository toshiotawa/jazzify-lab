#!/usr/bin/env node
/**
 * Major II-V-I Bebop Lick (Short II-V 2 Bars) アセット生成。
 *
 * Usage:
 *   node scripts/prepare-major-251-short-2bars-assets.mjs
 *   node scripts/prepare-major-251-short-2bars-assets.mjs --xml-only
 *   node scripts/prepare-major-251-short-2bars-assets.mjs --mp3-only
 *   node scripts/prepare-major-251-short-2bars-assets.mjs --stage 1 --key c
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { JSDOM } from 'jsdom';
import {
  SOURCE_MUSICXML,
  SOURCE_MP3,
  OUT_DIR,
  CLICK_MP3,
  BPM,
  BEATS_PER_MEASURE,
  MEASURE_SEC,
  SHORT_2BARS_STAGES,
  KEYS,
  CALL_RESPONSE_OFFSET,
  assetBaseName,
  mp3BaseName,
} from './major-251-short-2bars-config.mjs';
import {
  extractPhraseBodyXml,
  convertCallResponseMusicXml,
  prependBlankMeasure,
  countVoice1PitchNotes,
  countVoice4PitchNotes,
} from './musicxml-call-response-utils.mjs';
import {
  setMusicXmlTempo,
  transposeMusicXmlString,
} from './musicxml-transpose-utils.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const xmlOnly = args.includes('--xml-only');
const mp3Only = args.includes('--mp3-only');
const stageOnly = args.includes('--stage')
  ? Number.parseInt(args[args.indexOf('--stage') + 1], 10)
  : null;
const keyOnly = args.includes('--key')
  ? args[args.indexOf('--key') + 1]?.toLowerCase()
  : null;

const FIRST_CLICK_GAIN = 1;
const CLICK_GAIN = 0.82;
const COUNT_IN_SEC = MEASURE_SEC;

function run(cmd, cmdArgs, label) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 40 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${label} failed (${r.status}): ${r.stderr || r.stdout || ''}`);
  }
  return r;
}

function probeDuration(path) {
  const r = spawnSync('ffmpeg', ['-i', path], { encoding: 'utf8' });
  const text = `${r.stderr || ''}${r.stdout || ''}`;
  const m = text.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

function buildDrumstickCountInTrack(outPath) {
  const spb = 60 / BPM;
  const delayMs = Math.round(spb * 1000);
  const delays = Array.from({ length: BEATS_PER_MEASURE }, (_, i) => i * delayMs);
  const gains = delays.map((_, i) => (i === 0 ? FIRST_CLICK_GAIN : CLICK_GAIN));
  const splitLabels = delays.map((_, i) => `[d${i}]`).join('');
  const delayed = delays.map((ms, i) => `[d${i}]adelay=${ms}|${ms},volume=${gains[i]}[c${i}]`).join(';');
  const mixInputs = ['[0:a]', ...delays.map((_, i) => `[c${i}]`)].join('');
  const filter = [
    `[1:a]asplit=${BEATS_PER_MEASURE}${splitLabels}`,
    delayed,
    `${mixInputs}amix=inputs=${BEATS_PER_MEASURE + 1}:duration=first:dropout_transition=0[out]`,
  ].join(';');
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=stereo:d=${COUNT_IN_SEC}`,
    '-i', CLICK_MP3,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg drumstick count-in');
}

function sliceMp3(sourceMp3, startSec, durationSec, outPath) {
  run('ffmpeg', [
    '-y',
    '-ss', String(startSec),
    '-t', String(durationSec),
    '-i', sourceMp3,
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg slice');
}

function concatMp3(leadPath, bodyPath, outPath) {
  run('ffmpeg', [
    '-y',
    '-i', leadPath,
    '-i', bodyPath,
    '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1[out]',
    '-map', '[out]',
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], 'ffmpeg concat');
}

function pitchShiftMp3(inputPath, semitones, outPath) {
  if (semitones === 0) {
    run('ffmpeg', ['-y', '-i', inputPath, '-c:a', 'copy', outPath], 'ffmpeg copy');
    return;
  }
  const ratio = 2 ** (semitones / 12);
  run('ffmpeg', [
    '-y',
    '-i', inputPath,
    '-filter:a', `rubberband=pitch=${ratio}:pitchq=quality`,
    '-c:a', 'libmp3lame',
    '-q:a', '2',
    outPath,
  ], `ffmpeg rubberband ${semitones > 0 ? '+' : ''}${semitones}`);
}

function buildStageMusicXml(sourceXml, stage, mode) {
  let xml = extractPhraseBodyXml(sourceXml, stage.sourceFrom, stage.sourceTo, BPM);
  xml = setMusicXmlTempo(xml, BPM);
  xml = convertCallResponseMusicXml(xml, mode, BEATS_PER_MEASURE, {
    responseOffset: CALL_RESPONSE_OFFSET,
  });
  xml = prependBlankMeasure(xml, BEATS_PER_MEASURE, false);
  return xml;
}

function selectedStages() {
  return SHORT_2BARS_STAGES.filter((s) => stageOnly === null || s.stageIndex === stageOnly);
}

function selectedKeys() {
  return KEYS.filter((k) => keyOnly === null || k.slug === keyOnly);
}

function main() {
  if (!existsSync(SOURCE_MUSICXML)) {
    throw new Error(`Missing MusicXML: ${SOURCE_MUSICXML}`);
  }
  if (!xmlOnly && !existsSync(SOURCE_MP3)) {
    throw new Error(`Missing MP3: ${SOURCE_MP3}`);
  }
  if (!xmlOnly && !existsSync(CLICK_MP3)) {
    throw new Error(`Missing click: ${CLICK_MP3}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const sourceXml = readFileSync(SOURCE_MUSICXML, 'utf8');
  const stages = selectedStages();
  const keys = selectedKeys();
  const domWindow = new JSDOM('').window;

  /** @type {Record<string, { voice1: number; voice4: number; mode: string }>} */
  const verify = {};

  if (!mp3Only) {
    for (const stage of stages) {
      const osmdC = buildStageMusicXml(sourceXml, stage, 'osmd');
      const precisionC = buildStageMusicXml(sourceXml, stage, 'precision');

      for (const keySpec of keys) {
        for (const mode of /** @type {const} */ (['osmd', 'precision'])) {
          const baseC = mode === 'osmd' ? osmdC : precisionC;
          const xml = keySpec.semitones === 0
            ? baseC
            : transposeMusicXmlString(baseC, keySpec.semitones, keySpec.key, domWindow);
          const base = assetBaseName(stage.stageIndex, keySpec.slug, mode);
          const outPath = join(OUT_DIR, `${base}.musicxml`);
          if (!dryRun) {
            writeFileSync(outPath, xml, 'utf8');
          }
          const v1 = countVoice1PitchNotes(xml);
          const v4 = countVoice4PitchNotes(xml);
          verify[base] = { voice1: v1, voice4: v4, mode };
          console.log(`[xml] ${base}.musicxml v1=${v1} v4=${v4}${dryRun ? ' (dry-run)' : ''}`);
        }
      }
    }
  }

  if (!xmlOnly) {
    const leadPath = join(OUT_DIR, `.tmp-ci-lead-${Date.now()}.mp3`);
    try {
      if (!dryRun) {
        buildDrumstickCountInTrack(leadPath);
      }
      for (const stage of stages) {
        const bodyStartSec = (stage.sourceFrom - 1) * MEASURE_SEC;
        const bodyDurSec = stage.bodyMeasures * MEASURE_SEC;
        const bodyCPath = join(OUT_DIR, `.tmp-body-st${stage.stageIndex}-c.mp3`);
        const withCiCPath = join(OUT_DIR, `.tmp-ci-st${stage.stageIndex}-c.mp3`);

        if (!dryRun) {
          sliceMp3(SOURCE_MP3, bodyStartSec, bodyDurSec, bodyCPath);
          concatMp3(leadPath, bodyCPath, withCiCPath);
        }

        for (const keySpec of keys) {
          const base = mp3BaseName(stage.stageIndex, keySpec.slug);
          const outPath = join(OUT_DIR, `${base}.mp3`);
          if (dryRun) {
            console.log(`[mp3] ${base}.mp3 start=${bodyStartSec}s body=${bodyDurSec}s +ci -> ${stage.durationSec}s`);
            continue;
          }
          pitchShiftMp3(withCiCPath, keySpec.semitones, outPath);
          const dur = probeDuration(outPath);
          console.log(`[mp3] ${base}.mp3 (${dur?.toFixed(3) ?? '?'}s, expect ~${stage.durationSec.toFixed(1)})`);
        }

        if (!dryRun) {
          for (const p of [bodyCPath, withCiCPath]) {
            if (existsSync(p)) {
              try { unlinkSync(p); } catch { /* ignore */ }
            }
          }
        }
      }
    } finally {
      if (existsSync(leadPath)) {
        try { unlinkSync(leadPath); } catch { /* ignore */ }
      }
    }
  }

  if (!mp3Only) {
    const statsPath = join(OUT_DIR, 'm251-s2-verify.json');
    if (!dryRun) {
      writeFileSync(statsPath, `${JSON.stringify(verify, null, 2)}\n`, 'utf8');
    }
    console.log(`Verify summary written to ${statsPath}`);
  }

  console.log('Done.');
}

main();
