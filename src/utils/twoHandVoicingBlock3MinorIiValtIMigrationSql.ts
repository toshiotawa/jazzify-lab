/**
 * 両手ヴォイシングコース(中級) Block 3 レッスン8 Supabase マイグレーション SQL 生成。
 */
import {
  TWO_HAND_VOICING_BGM_URL,
  TWO_HAND_VOICING_COURSE_KEY,
  TWO_HAND_VOICING_UUID_NS,
} from './twoHandVoicingIntermediateCourse';
import { TWO_HAND_VOICING_BLOCK3_META } from './twoHandVoicingBlock3Course';
import {
  TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON,
  TWO_HAND_VOICING_GRAND_STAFF,
  buildMinorIiValtIQuizItems,
  getBlock3MinorIiValtILessonKey,
  getBlock3MinorIiValtIStageKey,
  getMinorIiValtIProgressionChords,
  resolveBlock3MinorIiValtISurvivalStageNumberForProgression,
  resolveMinorIiValtIQuizLoopMeasures,
  type MinorIiValtIProgressionSpec,
  type TwoHandVoicingBlock3MinorIiValtILessonSpec,
} from './twoHandVoicingBlock3MinorIiValtICourse';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const sqlJson = (value: unknown): string => `'${sqlEscape(JSON.stringify(value))}'::jsonb`;

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_UUID_NS}'::uuid, ${sqlString(key)})`
);

const BGM_OVERRIDE_JSON = sqlJson({ bgmUrl: TWO_HAND_VOICING_BGM_URL });

