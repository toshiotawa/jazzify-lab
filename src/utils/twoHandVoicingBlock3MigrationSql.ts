/**
 * 両手ヴォイシングコース(中級) Block 3 Supabase マイグレーション SQL 生成。
 */
import {
  TWO_HAND_VOICING_BGM_URL,
  TWO_HAND_VOICING_COURSE_KEY,
  TWO_HAND_VOICING_UUID_NS,
} from './twoHandVoicingIntermediateCourse';
import {
  TWO_HAND_VOICING_BLOCK3_META,
  TWO_HAND_VOICING_GRAND_STAFF,
  buildBlock3QuizItems,
  buildBlock3SurvivalProgression,
  buildBlock3VoicingPhrase,
  getBlock3LessonKey,
  getBlock3StageKey,
  resolveBlock3SurvivalStageNumberForProgression,
  TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
  TWO_HAND_VOICING_BLOCK3_LESSONS,
  type Block3ProgressionSpec,
  type TwoHandVoicingBlock3LessonSpec,
} from './twoHandVoicingBlock3Course';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const sqlJson = (value: unknown): string => `'${sqlEscape(JSON.stringify(value))}'::jsonb`;

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_UUID_NS}'::uuid, ${sqlString(key)})`
);

const BGM_OVERRIDE_JSON = sqlJson({ bgmUrl: TWO_HAND_VOICING_BGM_URL });

const BLOCK3_DEMO_SCRIPT = (titleJa: string, chordLabelJa = 'M7・m7・7alt'): string => sqlJson({
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
          ja: 'Drop2 Resolution では、声部の動きを意識しながらヴォイシングを弾くのじゃ。',
          en: 'In Drop 2 Resolution, play voicings while following the voice leading.',
        },
        {
          speaker: 'fai',
          ja: `${titleJa} の進行を確認してから、弾いてみよう。`,
          en: 'Check the progression first, then try playing.',
        },
        {
          speaker: 'jajii',
          ja: `コード表記は ${chordLabelJa} で統一じゃ。焦らず形を覚えるんじゃ。`,
          en: `Chord symbols stay ${chordLabelJa.replace(/・/g, ', ')}. Take your time learning the shapes.`,
        },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});

const appendSurvivalStageSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3LessonSpec,
  progression: Block3ProgressionSpec,
): void => {
  const progressionChords = buildBlock3SurvivalProgression(progression, lesson.category);
  const stageNumber = resolveBlock3SurvivalStageNumberForProgression(lesson, progression);
  const displayName = progression.isSummary
    ? `${lesson.titleJa}: まとめ`
    : `${lesson.titleJa}: ${progression.titleJa}`;

  lines.push(
    'INSERT INTO public.survival_stages (',
    '  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,',
    '  chord_suffix, chord_display_name, chord_display_name_en,',
    '  root_pattern, root_pattern_name, root_pattern_name_en,',
    '  block_key, is_mixed_stage, mixed_group_key, chord_progression,',
    '  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode, grand_staff_mode',
    ') VALUES (',
    `  'lesson', ${stageNumber}, 'progression', 'survival',`,
    `  ${sqlString(`両手ヴォイシング: ${displayName}`)},`,
    `  ${sqlString(`Two-hand voicing: ${displayName}`)},`,
    "  'easy', '', 'Drop2 Resolution', 'Drop2 Resolution',",
    '  NULL, NULL, NULL,',
    `  ${sqlString(lesson.survivalBlockKey)}, false, NULL,`,
    `  ${sqlJson(progressionChords)},`,
    "  true, 'fade_15s', 'fade_15s', true",
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
    '  grand_staff_mode = EXCLUDED.grand_staff_mode,',
    '  updated_at = now();',
    '',
  );
};

const appendQuizStageSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3LessonSpec,
  progression: Block3ProgressionSpec,
): void => {
  const stageKey = getBlock3StageKey(lesson, progression, 'quiz');
  const isSummary = progression.isSummary;
  const descriptionJa = isSummary
    ? '60秒以内に20問正解。全キーの Drop2 Resolution をランダム出題。'
    : `60秒以内に20問正解。${progression.titleJa} の Drop2 Resolution を弾きましょう。`;
  const descriptionEn = isSummary
    ? 'Answer 20 questions within 60 seconds. Random Drop 2 Resolution in all keys.'
    : `Answer 20 questions within 60 seconds using ${progression.titleEn} Drop 2 Resolution voicings.`;

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
    '  100, 0, 4, 4, 4, 4,',
    '  0, 60, 100, 10000,',
    '  0, 0, 0, 0, 0, 0, 0, 0,',
    "  'blue_club', true, 'chord_quiz',",
    `  60, ${sqlString(isSummary ? 'random' : 'sequential')}, ${isSummary ? 'false' : 'true'}, false, 20, ${isSummary ? 'false' : 'true'}`,
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

  const items = buildBlock3QuizItems(progression, lesson.category);
  for (const item of items) {
    const itemKey = `${stageKey}-item-${item.orderIndex}`;
    lines.push(
      'INSERT INTO public.ear_training_chord_quiz_items (',
      '  id, stage_id, order_index, measure_number, beat_offset, duration_beats,',
      '  chord_name, voicing, voicing_staves',
      ') VALUES (',
      `  ${uuidV5(itemKey)},`,
      `  ${uuidV5(stageKey)},`,
      `  ${item.orderIndex}, ${item.measureNumber}, ${item.beatOffset}, 4,`,
      `  ${sqlString(item.chordName)},`,
      `  ARRAY[${item.notes.map(sqlString).join(', ')}]::text[],`,
      `  ARRAY[${TWO_HAND_VOICING_GRAND_STAFF.join(', ')}]::smallint[]`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  order_index = EXCLUDED.order_index,',
      '  measure_number = EXCLUDED.measure_number,',
      '  beat_offset = EXCLUDED.beat_offset,',
      '  chord_name = EXCLUDED.chord_name,',
      '  voicing = EXCLUDED.voicing,',
      '  voicing_staves = EXCLUDED.voicing_staves,',
      '  updated_at = now();',
    );
  }
  lines.push('');
};

const appendVoicingStageSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3LessonSpec,
  progression: Block3ProgressionSpec,
): void => {
  if (progression.isSummary) {
    return;
  }

  const stageKey = getBlock3StageKey(lesson, progression, 'voicing');
  const phrase = buildBlock3VoicingPhrase(progression, lesson.category);
  const phraseKey = `${stageKey}-ph0`;

  lines.push(
    'INSERT INTO public.ear_training_stages (',
    '  id, slug, title, title_en, description, description_en,',
    '  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,',
    '  count_in_beats, time_limit_sec, player_hp, enemy_hp,',
    '  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,',
    '  miss_damage, fail_damage, perfect_max_misses, great_max_misses,',
    '  background_theme, is_active, mode, show_keyboard_hints_in_battle',
    ') VALUES (',
    `  ${uuidV5(stageKey)},`,
    `  ${sqlString(`thvi-b3-voicing-${lesson.lessonKey}-${progression.progressionKey}`)},`,
    `  ${sqlString(`耳コピ: ${progression.titleJa}`)},`,
    `  ${sqlString(`Ear training: ${progression.titleEn}`)},`,
    `  ${sqlString('BPM100・3ループ以内に進行を弾きましょう。')},`,
    `  ${sqlString('Play the progression within 3 loops at 100 BPM.')},`,
    '  100, 0, 4, 4, 4, 3,',
    '  4, 180, 100, 90,',
    '  2, 12, 18, 24, 3, 30, 0, 2,',
    "  'blue_club', true, 'chord_voicing', true",
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en,',
    '  description = EXCLUDED.description,',
    '  description_en = EXCLUDED.description_en,',
    '  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,',
    '  count_in_beats = EXCLUDED.count_in_beats,',
    '  time_limit_sec = EXCLUDED.time_limit_sec,',
    '  enemy_hp = EXCLUDED.enemy_hp,',
    '  fail_damage = EXCLUDED.fail_damage,',
    '  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,',
    '  updated_at = now();',
    '',
    'INSERT INTO public.ear_training_phrases (',
    '  id, stage_id, order_index, title, title_en,',
    '  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths',
    ') VALUES (',
    `  ${uuidV5(phraseKey)},`,
    `  ${uuidV5(stageKey)},`,
    '  0,',
    `  ${sqlString(phrase.titleJa)},`,
    `  ${sqlString(phrase.titleEn)},`,
    '  NULL,',
    `  ${sqlString(TWO_HAND_VOICING_BGM_URL)},`,
    '  9.6, 57.6, 0,',
    `  ${phrase.keyFifths}`,
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  audio_url = EXCLUDED.audio_url,',
    '  loop_duration_sec = EXCLUDED.loop_duration_sec,',
    '  updated_at = now();',
    '',
  );

  for (const chordRow of phrase.chords) {
    const beatOffset = (chordRow as { beatOffset?: number }).beatOffset ?? 1;
    const chordKey = `${phraseKey}-c${chordRow.orderIndex}`;
    lines.push(
      'INSERT INTO public.ear_training_phrase_chords (',
      '  id, phrase_id, order_index, chord_name,',
      '  measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec,',
      '  voicing, voicing_staves',
      ') VALUES (',
      `  ${uuidV5(chordKey)},`,
      `  ${uuidV5(phraseKey)},`,
      `  ${chordRow.orderIndex},`,
      `  ${sqlString(chordRow.chordName)},`,
      `  ${chordRow.measureNumber}, ${beatOffset}, 4,`,
      `  ${chordRow.startTimeSec}, ${chordRow.endTimeSec},`,
      `  ARRAY[${chordRow.notes.map(sqlString).join(', ')}]::text[],`,
      `  ARRAY[${TWO_HAND_VOICING_GRAND_STAFF.join(', ')}]::smallint[]`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  chord_name = EXCLUDED.chord_name,',
      '  measure_number = EXCLUDED.measure_number,',
      '  beat_offset = EXCLUDED.beat_offset,',
      '  voicing = EXCLUDED.voicing,',
      '  voicing_staves = EXCLUDED.voicing_staves;',
    );
  }
  lines.push('');
};

