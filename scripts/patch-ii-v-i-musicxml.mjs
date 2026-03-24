#!/usr/bin/env node
/**
 * II-V-I ステージに music_xml と production_start_key をパッチする SQL を生成。
 *
 * 出力: レンジ（1-5, 6-10, …）ごとに 1 ファイル → Supabase execute_sql で実行可能。
 *
 * Usage:
 *   node scripts/patch-ii-v-i-musicxml.mjs             # SQL を stdout に出力
 *   node scripts/patch-ii-v-i-musicxml.mjs --files      # レンジ別にファイル出力
 *   node scripts/patch-ii-v-i-musicxml.mjs --range 01-05  # 特定レンジのみ
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { slug: 'c', semitones: 0 },
  { slug: 'f', semitones: 5 },
  { slug: 'bb', semitones: -2 },
  { slug: 'eb', semitones: 3 },
  { slug: 'ab', semitones: -4 },
  { slug: 'db', semitones: 1 },
  { slug: 'gb', semitones: 6 },
  { slug: 'b', semitones: -1 },
  { slug: 'e', semitones: 4 },
  { slug: 'a', semitones: -3 },
  { slug: 'd', semitones: 2 },
  { slug: 'g', semitones: -5 },
];

const RANGES = [
  { label: '1-5',   fileXml: '01-05' },
  { label: '6-10',  fileXml: '06-10' },
  { label: '11-15', fileXml: '11-15' },
  { label: '16-20', fileXml: '16-20' },
  { label: '21-25', fileXml: '21-25' },
  { label: '26-30', fileXml: '26-30' },
  { label: '31-35', fileXml: '31-35' },
  { label: '36-40', fileXml: '36-40' },
  { label: '41-45', fileXml: '41-45' },
  { label: '46-50', fileXml: '46-50' },
];

const args = process.argv.slice(2);
const toFiles = args.includes('--files');
const rangeFilter = args.includes('--range')
  ? args[args.indexOf('--range') + 1]
  : null;

function generatePatchForRange(range) {
  const xmlPath = resolve(
    __dirname, '..', 'public', 'II-V-I_1-50',
    `II-V 50 - ${range.fileXml}.musicxml`
  );
  const xml = readFileSync(xmlPath, 'utf8');

  const caseClauses = KEYS.map(k =>
    `    WHEN uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}') THEN ${k.semitones}`
  ).join('\n');

  const idList = KEYS.map(k =>
    `  uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}')`
  ).join(',\n');

  return `-- patch music_xml + production_start_key for range ${range.label}
UPDATE public.fantasy_stages
SET
  music_xml = $musicxml$${xml}$musicxml$,
  production_start_key = CASE id
${caseClauses}
    ELSE production_start_key
  END
WHERE id IN (
${idList}
);
`;
}

const targetRanges = rangeFilter
  ? RANGES.filter(r => r.fileXml === rangeFilter || r.label === rangeFilter)
  : RANGES;

if (targetRanges.length === 0) {
  console.error(`No matching range for: ${rangeFilter}`);
  process.exit(1);
}

if (toFiles) {
  const outDir = resolve(__dirname, '..', 'supabase', 'patches');
  mkdirSync(outDir, { recursive: true });
  for (const range of targetRanges) {
    const sql = generatePatchForRange(range);
    const file = resolve(outDir, `patch_ii_v_i_musicxml_${range.fileXml}.sql`);
    writeFileSync(file, sql, 'utf8');
    console.log(`wrote ${file} (${(sql.length / 1024).toFixed(1)} KB)`);
  }
} else {
  for (const range of targetRanges) {
    console.log(generatePatchForRange(range));
  }
}
