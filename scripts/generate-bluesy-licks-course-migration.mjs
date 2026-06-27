/**

 * Bluesy Licks コース Supabase マイグレーション SQL 生成。

 *

 * Usage:

 *   node scripts/generate-bluesy-licks-course-migration.mjs

 */

import { readFileSync, writeFileSync } from 'node:fs';

import { join, resolve } from 'node:path';

import { fileURLToPath } from 'node:url';

import {

  UUID_NS,

  COURSE_KEY,

  CDN_BASE,

  OUT_DIR,

  PHRASE_SPECS,

  BEATS_PER_MEASURE,

  KEY_FIFTHS,

  LOOP_COUNT,

  phraseAssetBase,

  cdnUrl,

  isOptionalNormalTempo,

  mergedLessonKey,

  stageKey,

  loopDurationSec,

  COMBINED_MUSICXML,

} from './bluesy-licks-config.mjs';

import {

  buildPhraseMusicXml,

  countOneLoopAttackTargets,

  computeCombatStats,

} from './bluesy-licks-musicxml-utils.mjs';



const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

const OUT = join(ROOT, 'supabase', 'migrations', '20260627180000_bluesy_licks_intermediate_course.sql');



const BLOCK_NAME = 'F Major';



const sqlEscape = (value) => value.replace(/'/g, "''");

const sqlString = (value) => `'${sqlEscape(value)}'`;

const uuidV5 = (key) => `uuid_generate_v5('${UUID_NS}'::uuid, ${sqlString(key)})`;



/** @type {Record<string, { targetCount: number; bodyMeasures: number }>} */

let combatStats = {};

try {

  combatStats = JSON.parse(

    readFileSync(join(OUT_DIR, 'bluesy-licks-combat-stats.json'), 'utf8'),

  );

} catch {

  const combined = readFileSync(COMBINED_MUSICXML, 'utf8');

  for (const spec of PHRASE_SPECS) {

    const xml = buildPhraseMusicXml(combined, spec);

    combatStats[String(spec.phraseIndex)] = {

      targetCount: countOneLoopAttackTargets(xml, spec.bodyMeasures),

      bodyMeasures: spec.bodyMeasures,

    };

  }

}



/** @param {number} phraseIndex */

function targetCountFor(phraseIndex) {

  const row = combatStats[String(phraseIndex)];

  return row?.targetCount ?? 16;

}



/** @typedef {{ slow: boolean; orderIndex: number; titleJa: string; titleEn: string; lsongKey: string }} BattleRow */



/**

 * @param {import('./bluesy-licks-config.mjs').BluesyLicksPhraseSpec} spec

 * @returns {BattleRow[]}

 */

function battlesForPhrase(spec) {

  return [

    {

      slow: true,

      orderIndex: 0,

      titleJa: 'Slow',

      titleEn: 'Slow',

      lsongKey: `${mergedLessonKey(spec.phraseIndex)}-slow-lsong`,

    },

    {

      slow: false,

      orderIndex: 1,

      titleJa: '等速',

      titleEn: 'Full tempo',

      lsongKey: `${mergedLessonKey(spec.phraseIndex)}-normal-lsong`,

    },

  ];

}



const lines = [

  '-- 目的別コース: Bluesy Licks（中級）',

  '-- 11 フレーズ ×（Slow + 等速）= 11 クエスト、chord_osmd',

  'BEGIN;',

  '',

  'INSERT INTO public.courses (',

  '  id, title, title_en, description, description_en,',

  '  premium_only, order_index, audience, is_tutorial, is_visible,',

  '  difficulty_tier, is_developer_only, is_main_course',

  ')',

  'SELECT',

  `  ${uuidV5(COURSE_KEY)},`,

  "  'Bluesy Licks',",

  "  'Bluesy Licks',",

  "  'F ブルースの定番リックを、スロー版と等倍版で耳コピバトル（OSMD）練習します。',",

  "  'Practice classic F blues licks in slow and full tempo with OSMD ear-copy battles.',",

  '  true,',

  '  COALESCE((SELECT MAX(c.order_index) FROM public.courses c',

  '    WHERE COALESCE(c.is_developer_only, false) = false',

  '      AND COALESCE(c.is_visible, true) = true), 0) + 1,',

  "  'both', false, true, 'intermediate', false, false",

  'ON CONFLICT (id) DO UPDATE SET',

  '  title = EXCLUDED.title,',

  '  title_en = EXCLUDED.title_en,',

  '  description = EXCLUDED.description,',

  '  description_en = EXCLUDED.description_en,',

  '  difficulty_tier = EXCLUDED.difficulty_tier,',

  '  is_visible = EXCLUDED.is_visible,',

  '  updated_at = now();',

  '',

];



for (const spec of PHRASE_SPECS) {

  const lKey = mergedLessonKey(spec.phraseIndex);

  const titleJa = `フレーズ ${spec.phraseIndex}`;

  const titleEn = `Phrase ${spec.phraseIndex}`;

  const slowBpm = spec.bpm / 2;



  lines.push(

    'INSERT INTO public.lessons (',

    '  id, course_id, title, title_en, description, description_en,',

    '  premium_only, order_index, block_number, block_name, block_name_en,',

    '  nav_links, assignment_description, assignment_description_en',

    ') VALUES (',

    `  ${uuidV5(lKey)},`,

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

  );



  for (const battle of battlesForPhrase(spec)) {

    const bpm = battle.slow ? slowBpm : spec.bpm;

    const sKey = stageKey(spec.phraseIndex, battle.slow);

    const stageTitleJa = battle.slow

      ? `フレーズ ${spec.phraseIndex}（Slow）`

      : `フレーズ ${spec.phraseIndex}`;

    const stageTitleEn = battle.slow

      ? `Phrase ${spec.phraseIndex} (Slow)`

      : `Phrase ${spec.phraseIndex}`;

    const assetBase = phraseAssetBase(spec.phraseIndex, battle.slow);

    const xmlBase = phraseAssetBase(spec.phraseIndex, false);

    const audioUrl = cdnUrl(`${assetBase}_loop4_ci`, 'mp3');

    const xmlUrl = cdnUrl(`${xmlBase}_loop4_ci`, 'musicxml');

    const loopSec = loopDurationSec(bpm, spec.bodyMeasures);

    const stats = computeCombatStats(targetCountFor(spec.phraseIndex));

    const clearRequired = battle.slow || !isOptionalNormalTempo(spec.bpm);



    lines.push(

      'INSERT INTO public.ear_training_stages (',

      '  id, slug, title, title_en, description, description_en,',

      '  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,',

      '  count_in_beats, time_limit_sec, player_hp, enemy_hp,',

      '  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,',

      '  miss_damage, fail_damage, perfect_max_misses, great_max_misses,',

      '  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score',

      ') VALUES (',

      `  ${uuidV5(sKey)},`,

      `  ${sqlString(sKey)},`,

      `  ${sqlString(stageTitleJa)},`,

      `  ${sqlString(stageTitleEn)},`,

      `  ${sqlString(`BPM ${bpm}・F メジャー・OSMD リズムバトル。`)},`,

      `  ${sqlString(`${bpm} BPM F major OSMD rhythm battle.`)},`,

      `  ${bpm}, ${KEY_FIFTHS}, ${BEATS_PER_MEASURE}, 4, ${spec.bodyMeasures}, ${LOOP_COUNT},`,

      '  0, 600,',

      `  ${stats.player_hp}, ${stats.enemy_hp},`,

      `  ${stats.per_correct_note_damage}, ${stats.good_completion_damage}, ${stats.great_completion_damage}, ${stats.perfect_completion_damage},`,

      `  ${stats.miss_damage}, ${stats.fail_damage}, ${stats.perfect_max_misses}, ${stats.great_max_misses},`,

      "  'blue_club', true, 'chord_osmd', true, true",

      ')',

      'ON CONFLICT (id) DO UPDATE SET',

      '  title = EXCLUDED.title,',

      '  title_en = EXCLUDED.title_en,',

      '  bpm = EXCLUDED.bpm,',

      '  loop_measures = EXCLUDED.loop_measures,',

      '  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,',

      '  enemy_hp = EXCLUDED.enemy_hp,',

      '  per_correct_note_damage = EXCLUDED.per_correct_note_damage,',

      '  good_completion_damage = EXCLUDED.good_completion_damage,',

      '  great_completion_damage = EXCLUDED.great_completion_damage,',

      '  perfect_completion_damage = EXCLUDED.perfect_completion_damage,',

      '  miss_damage = EXCLUDED.miss_damage,',

      '  fail_damage = EXCLUDED.fail_damage,',

      '  updated_at = now();',

      '',

    );



    lines.push(

      'DELETE FROM public.ear_training_phrases WHERE stage_id = ',

      `${uuidV5(sKey)};`,

      '',

      'INSERT INTO public.ear_training_phrases (',

      '  id, stage_id, order_index, title, title_en,',

      '  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths',

      ') VALUES (',

      `  ${uuidV5(`${sKey}-ph0`)},`,

      `  ${uuidV5(sKey)},`,

      '  0,',

      `  ${sqlString(stageTitleJa)},`,

      `  ${sqlString(stageTitleEn)},`,

      `  ${sqlString(xmlUrl)},`,

      `  ${sqlString(audioUrl)},`,

      `  ${loopSec}, ${loopSec}, 0, ${KEY_FIFTHS}`,

      ');',

      '',

    );



    lines.push(

      'INSERT INTO public.lesson_songs (',

      '  id, lesson_id, song_id, order_index, clear_conditions,',

      '  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,',

      '  is_balloon_rush, balloon_rush_stage_id,',

      '  is_ear_training, ear_training_stage_id,',

      '  is_survival_tutorial, is_ear_training_tutorial,',

      '  title, title_en, is_clear_required',

      ') VALUES (',

      `  ${uuidV5(battle.lsongKey)},`,

      `  ${uuidV5(lKey)},`,

      '  NULL,',

      `  ${battle.orderIndex}, '{"count":1,"rank":"B"}'::jsonb,`,

      '  false, NULL, false, NULL, false, NULL,',

      '  true,',

      `  ${uuidV5(sKey)},`,

      '  false, false,',

      `  ${sqlString(battle.titleJa)},`,

      `  ${sqlString(battle.titleEn)},`,

      `  ${clearRequired ? 'true' : 'false'}`,

      ')',

      'ON CONFLICT (id) DO UPDATE SET',

      '  lesson_id = EXCLUDED.lesson_id,',

      '  is_ear_training = EXCLUDED.is_ear_training,',

      '  ear_training_stage_id = EXCLUDED.ear_training_stage_id,',

      '  clear_conditions = EXCLUDED.clear_conditions,',

      '  title = EXCLUDED.title,',

      '  title_en = EXCLUDED.title_en,',

      '  is_clear_required = EXCLUDED.is_clear_required,',

      '  order_index = EXCLUDED.order_index;',

      '',

    );

  }

}



lines.push('COMMIT;', '');



writeFileSync(OUT, lines.join('\n'), 'utf8');

console.log(`Wrote ${OUT}`);


