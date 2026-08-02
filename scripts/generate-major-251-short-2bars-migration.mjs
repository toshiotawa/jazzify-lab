#!/usr/bin/env node
/**
 * Short II-V 2 Bars コース用マイグレーション SQL 生成。
 * 1 stage = 1 block = 1 lesson、1 レッスン内に 12 キー × バトル/精密 = 24 課題。
 * 行ごとに INSERT を並べると数百 KB になるため、キー/ステージ/モードを
 * VALUES の CTE にして集合ベースの INSERT ... SELECT を出力する。
 *
 * Usage:
 *   node scripts/generate-major-251-short-2bars-migration.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  ROOT,
  UUID_NS,
  COURSE_KEY,
  COURSE_TITLE,
  COURSE_TITLE_EN,
  COURSE_DESC,
  COURSE_DESC_EN,
  CDN_BASE,
  SHORT_2BARS_STAGES,
  KEYS,
  BPM,
  BEATS_PER_MEASURE,
  HAMMER_LEAD_MEASURES,
  MAX_LOOPS_PER_PHRASE,
  REQUIRE_ALL_KEYS,
  OSMD_PER_CORRECT_NOTE_DAMAGE,
  OSMD_PLAYER_HP,
} from './major-251-short-2bars-config.mjs';

const OUT = join(ROOT, 'supabase', 'migrations', '20260802120000_major_251_short_2bars.sql');
const CACHE_BUST = '202608021200';
const MISS_DAMAGE = 5;
const ENEMY_HP_PER_TARGET = OSMD_PER_CORRECT_NOTE_DAMAGE * 2;

const sqlString = (value) => `'${value.replace(/'/g, "''")}'`;
const uuidV5 = (expr) => `uuid_generate_v5(ns.id, ${expr})`;
const courseId = `uuid_generate_v5('${UUID_NS}'::uuid, ${sqlString(COURSE_KEY)})`;
const requiredKeyCondition = REQUIRE_ALL_KEYS ? 'true' : "k.slug = 'c'";

const keyRows = KEYS.map((k, i) => `(${sqlString(k.slug)},${sqlString(k.key)},${k.fifths},${i})`);
const stageRows = SHORT_2BARS_STAGES.map(
  (s) => `(${s.stageIndex},${s.phraseFrom},${s.phraseTo},${s.loopMeasures},${s.targetCount},${s.durationSec})`,
);
const chunk = (rows, perLine) => {
  const out = [];
  for (let i = 0; i < rows.length; i += perLine) {
    out.push(`  ${rows.slice(i, i + perLine).join(',')}`);
  }
  return out.join(',\n');
};

const NS_CTE = `WITH ns AS (SELECT '${UUID_NS}'::uuid AS id)`;
const KEY_CTE = `k(slug, kn, fifths, ord) AS (VALUES\n${chunk(keyRows, 4)})`;
const STAGE_CTE = `s(si, pf, pt, lm, tc, dur) AS (VALUES\n${chunk(stageRows, 3)})`;
const MODE_CTE = `m(ms, mja, men, dbm, rk, ord) AS (VALUES
  ('osmd','バトル','Battle','chord_osmd','B',0),
  ('precision','精密','Precision','chord_precision','C',1))`;

const stageSlug = "'m251-s2-st' || s.si || '-' || k.slug || '-' || m.ms";
const lessonSlug = "'m251-s2-lesson-st' || s.si";
const descJa = "'フレーズ ' || s.pf || '〜' || s.pt || '（全12キー・バトル / 精密）'";
const descEn = "'Phrases ' || s.pf || '-' || s.pt || ' (all 12 keys, battle / precision)'";
const blockName = "'Short II-V 2Bars Stage ' || s.si";
const songTitleJa = "k.kn || '（' || m.mja || '）'";
const songTitleEn = "k.kn || ' (' || m.men || ')'";

const sql = `-- ${COURSE_TITLE}: ${SHORT_2BARS_STAGES.length} stages x ${KEYS.length} keys x battle/precision
-- Structure: 1 stage = 1 block = 1 lesson, 12 keys x battle/precision inside each lesson
BEGIN;

-- Replace any previous per-key lesson layout for this course
DELETE FROM public.lesson_songs ls
USING public.lessons l
WHERE ls.lesson_id = l.id
  AND l.course_id = ${courseId};

DELETE FROM public.lessons WHERE course_id = ${courseId};

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('${UUID_NS}'::uuid, ${sqlString(COURSE_KEY)}),
  ${sqlString(COURSE_TITLE)},
  ${sqlString(COURSE_TITLE_EN)},
  ${sqlString(COURSE_DESC)},
  ${sqlString(COURSE_DESC_EN)},
  true,
  COALESCE((SELECT MAX(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true), 0) + 1,
  'both', false, true, 'intermediate', false, false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_visible = EXCLUDED.is_visible,
  updated_at = now();

${NS_CTE},
${STAGE_CTE}
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, assignment_description_en
)
SELECT
  ${uuidV5(lessonSlug)},
  ${uuidV5(sqlString(COURSE_KEY))},
  'Stage ' || s.si,
  'Stage ' || s.si,
  ${descJa},
  ${descEn},
  s.si - 1,
  s.si,
  ${blockName},
  ${blockName},
  true,
  'Cキーのバトルと精密モードをクリアしてください（他キーは任意）。',
  'Clear C-key battle and precision (other keys optional).'
FROM ns, s
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

${NS_CTE},
${KEY_CTE},
${STAGE_CTE},
${MODE_CTE}
INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
)
SELECT
  ${uuidV5(stageSlug)},
  ${stageSlug},
  'Short II-V 2Bars Stage ' || s.si || ' ' || k.kn || '（' || m.mja || '）',
  'Short II-V 2Bars Stage ' || s.si || ' ' || k.kn || ' (' || m.men || ')',
  ${descJa},
  ${descEn},
  ${BPM}, k.fifths, ${BEATS_PER_MEASURE}, 4, s.lm, ${MAX_LOOPS_PER_PHRASE},
  0, 600, ${OSMD_PLAYER_HP},
  CASE WHEN m.ms = 'osmd' THEN s.tc * ${ENEMY_HP_PER_TARGET} ELSE 1 END,
  CASE WHEN m.ms = 'osmd' THEN ${OSMD_PER_CORRECT_NOTE_DAMAGE} ELSE 0 END, 0, 0, 0,
  CASE WHEN m.ms = 'osmd' THEN ${MISS_DAMAGE} ELSE 0 END, 0, 0, 2,
  'blue_club', true, m.dbm,
  false, true, true,
  ${HAMMER_LEAD_MEASURES}, false
FROM ns, s, k, m
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  player_hp = EXCLUDED.player_hp,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  miss_damage = EXCLUDED.miss_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

${NS_CTE},
${KEY_CTE},
${STAGE_CTE},
${MODE_CTE}
INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
)
SELECT
  ${uuidV5(`${stageSlug} || '-ph0'`)},
  ${uuidV5(stageSlug)},
  0,
  ${songTitleJa},
  ${songTitleEn},
  '${CDN_BASE}/' || ${stageSlug} || '.musicxml?v=${CACHE_BUST}',
  '${CDN_BASE}/m251-s2-st' || s.si || '-' || k.slug || '.mp3?v=${CACHE_BUST}',
  s.dur, s.dur, 0, k.fifths
FROM ns, s, k, m
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

${NS_CTE},
${KEY_CTE},
${STAGE_CTE},
${MODE_CTE}
INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
)
SELECT
  ${uuidV5(`${stageSlug} || '-lsong'`)},
  ${uuidV5(lessonSlug)},
  NULL::uuid,
  k.ord * 2 + m.ord,
  jsonb_build_object('count', 1, 'rank', m.rk),
  false, NULL::uuid, false, NULL::int,
  false, NULL::uuid,
  true,
  ${uuidV5(stageSlug)},
  false, false,
  ${songTitleJa},
  ${songTitleEn},
  (${requiredKeyCondition})
FROM ns, s, k, m
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
`;

mkdirSync(join(ROOT, 'supabase', 'migrations'), { recursive: true });
writeFileSync(OUT, sql, 'utf8');
console.log(`Wrote ${OUT}`);
console.log(
  `Stages/lessons: ${SHORT_2BARS_STAGES.length}, Songs: ${SHORT_2BARS_STAGES.length * KEYS.length * 2}`,
);
