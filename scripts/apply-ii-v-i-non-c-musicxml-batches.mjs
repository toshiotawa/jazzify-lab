#!/usr/bin/env node
/**
 * II-V-I: C 以外の 11 キー × 10 レンジ = 110 ステージの music_xml を、
 * public/II-V-I_1-50 の転調済みファイル（II-V 50 - {range}_{suffix}.musicxml）で更新する SQL を生成。
 *
 * いちばんシンプルな適用: Supabase Dashboard → SQL Editor で、--write で出した 10 ファイルを
 * 上から順に「中身をすべてコピー → Run」するだけ（適用はブラウザのみ。PAT / DATABASE_URL は不要。
 *  .sql を用意するためにローカルで `node ... --write` を 1 回実行する）。
 *
 * Usage:
 *   node scripts/apply-ii-v-i-non-c-musicxml-batches.mjs --write DIR
 *       # レンジ別 10 ファイル（各 11 UPDATE）— SQL Editor 向けおすすめ
 *   node scripts/apply-ii-v-i-non-c-musicxml-batches.mjs --write-singles DIR
 *       # 110 ファイル（1 ステージ 1 ファイル）
 *   node scripts/apply-ii-v-i-non-c-musicxml-batches.mjs --print 3
 *       # レンジ index 3 の SQL を stdout
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { ja: 'C', slug: 'c', suffix: 'C', semitones: 0 },
  { ja: 'F', slug: 'f', suffix: '+5st_F', semitones: 5 },
  { ja: 'B♭', slug: 'bb', suffix: '-2st_Bb', semitones: -2 },
  { ja: 'E♭', slug: 'eb', suffix: '+3st_Eb', semitones: 3 },
  { ja: 'A♭', slug: 'ab', suffix: '-4st_Ab', semitones: -4 },
  { ja: 'D♭', slug: 'db', suffix: '+1st_Db', semitones: 1 },
  { ja: 'G♭', slug: 'gb', suffix: '+6st_Gb', semitones: 6 },
  { ja: 'B', slug: 'b', suffix: '-1st_B', semitones: -1 },
  { ja: 'E', slug: 'e', suffix: '+4st_E', semitones: 4 },
  { ja: 'A', slug: 'a', suffix: '-3st_A', semitones: -3 },
  { ja: 'D', slug: 'd', suffix: '+2st_D', semitones: 2 },
  { ja: 'G', slug: 'g', suffix: '-5st_G', semitones: -5 },
];

const RANGES = [
  { label: '1-5', fileXml: '01-05' },
  { label: '6-10', fileXml: '06-10' },
  { label: '11-15', fileXml: '11-15' },
  { label: '16-20', fileXml: '16-20' },
  { label: '21-25', fileXml: '21-25' },
  { label: '26-30', fileXml: '26-30' },
  { label: '31-35', fileXml: '31-35' },
  { label: '36-40', fileXml: '36-40' },
  { label: '41-45', fileXml: '41-45' },
  { label: '46-50', fileXml: '46-50' },
];

const KEYS_NON_C = KEYS.filter((k) => k.slug !== 'c');

/** MCP / Read 制限を避けるため、タグ間空白のみ圧縮（内容は変えない） */
function compactMusicXml(raw) {
  return raw.replace(/>\s+</g, '><').trim();
}

function buildSqlForRange(range) {
  const updates = [];
  for (const k of KEYS_NON_C) {
    const rel = `II-V 50 - ${range.fileXml}_${k.suffix}.musicxml`;
    const xmlPath = resolve(__dirname, '..', 'public', 'II-V-I_1-50', rel);
    const xml = compactMusicXml(readFileSync(xmlPath, 'utf8'));
    const stageId = `uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}')`;
    updates.push(
      `UPDATE public.fantasy_stages\nSET music_xml = $musicxml$${xml}$musicxml$\nWHERE id = ${stageId};`
    );
  }
  return `-- II-V-I non-C music_xml batch: ${range.label} (${KEYS_NON_C.length} stages)\n${updates.join('\n\n')}\n`;
}

const args = process.argv.slice(2);
const wi = args.indexOf('--write');
const wsi = args.indexOf('--write-singles');
const pi = args.indexOf('--print');

if (wsi !== -1) {
  const dir = args[wsi + 1];
  if (!dir) {
    console.error('missing directory after --write-singles');
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const range of RANGES) {
    for (const k of KEYS_NON_C) {
      const rel = `II-V 50 - ${range.fileXml}_${k.suffix}.musicxml`;
      const xmlPath = resolve(__dirname, '..', 'public', 'II-V-I_1-50', rel);
      const xml = compactMusicXml(readFileSync(xmlPath, 'utf8'));
      const stageId = `uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}')`;
      /* 1 行のみ: Cursor Read の行番号付き取得で 1 行目だけ読めるようにする */
      const sql =
        `UPDATE public.fantasy_stages SET music_xml = $musicxml$${xml}$musicxml$ WHERE id = ${stageId};`;
      const name = `st_${k.slug}_${range.fileXml.replace(/-/g, '_')}.sql`;
      writeFileSync(resolve(dir, name), sql, 'utf8');
      n++;
    }
  }
  console.error(`wrote ${n} single-stage SQL files under ${dir}`);
  process.exit(0);
}

if (wi !== -1) {
  const dir = args[wi + 1];
  if (!dir) {
    console.error('missing directory after --write');
    process.exit(1);
  }
  mkdirSync(dir, { recursive: true });
  for (let i = 0; i < RANGES.length; i++) {
    const r = RANGES[i];
    const sql = buildSqlForRange(r);
    const name = `ii_v_i_non_c_musicxml_${r.fileXml}.sql`;
    writeFileSync(resolve(dir, name), sql, 'utf8');
    console.error(`wrote ${resolve(dir, name)} (${(sql.length / 1024).toFixed(0)} KB)`);
  }
  console.error(`total stages covered: ${RANGES.length * KEYS_NON_C.length}`);
  process.exit(0);
}

if (pi !== -1) {
  const idx = parseInt(args[pi + 1], 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= RANGES.length) {
    console.error(`bad index: ${args[pi + 1]} (use 0..${RANGES.length - 1})`);
    process.exit(1);
  }
  process.stdout.write(buildSqlForRange(RANGES[idx]));
  process.exit(0);
}

console.error(
  'Usage: --write DIR | --write-singles DIR | --print <0-9>'
);
process.exit(1);
