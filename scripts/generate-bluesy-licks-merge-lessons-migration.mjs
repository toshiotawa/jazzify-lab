#!/usr/bin/env node
/**
 * 既存 Bluesy Licks DB を「F Major ブロック + Slow/等速 1 クエスト」構成へ移行する SQL を生成。
 *
 * Usage:
 *   node scripts/generate-bluesy-licks-merge-lessons-migration.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UUID_NS,
  COURSE_KEY,
  PHRASE_SPECS,
  LOOP_COUNT,
  mergedLessonKey,
  lessonKey,
  isOptionalNormalTempo,
} from './bluesy-licks-config.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const OUT = join(
  ROOT,
  'supabase',
  'migrations',
  '20260628120000_bluesy_licks_block1_f_major_merged_lessons.sql',
);

const BLOCK_NAME = 'F Major';
const sqlString = (value) => `'${value.replace(/'/g, "''")}'`;
const uuidV5 = (key) => `uuid_generate_v5('${UUID_NS}'::uuid, ${sqlString(key)})`;

const lines = [
  '-- Bluesy Licks: ブロック1 → F Major、Slow/等速を 1 クエストに統合',
  'BEGIN;',
  '',
];

for (const spec of PHRASE_SPECS) {
  const mergedKey = mergedLessonKey(spec.phraseIndex);
  const slowKey = lessonKey(spec.phraseIndex, true);
  const normalKey = lessonKey(spec.phraseIndex, false);
  const slowBpm = spec.bpm / 2;
  const titleJa = `フレーズ ${spec.phraseIndex}`;
  const titleEn = `Phrase ${spec.phraseIndex}`;
  const normalClearRequired = !isOptionalNormalTempo(spec.bpm);

  lines.push(
    `-- phrase ${spec.phraseIndex}`,
    'INSERT INTO public.lessons (',
    '  id, course_id, title, title_en, description, description_en,',
    '  premium_only, order_index, block_number, block_name, block_name_en,',
    '  nav_links, assignment_description, assignment_description_en',
    ') VALUES (',
    `  ${uuidV5(mergedKey)},`,
    `  ${uuidV5(COURSE_KEY)},`,
    `  ${sqlString(titleJa)},`,
    `  ${sqlString(titleEn)},`,
    `  ${sqlString(`Slow BPM ${slowBpm} → 等速 BPM ${spec.bpm}・${spec.bodyMeasures}小節×${LOOP_COUNT}ループの OSMD 耳コピバトル。`)},`,
    `  ${sqlString(`OSMD ear-copy battle: slow ${slowBpm} BPM → full ${spec.bpm} BPM, ${spec.bodyMeasures} bars × ${LOOP_COUNT} loops.`)},`,
    '  true,',
    `  ${spec.phraseIndex - 1}, 1, ${sqlString(BLOCK_NAME)}, ${sqlString(BLOCK_NAME)},`,
    "  '[]'::jsonb,",
    "  '敵HPを0にしてください。',",
    "  'Reduce the enemy HP to 0.'",
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en,',
    '  description = EXCLUDED.description,',
    '  description_en = EXCLUDED.description_en,',
    '  order_index = EXCLUDED.order_index,',
    '  block_name = EXCLUDED.block_name,',
    '  block_name_en = EXCLUDED.block_name_en,',
    '  updated_at = now();',
    '',
    'UPDATE public.lesson_songs SET',
    `  lesson_id = ${uuidV5(mergedKey)},`,
    "  title = 'Slow',",
    "  title_en = 'Slow',",
    '  order_index = 0,',
    '  is_clear_required = true',
    `WHERE id = ${uuidV5(`${mergedKey}-slow-lsong`)};`,
    '',
    'UPDATE public.lesson_songs SET',
    `  lesson_id = ${uuidV5(mergedKey)},`,
    "  title = '等速',",
    "  title_en = 'Full tempo',",
    '  order_index = 1,',
    `  is_clear_required = ${normalClearRequired ? 'true' : 'false'}`,
    `WHERE id = ${uuidV5(`${mergedKey}-normal-lsong`)};`,
    '',
    'UPDATE public.user_lesson_requirements_progress SET',
    `  lesson_id = ${uuidV5(mergedKey)}`,
    `WHERE lesson_id IN (${uuidV5(slowKey)}, ${uuidV5(normalKey)});`,
    '',
    'UPDATE public.user_lesson_progress SET',
    `  lesson_id = ${uuidV5(mergedKey)},`,
    '  completed = true,',
    '  completion_date = COALESCE(completion_date, now()),',
    '  updated_at = now()',
    `WHERE lesson_id IN (${uuidV5(slowKey)}, ${uuidV5(normalKey)})`,
    '  AND completed = true',
    `  AND NOT EXISTS (`,
    '    SELECT 1 FROM public.user_lesson_progress ulp',
    `    WHERE ulp.user_id = user_lesson_progress.user_id`,
    `      AND ulp.lesson_id = ${uuidV5(mergedKey)}`,
    '  );',
    '',
    'DELETE FROM public.user_lesson_progress',
    `WHERE lesson_id IN (${uuidV5(slowKey)}, ${uuidV5(normalKey)});`,
    '',
    'DELETE FROM public.lessons',
    `WHERE id IN (${uuidV5(slowKey)}, ${uuidV5(normalKey)})`,
    `  AND id <> ${uuidV5(mergedKey)};`,
    '',
  );
}

lines.push('COMMIT;', '');

writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log(`Wrote ${OUT}`);
