/**
 * II-V-I コースの lessons 並びを「セグメント横断（全キーで1-5→次は6-10…）」に揃える UPDATE SQL を標準出力へ出す。
 * マイグレーション本文に貼るか、apply_migration 用に利用。
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { ja: 'C', slug: 'c' },
  { ja: 'F', slug: 'f' },
  { ja: 'B♭', slug: 'bb' },
  { ja: 'E♭', slug: 'eb' },
  { ja: 'A♭', slug: 'ab' },
  { ja: 'D♭', slug: 'db' },
  { ja: 'G♭', slug: 'gb' },
  { ja: 'B', slug: 'b' },
  { ja: 'E', slug: 'e' },
  { ja: 'A', slug: 'a' },
  { ja: 'D', slug: 'd' },
  { ja: 'G', slug: 'g' },
];

const RANGES = [
  '1-5',
  '6-10',
  '11-15',
  '16-20',
  '21-25',
  '26-30',
  '31-35',
  '36-40',
  '41-45',
  '46-50',
];

function sqlStr(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

const courseId = `uuid_generate_v5('${NS}'::uuid, 'ii-v-i-course')`;

const rows = [];
let order = 0;
for (let ri = 0; ri < RANGES.length; ri++) {
  const label = RANGES[ri];
  const blockNum = ri + 1;
  const blockJa = `フレーズ ${label}`;
  const blockEn = `Phrases ${label}`;
  for (let ki = 0; ki < KEYS.length; ki++) {
    const k = KEYS[ki];
    const lessonKey = `lsn-${k.slug}-${label}`;
    const idExpr = `uuid_generate_v5('${NS}'::uuid, ${sqlStr(lessonKey)})`;
    rows.push(
      `  (${idExpr}, ${order}, ${blockNum}, ${sqlStr(blockJa)}, ${sqlStr(blockEn)})`,
    );
    order += 1;
  }
}

const sql = `-- II-V-I: レッスン順を「全キーで同一フレーズ帯→次の帯」に変更（generate-ii-v-i-lesson-reorder-sql.mjs）
UPDATE public.lessons AS l
SET
  order_index = v.order_index,
  block_number = v.block_number,
  block_name = v.block_name,
  block_name_en = v.block_name_en
FROM (VALUES
${rows.join(',\n')}
) AS v(id, order_index, block_number, block_name, block_name_en)
WHERE l.id = v.id
  AND l.course_id = ${courseId};
`;

const outPath = resolve(
  __dirname,
  '..',
  'supabase',
  'migrations',
  '20260326120000_ii_v_i_lesson_order_segment_then_key.sql',
);
writeFileSync(outPath, sql, 'utf8');
console.error(`Wrote ${outPath}`);