const MINOR_II_VALT_I_DEMO_SCRIPT = (titleJa: string): string => sqlJson({
  version: 3,
  audioTracks: {
    drum_loop: { url: TWO_HAND_VOICING_BGM_URL, volume: 0.5 },
  },
  ui: {
    hidePlayerHpBar: true,
    hideSettingsButton: true,
    hideBackButton: true,
    hideMidiToggle: true,
    showExitButton: true,
    playerInvincible: true,
    disableEnemyAttacks: true,
    keyboardHintsDefault: true,
  },
  content: {},
  scenes: [
    {
      type: 'dialogue_only',
      lineIntervalSeconds: 4,
      lines: [
        {
          speaker: 'jajii',
          ja: 'マイナー II-Valt-I では、iiø から V7alt へ上がり、Im6(9) の 5th へ半音下がって着地するのじゃ。',
          en: 'In minor II-Valt-I, move up from iiø to V7alt, then land on the Im6(9) 5th from the flat 9.',
        },
        {
          speaker: 'fai',
          ja: `${titleJa} の流れを確認してから、弾いてみよう。`,
          en: 'Check the flow first, then try playing.',
        },
        {
          speaker: 'jajii',
          ja: 'V7alt の 3rd は b4 表記じゃ。最低音だけ左手、形を覚えるんじゃ。',
          en: 'Use flat-4 spelling for the V7alt 3rd. Left hand on the bottom note only.',
        },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});

const appendSurvivalStageSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3MinorIiValtILessonSpec,
  progression: MinorIiValtIProgressionSpec,
): void => {
  const progressionChords = getMinorIiValtIProgressionChords(progression);
  const stageNumber = resolveBlock3MinorIiValtISurvivalStageNumberForProgression(progression);
  const displayName = progression.isSummary
    ? `${lesson.titleJa}: まとめ`
    : `${lesson.titleJa}: ${progression.titleJa}`;

  lines.push(
    'INSERT INTO public.survival_stages (',
    '  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,',
    '  chord_suffix, chord_display_name, chord_display_name_en,',
    '  root_pattern, root_pattern_name, root_pattern_name_en,',
    '  block_key, is_mixed_stage, mixed_group_key, chord_progression,',
    '  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode',
    ') VALUES (',
    `  'lesson', ${stageNumber}, 'progression', 'survival',`,
    `  ${sqlString(`両手ヴォイシング: ${displayName}`)},`,
    `  ${sqlString(`Two-hand voicing: ${displayName}`)},`,
    "  'easy', '', 'Minor II-Valt-I', 'Minor II-Valt-I',",
    '  NULL, NULL, NULL,',
    `  ${sqlString(lesson.survivalBlockKey)}, false, NULL,`,
    `  ${sqlJson(progressionChords)},`,
    "  true, 'fade_15s', 'fade_15s'",
    ')',
    'ON CONFLICT (map_category, stage_number) DO UPDATE SET',
    '  stage_type = EXCLUDED.stage_type,',
    '  play_mode = EXCLUDED.play_mode,',
    '  name = EXCLUDED.name,',
    '  name_en = EXCLUDED.name_en,',
    '  difficulty = EXCLUDED.difficulty,',
    '  block_key = EXCLUDED.block_key,',
    '  chord_progression = EXCLUDED.chord_progression,',
    '  lesson_only = EXCLUDED.lesson_only,',
    '  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,',
    '  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,',
    '  updated_at = now();',
    '',
  );
};

const appendQuizStageSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3MinorIiValtILessonSpec,
  progression: MinorIiValtIProgressionSpec,
): void => {
  const stageKey = getBlock3MinorIiValtIStageKey(progression, 'quiz');
  const loopMeasures = resolveMinorIiValtIQuizLoopMeasures(progression);
  const descriptionJa = progression.isSummary
    ? '60秒以内に20問正解。全キーのマイナー II-Valt-I を順番に弾きましょう。'
    : `60秒以内に20問正解。${progression.titleJa} のマイナー II-Valt-I を弾きましょう。`;
  const descriptionEn = progression.isSummary
    ? 'Answer 20 questions within 60 seconds. Play minor II-Valt-I in all keys in order.'
    : `Answer 20 questions within 60 seconds using ${progression.titleEn} minor II-Valt-I voicings.`;

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
    `  ${uuidV5(stageKey)},`,
    `  ${sqlString(`thvi-b3-quiz-${lesson.lessonKey}-${progression.progressionKey}`)},`,
    `  ${sqlString(`クイズ: ${progression.titleJa}`)},`,
    `  ${sqlString(`Quiz: ${progression.titleEn}`)},`,
    `  ${sqlString(descriptionJa)},`,
    `  ${sqlString(descriptionEn)},`,
    `  100, 0, 4, 4, ${loopMeasures}, ${loopMeasures},`,
    '  0, 60, 100, 10000,',
    '  0, 0, 0, 0, 0, 0, 0, 0,',
    "  'blue_club', true, 'chord_quiz',",
    `  60, 'sequential', ${progression.isSummary ? 'false' : 'true'}, false, 20, ${progression.isSummary ? 'false' : 'true'}`,
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en,',
    '  description = EXCLUDED.description,',
    '  description_en = EXCLUDED.description_en,',
    '  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,',
    '  quiz_question_order = EXCLUDED.quiz_question_order,',
    '  quiz_show_notation_in_battle = EXCLUDED.quiz_show_notation_in_battle,',
    '  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,',
    '  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,',
    '  updated_at = now();',
    '',
  );

  const items = buildMinorIiValtIQuizItems(progression);
  for (const item of items) {
    const itemKey = `${stageKey}-item-${item.orderIndex}`;
    lines.push(
      'INSERT INTO public.ear_training_chord_quiz_items (',
      '  id, stage_id, order_index, measure_number, beat_offset, duration_beats,',
      '  chord_name, voicing, voicing_staves',
      ') VALUES (',
      `  ${uuidV5(itemKey)},`,
      `  ${uuidV5(stageKey)},`,
      `  ${item.orderIndex}, ${item.measureNumber}, 1, 4,`,
      `  ${sqlString(item.chordName)},`,
      `  ARRAY[${item.notes.map(sqlString).join(', ')}]::text[],`,
      `  ARRAY[${TWO_HAND_VOICING_GRAND_STAFF.join(', ')}]::smallint[]`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  order_index = EXCLUDED.order_index,',
      '  measure_number = EXCLUDED.measure_number,',
      '  chord_name = EXCLUDED.chord_name,',
      '  voicing = EXCLUDED.voicing,',
      '  voicing_staves = EXCLUDED.voicing_staves,',
      '  updated_at = now();',
    );
  }
  lines.push('');
};

const appendLessonSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3MinorIiValtILessonSpec,
): void => {
  const lessonUuid = uuidV5(getBlock3MinorIiValtILessonKey(lesson));

  lines.push(
    'INSERT INTO public.lessons (',
    '  id, course_id, title, title_en, description, description_en,',
    '  premium_only, order_index, block_number, block_name, block_name_en,',
    '  nav_links, assignment_description, assignment_description_en',
    ') VALUES (',
    `  ${lessonUuid},`,
    `  ${uuidV5(TWO_HAND_VOICING_COURSE_KEY)},`,
    `  ${sqlString(lesson.titleJa)},`,
    `  ${sqlString(lesson.titleEn)},`,
    `  ${sqlString(`${lesson.titleJa} の Drop2 Resolution マイナー II-Valt-I ヴォイシングを練習します。`)},`,
    `  ${sqlString(`Practice Drop 2 Resolution minor II-Valt-I voicings for ${lesson.titleEn}.`)},`,
    '  true,',
    `  ${lesson.orderIndex}, ${TWO_HAND_VOICING_BLOCK3_META.blockNumber},`,
    `  ${sqlString(TWO_HAND_VOICING_BLOCK3_META.blockNameJa)},`,
    `  ${sqlString(TWO_HAND_VOICING_BLOCK3_META.blockNameEn)},`,
    "  '[]'::jsonb,",
    "  '①デモ ②2キーずつ×クイズ/サバイバル ③全キーまとめ',",
    "  '① Demo ② 2 keys at a time × quiz/survival ③ All-keys review'",
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
    '  assignment_description = EXCLUDED.assignment_description,',
    '  assignment_description_en = EXCLUDED.assignment_description_en,',
    '  updated_at = now();',
    '',
  );
};

const appendLessonSongsSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3MinorIiValtILessonSpec,
): void => {
  const lessonUuid = uuidV5(getBlock3MinorIiValtILessonKey(lesson));
  const rows: string[] = [];
  let orderIndex = 0;

  const demoKey = `${getBlock3MinorIiValtILessonKey(lesson)}-demo-lsong`;
  const scriptId = `thvi-b3-demo-${lesson.lessonKey}`;
  rows.push(
    `  (${uuidV5(demoKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"C"}'::jsonb,\n`
    + '   false, NULL, false, NULL, NULL, false, NULL, false, NULL,\n'
    + '   true, false,\n'
    + `   ${sqlString(scriptId)}, NULL,\n`
    + '   NULL,\n'
    + `   'デモ', 'Demo', true)`,
  );
  orderIndex += 1;

  const appendEarTrainingRow = (
    lsongKey: string,
    titleJa: string,
    titleEn: string,
    stageUuidKey: string,
    overrides: string,
    clearRank: 'B' | 'C' = 'B',
  ): void => {
    rows.push(
      `  (${uuidV5(lsongKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"${clearRank}"}'::jsonb,\n`
      + '   false, NULL, false, NULL, NULL, false, NULL, true,\n'
      + `   ${uuidV5(stageUuidKey)},\n`
      + '   false, false, NULL, NULL,\n'
      + `   ${overrides},\n`
      + `   ${sqlString(titleJa)}, ${sqlString(titleEn)}, true)`,
    );
    orderIndex += 1;
  };

  const appendSurvivalRow = (
    lsongKey: string,
    titleJa: string,
    titleEn: string,
    stageNumber: number,
  ): void => {
    rows.push(
      `  (${uuidV5(lsongKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"C"}'::jsonb,\n`
      + '   false, NULL, true,\n'
      + `   ${stageNumber}, 'lesson', false, NULL, false, NULL,\n`
      + '   false, false, NULL, NULL,\n'
      + `   ${BGM_OVERRIDE_JSON},\n`
      + `   ${sqlString(titleJa)}, ${sqlString(titleEn)}, true)`,
    );
    orderIndex += 1;
  };

  for (const progression of lesson.progressions) {
    appendEarTrainingRow(
      `${getBlock3MinorIiValtILessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
      progression.isSummary ? 'クイズ: 全キーまとめ' : `クイズ: ${progression.titleJa}`,
      progression.isSummary ? 'Quiz: All keys' : `Quiz: ${progression.titleEn}`,
      getBlock3MinorIiValtIStageKey(progression, 'quiz'),
      BGM_OVERRIDE_JSON,
    );

    const stageNumber = resolveBlock3MinorIiValtISurvivalStageNumberForProgression(progression);
    appendSurvivalRow(
      `${getBlock3MinorIiValtILessonKey(lesson)}-${progression.progressionKey}-survival-lsong`,
      progression.isSummary ? 'サバイバル: 全キーまとめ' : `サバイバル: ${progression.titleJa}`,
      progression.isSummary ? 'Survival: All keys' : `Survival: ${progression.titleEn}`,
      stageNumber,
    );
  }

  lines.push(
    'INSERT INTO public.lesson_songs (',
    '  id, lesson_id, song_id, order_index, clear_conditions,',
    '  is_fantasy, fantasy_stage_id,',
    '  is_survival, survival_stage_number, survival_map_category,',
    '  is_balloon_rush, balloon_rush_stage_id,',
    '  is_ear_training, ear_training_stage_id,',
    '  is_survival_tutorial, is_ear_training_tutorial,',
    '  survival_tutorial_script_id, ear_training_tutorial_script_id,',
    '  survival_lesson_overrides,',
    '  title, title_en, is_clear_required',
    ') VALUES',
    rows.join(',\n'),
    'ON CONFLICT (id) DO UPDATE SET',
    '  order_index = EXCLUDED.order_index,',
    '  is_survival = EXCLUDED.is_survival,',
    '  is_ear_training = EXCLUDED.is_ear_training,',
    '  is_survival_tutorial = EXCLUDED.is_survival_tutorial,',
    '  survival_stage_number = EXCLUDED.survival_stage_number,',
    '  survival_map_category = EXCLUDED.survival_map_category,',
    '  ear_training_stage_id = EXCLUDED.ear_training_stage_id,',
    '  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,',
    '  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,',
    '  clear_conditions = EXCLUDED.clear_conditions,',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en;',
    '',
  );
};

export const generateTwoHandVoicingBlock3MinorIiValtIMigrationSql = (): string => {
  const lesson = TWO_HAND_VOICING_BLOCK3_MINOR_II_VALT_I_LESSON;
  const lines: string[] = [
    '-- 両手ヴォイシングコース(中級) Block 3 レッスン8: マイナー II-Valt-I',
    '-- デモ + 6キーペア + 全キーまとめ × クイズ/サバイバル',
    'BEGIN;',
    '',
  ];

  const scriptId = `thvi-b3-demo-${lesson.lessonKey}`;
  lines.push(
    'INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (',
    `  ${sqlString(scriptId)},`,
    `  ${sqlString(`両手ヴォイシング デモ (${lesson.titleJa})`)},`,
    `  ${sqlString(`Two-hand voicing demo (${lesson.titleEn})`)},`,
    `  ${MINOR_II_VALT_I_DEMO_SCRIPT(lesson.titleJa)}`,
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en,',
    '  script = EXCLUDED.script,',
    '  updated_at = now();',
    '',
  );

  for (const progression of lesson.progressions) {
    appendSurvivalStageSql(lines, lesson, progression);
  }

  for (const progression of lesson.progressions) {
    appendQuizStageSql(lines, lesson, progression);
  }

  appendLessonSql(lines, lesson);
  appendLessonSongsSql(lines, lesson);

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
