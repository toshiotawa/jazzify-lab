#!/usr/bin/env node
/**
 * II-V-I バッキング MP3 の先頭に、DB の count_in_measures と同じ長さのカウントイン区間を付加する。
 * BGMManager は「生の再生位置 0〜loopBegin がカウントイン、loopBegin で M1・ゲーム内音楽時間 0」とみなすため、
 * 本編だけのファイルに count_in_measures=1 を合わせるとズレる。先頭に 1 小節分を足して整合させる。
 *
 * 前提: ffmpeg が PATH にあること
 *
 * Usage:
 *   node scripts/prepend-count-in-to-ii-v-i-mp3.mjs --dry-run
 *   node scripts/prepend-count-in-to-ii-v-i-mp3.mjs --in-place
 *   node scripts/prepend-count-in-to-ii-v-i-mp3.mjs --in-place --bpm 160 --time-signature 4 --measures 1
 */
import { readdirSync, copyFileSync, unlinkSync, existsSync, mkdtempSync, rmSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = resolve(__dirname, '..', 'public', 'II-V-I_1-50');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inPlace = args.includes('--in-place');

function numArg(name, def) {
  const i = args.indexOf(name);
  if (i === -1 || !args[i + 1]) return def;
  return parseFloat(args[i + 1]);
}

const bpm = numArg('--bpm', 160);
const timeSignature = numArg('--time-signature', 4);
const countInMeasures = numArg('--measures', 1);

const secPerMeasure = (60 / bpm) * timeSignature;
const countInDurationSec = secPerMeasure * countInMeasures;

function run(cmd, cmdArgs, label) {
  const r = spawnSync(cmd, cmdArgs, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${label} failed (${r.status}): ${r.stderr || r.stdout || ''}`);
  }
}

function buildLeadInMp3(outPath) {
  run('ffmpeg', [
    '-y',
    '-f', 'lavfi',
    '-i', `anullsrc=r=44100:cl=stereo`,
    '-t', String(countInDurationSec),
    '-c:a', 'libmp3lame',
    '-q:a', '4',
    outPath,
  ], 'ffmpeg silence lead-in');
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

function main() {
  const dir = DEFAULT_DIR;
  if (!existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    process.exit(1);
  }

  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  if (probe.status !== 0) {
    console.error('ffmpeg が見つかりません。インストールして PATH に追加してください。');
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => /^II-V-I_.*\.mp3$/i.test(f) && !f.includes('.bak'));
  console.log(`BPM=${bpm} 拍子=${timeSignature} カウントイン=${countInMeasures}小節 → 先頭 ${countInDurationSec.toFixed(3)} 秒`);
  console.log(`対象: ${files.length} ファイル (${dir})`);

  if (dryRun) {
    files.slice(0, 5).forEach((f) => console.log(`  ${f}`));
    if (files.length > 5) console.log(`  ... 他 ${files.length - 5} 件`);
    return;
  }

  if (!inPlace) {
    console.error('実行には --in-place が必要です（上書き前にバックアップ推奨）。--dry-run で一覧確認してください。');
    process.exit(1);
  }

  const tmpRoot = mkdtempSync(join(tmpdir(), 'ii-v-i-ci-'));
  const leadMp3 = join(tmpRoot, 'lead.mp3');
  try {
    buildLeadInMp3(leadMp3);

    let ok = 0;
    let err = 0;
    for (const name of files) {
      const input = join(dir, name);
      const outTmp = join(tmpRoot, `out-${ok + err}.mp3`);
      const bak = join(dir, `${name}.bak`);
      process.stdout.write(`${name} ... `);
      try {
        if (!existsSync(input)) throw new Error('missing');
        copyFileSync(input, bak);
        concatMp3(leadMp3, input, outTmp);
        copyFileSync(outTmp, input);
        unlinkSync(outTmp);
        ok++;
        console.log('OK');
      } catch (e) {
        err++;
        console.log(`ERR ${e.message}`);
      }
    }
    console.log(`\nDone. ok=${ok} errors=${err} (各 .bak に元ファイル)`);
  } finally {
    try {
      rmSync(tmpRoot, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main();