const appendLessonSql = (
  lines: string[],
  lesson: TwoHandVoicingBlock3LessonSpec,
): void => {
  const lessonUuid = uuidV5(getBlock3LessonKey(lesson));

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
    `  ${sqlString(`${lesson.titleJa} の Drop2 Resolution ヴォイシングを練習します。`)},`,
    `  ${sqlString(`Practice Drop 2 Resolution voicings for ${lesson.titleEn}.`)},`,
    '  true,',
    `  ${lesson.orderIndex}, ${TWO_HAND_VOICING_BLOCK3_META.blockNumber},`,
    `  ${sqlString(TWO_HAND_VOICING_BLOCK3_META.blockNameJa)},`,
    `  ${sqlString(TWO_HAND_VOICING_BLOCK3_META.blockNameEn)},`,
    "  '[]'::jsonb,",
    "  '①デモ ②3進行×クイズ/耳コピ/サバイバル ③全キーまとめ',",
    "  '① Demo ② 3 progressions × quiz/ear/survival ③ All-keys review'",
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
  lesson: TwoHandVoicingBlock3LessonSpec,
): void => {
  const lessonUuid = uuidV5(getBlock3LessonKey(lesson));
  const rows: string[] = [];
  let orderIndex = 0;

  const demoKey = `${getBlock3LessonKey(lesson)}-demo-lsong`;
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
    if (!progression.isSummary) {
      appendEarTrainingRow(
        `${getBlock3LessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
        `クイズ: ${progression.titleJa}`,
        `Quiz: ${progression.titleEn}`,
        getBlock3StageKey(lesson, progression, 'quiz'),
        BGM_OVERRIDE_JSON,
      );
      appendEarTrainingRow(
        `${getBlock3LessonKey(lesson)}-${progression.progressionKey}-voicing-lsong`,
        `耳コピ: ${progression.titleJa}`,
        `Ear battle: ${progression.titleEn}`,
        getBlock3StageKey(lesson, progression, 'voicing'),
        'NULL',
      );
    } else {
      appendEarTrainingRow(
        `${getBlock3LessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
        'クイズ: 全キーまとめ',
        'Quiz: All keys',
        getBlock3StageKey(lesson, progression, 'quiz'),
        BGM_OVERRIDE_JSON,
      );
    }

    const stageNumber = resolveBlock3SurvivalStageNumberForProgression(lesson, progression);
    appendSurvivalRow(
      `${getBlock3LessonKey(lesson)}-${progression.progressionKey}-survival-lsong`,
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

export const generateTwoHandVoicingBlock3MigrationSql = (): string => (
  generateTwoHandVoicingBlock3DualLessonsMigrationSql(
    TWO_HAND_VOICING_BLOCK3_LESSONS,
    '-- 両手ヴォイシングコース(中級) Block 3: Drop 2 Resolution 基礎編',
    '-- 3レッスン × 12 lesson_songs',
    'M7・m7・7alt',
  )
);

export const generateTwoHandVoicingBlock3ExtMigrationSql = (): string => (
  generateTwoHandVoicingBlock3DualLessonsMigrationSql(
    TWO_HAND_VOICING_BLOCK3_EXT_LESSONS,
    '-- 両手ヴォイシングコース(中級) Block 3 レッスン5-7: Drop 2 Resolution 応用',
    '-- mM7 / Lydian dominant 7 / m7b5 × 12 lesson_songs',
    'mM7・7・m7b5',
  )
);

const generateTwoHandVoicingBlock3DualLessonsMigrationSql = (
  lessons: readonly TwoHandVoicingBlock3LessonSpec[],
  headerLine1: string,
  headerLine2: string,
  chordLabelJa: string,
): string => {
  const lines: string[] = [
    headerLine1,
    headerLine2,
    'BEGIN;',
    '',
  ];

  for (const lesson of lessons) {
    const scriptId = `thvi-b3-demo-${lesson.lessonKey}`;
    lines.push(
      'INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (',
      `  ${sqlString(scriptId)},`,
      `  ${sqlString(`両手ヴォイシング デモ (${lesson.titleJa})`)},`,
      `  ${sqlString(`Two-hand voicing demo (${lesson.titleEn})`)},`,
      `  ${BLOCK3_DEMO_SCRIPT(lesson.titleJa, chordLabelJa)}`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  title = EXCLUDED.title,',
      '  title_en = EXCLUDED.title_en,',
      '  script = EXCLUDED.script,',
      '  updated_at = now();',
      '',
    );
  }

  for (const lesson of lessons) {
    for (const progression of lesson.progressions) {
      appendSurvivalStageSql(lines, lesson, progression);
    }
  }

  for (const lesson of lessons) {
    for (const progression of lesson.progressions) {
      appendQuizStageSql(lines, lesson, progression);
      appendVoicingStageSql(lines, lesson, progression);
    }
  }

  for (const lesson of lessons) {
    appendLessonSql(lines, lesson);
    appendLessonSongsSql(lines, lesson);
  }

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
