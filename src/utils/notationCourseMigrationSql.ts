/**
 * 「音符の読み方」コース Supabase マイグレーション SQL 生成。
 */
import {
  NOTATION_COURSE_BLOCK_META,
  getNotationCourseTopicsForBlocks,
  getTopicLessonKey,
  type NotationCourseTopicSpec,
} from './notationCourseNotePools';

export const NOTATION_COURSE_UUID_NS = 'a0000000-0000-4000-8000-000000000001';
export const NOTATION_COURSE_DRUMS160_BGM =
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");

const sqlString = (value: string): string => `'${sqlEscape(value)}'`;

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${NOTATION_COURSE_UUID_NS}'::uuid, ${sqlString(key)})`
);

export interface GenerateNotationMigrationOptions {
  readonly blockNumbers: readonly number[];
  readonly migrationComment: string;
}

export const generateNotationCourseMigrationSql = (
  options: GenerateNotationMigrationOptions,
  parseMidi: (noteName: string) => number | null,
): string => {
  const topics = getNotationCourseTopicsForBlocks(options.blockNumbers);
  const includeCourse = options.blockNumbers.includes(1);
  const lines: string[] = [
    `-- ${options.migrationComment}`,
    'BEGIN;',
    '',
  ];

  if (includeCourse) {
    lines.push(
      'INSERT INTO public.courses (',
      '  id, title, title_en, description, description_en,',
      '  premium_only, order_index, audience, is_tutorial, is_visible,',
      '  difficulty_tier, is_developer_only, is_main_course',
      ')',
      'SELECT',
      `  ${uuidV5('course-reading-notation')},`,
      "  '音符の読み方',",
      "  'Reading Music Notation',",
      "  '五線譜の音符を読む力を、風船ラッシュ・サバイバル・バトルモードで身につけましょう。',",
      "  'Build sight-reading skills through Balloon Rush, Survival, and Battle mode.',",
      '  true,',
      `  COALESCE((SELECT MIN(c.order_index) FROM public.courses c`,
      '    WHERE COALESCE(c.is_developer_only, false) = false',
      '      AND COALESCE(c.is_visible, true) = true',
      '      AND c.is_main_course = false), 0) + 1,',
      "  'both', false, true, 'beginner', false, false",
      'ON CONFLICT (id) DO UPDATE SET',
      '  title = EXCLUDED.title,',
      '  title_en = EXCLUDED.title_en,',
      '  description = EXCLUDED.description,',
      '  description_en = EXCLUDED.description_en,',
      '  order_index = EXCLUDED.order_index,',
      '  difficulty_tier = EXCLUDED.difficulty_tier,',
      '  is_visible = EXCLUDED.is_visible,',
      '  updated_at = now();',
      '',
    );

    lines.push(
      'INSERT INTO public.balloon_rush_stages (',
      '  id, slug, title, title_en, description, description_en,',
      '  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,',
      '  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,',
      '  bgm_url, key_fifths, lesson_only, is_active,',
      '  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle',
      ') VALUES (',
      `  ${uuidV5('notation-balloon-random')},`,
      "  'notation-balloon-random',",
      "  '譜読み風船ラッシュ',",
      "  'Sight-reading Balloon Rush',",
      "  '120秒以内に80個。譜面の音符を読んで風船を割ります。',",
      "  'Pop 80 balloons in 120 seconds by reading the staff.',",
      "  'random', '_note', 'all', NULL, NULL,",
      '  120, 80, 12, 5, 2,',
      `  ${sqlString(NOTATION_COURSE_DRUMS160_BGM)}, 0, true, true,`,
      "  'always', 'hidden_until_pressed', true",
      ')',
      'ON CONFLICT (slug) DO UPDATE SET',
      '  time_limit_sec = EXCLUDED.time_limit_sec,',
      '  pop_quota = EXCLUDED.pop_quota,',
      '  bgm_url = EXCLUDED.bgm_url,',
      '  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,',
      '  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,',
      '  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,',
      '  updated_at = now();',
      '',
      'INSERT INTO public.balloon_rush_play_dialogues (stage_id, title, title_en, script, is_active)',
      'SELECT',
      `  ${uuidV5('notation-balloon-random')},`,
      "  '譜読み風船', 'Sight-reading balloons',",
      `  '{"lineDurationSeconds":5,"lines":[{"atSeconds":2,"speaker":"fai","text":{"ja":"譜面の音符を読んで、B列で風船を割ろう！","en":"Read the staff notes and pop balloons with slot B!"}},{"atSeconds":10,"speaker":"jajii","text":{"ja":"120秒以内に80個じゃ。落ち着いて読むのじゃ。","en":"80 in 120 seconds. Take your time reading."}}]}'::jsonb,`,
      '  true',
      'ON CONFLICT (stage_id) DO UPDATE SET script = EXCLUDED.script, updated_at = now();',
      '',
      'INSERT INTO public.survival_stages (',
      '  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,',
      '  chord_suffix, chord_display_name, chord_display_name_en,',
      '  root_pattern, root_pattern_name, root_pattern_name_en,',
      '  block_key, is_mixed_stage, mixed_group_key, chord_progression,',
      '  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode,',
      '  hide_chord_names_in_battle',
      ') VALUES (',
      "  'lesson', 1100, 'random', 'survival',",
      "  '譜読みサバイバル', 'Sight-reading Survival', 'easy',",
      "  '_note', '譜読み', 'Sight-reading',",
      "  'all', '全音', 'All notes',",
      "  'notation', false, NULL, NULL,",
      '  true, \'always\', \'hidden_until_pressed\', true',
      ')',
      'ON CONFLICT (map_category, stage_number) DO UPDATE SET',
      '  stage_type = EXCLUDED.stage_type,',
      '  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,',
      '  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,',
      '  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,',
      '  updated_at = now();',
      '',
      'INSERT INTO public.survival_stage_play_dialogues (map_category, stage_number, title, title_en, script)',
      'VALUES (',
      "  'lesson', 1100, '譜読みサバイバル', 'Sight-reading survival',",
      `  '{"lineDurationSeconds":5,"lines":[{"atSeconds":2,"speaker":"fai","text":{"ja":"譜面の音符を弾いて敵を倒そう！","en":"Play the notes on the staff to defeat enemies!"}},{"atSeconds":8,"speaker":"jajii","text":{"ja":"コード名は出ん。譜面だけ見るのじゃ。","en":"No chord names—read the staff only."}}]}'::jsonb`,
      ')',
      'ON CONFLICT (map_category, stage_number) DO UPDATE SET script = EXCLUDED.script, updated_at = now();',
      '',
    );
  }

  let orderBase = 0;
  if (options.blockNumbers[0] === 5) {
    orderBase = 16;
  }

  for (let ti = 0; ti < topics.length; ti += 1) {
    const topic = topics[ti];
    const lessonKey = getTopicLessonKey(topic);
    const blockMeta = NOTATION_COURSE_BLOCK_META[topic.blockNumber];
    const globalOrder = orderBase + ti;

    lines.push(
      'INSERT INTO public.ear_training_stages (',
      '  id, slug, title, title_en, description, description_en,',
      '  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,',
      '  count_in_beats, time_limit_sec, player_hp, enemy_hp,',
      '  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,',
      '  miss_damage, fail_damage, perfect_max_misses, great_max_misses,',
      '  background_theme, is_active, mode,',
      '  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,',
      '  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle',
      ') VALUES (',
      `  ${uuidV5(`rn-ear-${lessonKey}`)},`,
      `  ${sqlString(`notation-quiz-${lessonKey}`)},`,
      `  ${sqlString(`譜読みクイズ: ${topic.titleJa}`)},`,
      `  ${sqlString(`Sight-reading quiz: ${topic.titleEn}`)},`,
      `  ${sqlString('30秒以内に30問正解。譜面の音符を読んで弾きましょう。')},`,
      `  ${sqlString('Answer 30 questions within 30 seconds by reading the staff.')},`,
      '  120, 0, 4, 4, 2, 6,',
      '  0, 60, 100, 10000,',
      '  0, 0, 0, 0, 0, 0, 0, 0,',
      "  'blue_club', true, 'chord_quiz',",
      '  30, \'random\', true, true, 30, false',
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,',
      '  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,',
      '  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,',
      '  updated_at = now();',
      '',
    );

    topic.notes.forEach((spec, noteIndex) => {
      const midi = parseMidi(spec.noteName);
      if (midi === null) {
        throw new Error(`Invalid MIDI for ${spec.noteName}`);
      }
      lines.push(
        'INSERT INTO public.ear_training_chord_quiz_items (',
        '  id, stage_id, order_index, measure_number, beat_offset, duration_beats,',
        '  chord_name, voicing, voicing_staves',
        ') VALUES (',
        `  ${uuidV5(`rn-ear-item-${lessonKey}-${noteIndex}`)},`,
        `  ${uuidV5(`rn-ear-${lessonKey}`)},`,
        `  ${noteIndex}, ${noteIndex + 1}, 1, 4,`,
        `  ${sqlString(spec.noteName)},`,
        `  ARRAY[${sqlString(spec.noteName)}]::text[],`,
        `  ARRAY[${spec.staff}]::smallint[]`,
        ')',
        'ON CONFLICT (id) DO UPDATE SET',
        '  voicing = EXCLUDED.voicing,',
        '  voicing_staves = EXCLUDED.voicing_staves,',
        '  updated_at = now();',
      );
    });
    lines.push('');
  }

  for (let ti = 0; ti < topics.length; ti += 1) {
    const topic = topics[ti];
    const lessonKey = getTopicLessonKey(topic);
    const blockMeta = NOTATION_COURSE_BLOCK_META[topic.blockNumber];
    const globalOrder = orderBase + ti;

    const questIntroJa =
      `${topic.descriptionJa}\n\nこのクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。`;
    const questIntroEn =
      `${topic.descriptionEn}\n\nIn this quest: ① Balloon Rush → ② Survival → ③ Battle mode.`;

    lines.push(
      'INSERT INTO public.lessons (',
      '  id, course_id, title, title_en, description, description_en,',
      '  premium_only, order_index, block_number, block_name, block_name_en,',
      '  block_description, block_description_en,',
      '  nav_links, assignment_description, assignment_description_en',
      ') VALUES (',
      `  ${uuidV5(`rn-lesson-${lessonKey}`)},`,
      `  ${uuidV5('course-reading-notation')},`,
      `  ${sqlString(topic.titleJa)},`,
      `  ${sqlString(topic.titleEn)},`,
      `  ${sqlString(questIntroJa)},`,
      `  ${sqlString(questIntroEn)},`,
      '  true,',
      `  ${globalOrder}, ${topic.blockNumber},`,
      `  ${sqlString(blockMeta.blockNameJa)}, ${sqlString(blockMeta.blockNameEn)},`,
      `  ${sqlString(blockMeta.blockDescriptionJa)}, ${sqlString(blockMeta.blockDescriptionEn)},`,
      "  '[]'::jsonb,",
      "  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',",
      "  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'",
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  title = EXCLUDED.title,',
      '  title_en = EXCLUDED.title_en,',
      '  description = EXCLUDED.description,',
      '  description_en = EXCLUDED.description_en,',
      '  order_index = EXCLUDED.order_index,',
      '  block_number = EXCLUDED.block_number,',
      '  block_name = EXCLUDED.block_name,',
      '  block_name_en = EXCLUDED.block_name_en,',
      '  updated_at = now();',
      '',
    );

    const chordsJson = JSON.stringify(
      topic.notes.map(spec => {
        const midi = parseMidi(spec.noteName);
        if (midi === null) throw new Error(`Invalid MIDI: ${spec.noteName}`);
        return {
          name: spec.noteName,
          voicing: [midi],
          voicing_names: [spec.noteName],
          voicing_staves: [spec.staff],
          key_fifths: spec.keyFifths ?? 0,
        };
      }),
    );

    lines.push(
      'INSERT INTO public.lesson_songs (',
      '  id, lesson_id, song_id, order_index, clear_conditions,',
      '  is_fantasy, fantasy_stage_id,',
      '  is_survival, survival_stage_number, survival_map_category,',
      '  is_balloon_rush, balloon_rush_stage_id,',
      '  is_ear_training, ear_training_stage_id,',
      '  survival_random_chords, survival_lesson_overrides,',
      '  title, title_en, is_clear_required',
      ') VALUES',
      `  (${uuidV5(`rn-lsong-${lessonKey}-balloon`)}, ${uuidV5(`rn-lesson-${lessonKey}`)}, NULL, 0, '{"count":1,"rank":"C"}'::jsonb,`,
      '   false, NULL, false, NULL, NULL, true,',
      `   ${uuidV5('notation-balloon-random')}, false, NULL,`,
      `   ${sqlString(chordsJson)}::jsonb, NULL,`,
      `   '風船ラッシュ', 'Balloon Rush', true),`,
      `  (${uuidV5(`rn-lsong-${lessonKey}-survival`)}, ${uuidV5(`rn-lesson-${lessonKey}`)}, NULL, 1, '{"count":1,"rank":"C"}'::jsonb,`,
      '   false, NULL, true, 1100, \'lesson\', false, NULL, false, NULL,',
      `   ${sqlString(chordsJson)}::jsonb,`,
      `   '{"bgmUrl":"${NOTATION_COURSE_DRUMS160_BGM}"}'::jsonb,`,
      `   'サバイバル', 'Survival', true),`,
      `  (${uuidV5(`rn-lsong-${lessonKey}-battle`)}, ${uuidV5(`rn-lesson-${lessonKey}`)}, NULL, 2, '{"count":1,"rank":"C"}'::jsonb,`,
      '   false, NULL, false, NULL, NULL, false, NULL, true,',
      `   ${uuidV5(`rn-ear-${lessonKey}`)}, NULL, NULL,`,
      `   'バトルモード', 'Battle mode', true)`,
      'ON CONFLICT (id) DO UPDATE SET',
      '  order_index = EXCLUDED.order_index,',
      '  survival_random_chords = EXCLUDED.survival_random_chords,',
      '  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,',
      '  is_balloon_rush = EXCLUDED.is_balloon_rush,',
      '  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,',
      '  is_survival = EXCLUDED.is_survival,',
      '  is_ear_training = EXCLUDED.is_ear_training,',
      '  ear_training_stage_id = EXCLUDED.ear_training_stage_id,',
      '  clear_conditions = EXCLUDED.clear_conditions,',
      '  title = EXCLUDED.title,',
      '  title_en = EXCLUDED.title_en,',
      '  updated_at = now();',
      '',
    );
  }

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
