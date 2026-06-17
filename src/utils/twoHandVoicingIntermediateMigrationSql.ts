/**
 * 両手ヴォイシングコース(中級) Supabase マイグレーション SQL 生成。
 */
import {
  TWO_HAND_VOICING_BGM_URL,
  TWO_HAND_VOICING_BLOCK_META,
  TWO_HAND_VOICING_COURSE_KEY,
  TWO_HAND_VOICING_GRAND_STAFF,
  TWO_HAND_VOICING_LESSONS,
  TWO_HAND_VOICING_UUID_NS,
  buildQuizItemsForLesson,
  buildVoicingPhrasesForLesson,
  getLessonKey,
  getLessonProgressionChords,
  resolveSurvivalStageNumber,
  type TwoHandVoicingLessonSpec,
} from './twoHandVoicingIntermediateCourse';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const sqlJson = (value: unknown): string => `'${sqlEscape(JSON.stringify(value))}'::jsonb`;

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_UUID_NS}'::uuid, ${sqlString(key)})`
);

const BGM_OVERRIDE_JSON = sqlJson({ bgmUrl: TWO_HAND_VOICING_BGM_URL });

const DEMO_SCRIPT = (blockNumber: number): string => sqlJson({
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
          ja: `ブロック${blockNumber}では、Drop2 の II-V-I ヴォイシングを身につけるのじゃ。`,
          en: `In block ${blockNumber}, you will learn Drop 2 II-V-I voicings.`,
        },
        {
          speaker: 'fai',
          ja: 'まずは流れを確認してから、弾いてみよう。',
          en: 'Let us check the flow first, then try playing.',
        },
        {
          speaker: 'jajii',
          ja: '焦らず、最低音から形を覚えるんじゃ。',
          en: 'Take your time and learn the shape from the bottom note.',
        },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});

const appendSurvivalStageSql = (
  lines: string[],
  lesson: TwoHandVoicingLessonSpec,
): void => {
  const form = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber].form;
  const progression = getLessonProgressionChords(lesson, form);
  const stageNumber = resolveSurvivalStageNumber(lesson);
  const titleSuffix = lesson.isSummary ? 'まとめ' : lesson.titleJa;

  lines.push(
    'INSERT INTO public.survival_stages (',
    '  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,',
    '  chord_suffix, chord_display_name, chord_display_name_en,',
    '  root_pattern, root_pattern_name, root_pattern_name_en,',
    '  block_key, is_mixed_stage, mixed_group_key, chord_progression,',
    '  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode',
    ') VALUES (',
    `  'lesson', ${stageNumber}, 'progression', 'survival',`,
    `  ${sqlString(`両手ヴォイシング: ${titleSuffix}`)},`,
    `  ${sqlString(`Two-hand voicing: ${lesson.titleEn}`)},`,
    "  'easy', '', 'II-V-I', 'II-V-I',",
    '  NULL, NULL, NULL,',
    "  'M7', false, NULL,",
    `  ${sqlJson(progression)},`,
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
  lesson: TwoHandVoicingLessonSpec,
): void => {
  const form = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber].form;
  const stageKey = `${getLessonKey(lesson)}-quiz`;
  const isSummary = lesson.isSummary;

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
    `  ${sqlString(`thvi-quiz-${lesson.lessonKey}`)},`,
    `  ${sqlString(`クイズ: ${lesson.titleJa}`)},`,
    `  ${sqlString(`Quiz: ${lesson.titleEn}`)},`,
    `  ${sqlString('60秒以内に20問正解。II-V-I の Drop2 ヴォイシングを弾きましょう。')},`,
    `  ${sqlString('Answer 20 questions within 60 seconds using Drop 2 II-V-I voicings.')},`,
    '  100, 0, 4, 4, 6, 6,',
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

  const items = buildQuizItemsForLesson(lesson, form);
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

const appendVoicingStageSql = (
  lines: string[],
  lesson: TwoHandVoicingLessonSpec,
): void => {
  if (lesson.isSummary) {
    return;
  }
  const form = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber].form;
  const stageKey = `${getLessonKey(lesson)}-voicing`;
  const phrases = buildVoicingPhrasesForLesson(lesson, form);

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
    `  ${sqlString(`thvi-voicing-${lesson.lessonKey}`)},`,
    `  ${sqlString(`耳コピ: ${lesson.titleJa}`)},`,
    `  ${sqlString(`Ear training: ${lesson.titleEn}`)},`,
    `  ${sqlString('BPM100・3ループ以内に II-V-I を弾きましょう。')},`,
    `  ${sqlString('Play II-V-I within 3 loops at 100 BPM.')},`,
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
  );

  for (const phrase of phrases) {
    const phraseKey = `${stageKey}-ph${phrase.phraseIndex}`;
    lines.push(
      'INSERT INTO public.ear_training_phrases (',
      '  id, stage_id, order_index, title, title_en,',
      '  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths',
      ') VALUES (',
      `  ${uuidV5(phraseKey)},`,
      `  ${uuidV5(stageKey)},`,
      `  ${phrase.phraseIndex},`,
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
        `  ${chordRow.measureNumber}, 1, 4,`,
        `  ${chordRow.startTimeSec}, ${chordRow.endTimeSec},`,
        `  ARRAY[${chordRow.notes.map(sqlString).join(', ')}]::text[],`,
        `  ARRAY[${TWO_HAND_VOICING_GRAND_STAFF.join(', ')}]::smallint[]`,
        ')',
        'ON CONFLICT (id) DO UPDATE SET',
        '  chord_name = EXCLUDED.chord_name,',
        '  voicing = EXCLUDED.voicing,',
        '  voicing_staves = EXCLUDED.voicing_staves,',
        '  updated_at = now();',
      );
    }
    lines.push('');
  }
};

const appendLessonSql = (
  lines: string[],
  lesson: TwoHandVoicingLessonSpec,
): void => {
  const blockMeta = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber];
  const lessonUuid = uuidV5(getLessonKey(lesson));
  const descriptionJa = lesson.isSummary
    ? '全キーの II-V-I Drop2 ヴォイシングを総復習します。'
    : `${lesson.titleJa} の II-V-I Drop2 ヴォイシングを練習します。`;
  const descriptionEn = lesson.isSummary
    ? 'Review Drop 2 II-V-I voicings in all keys.'
    : `Practice Drop 2 II-V-I voicings in ${lesson.titleEn}.`;

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
    `  ${sqlString(descriptionJa)},`,
    `  ${sqlString(descriptionEn)},`,
    '  true,',
    `  ${lesson.orderIndex}, ${lesson.blockNumber},`,
    `  ${sqlString(blockMeta.blockNameJa)},`,
    `  ${sqlString(blockMeta.blockNameEn)},`,
    "  '[]'::jsonb,",
    lesson.isSummary
      ? "  '①クイズ: 60秒20問 ②サバイバル: 全キー順番',"
      : "  '①クイズ ②耳コピ ③サバイバル',",
    lesson.isSummary
      ? "  '① Quiz: 20 in 60s ② Survival: all keys in order'"
      : "  '① Quiz ② Ear battle ③ Survival'",
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
  lesson: TwoHandVoicingLessonSpec,
): void => {
  const lessonUuid = uuidV5(getLessonKey(lesson));
  const stageNumber = resolveSurvivalStageNumber(lesson);
  const rows: string[] = [];
  let orderIndex = 0;

  if (lesson.questIndex === 1) {
    const demoKey = `${getLessonKey(lesson)}-demo-lsong`;
    const scriptId = `thvi-demo-${lesson.lessonKey}`;
    rows.push(
      `  (${uuidV5(demoKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"C"}'::jsonb,\n`
      + '   false, NULL, false, NULL, NULL, false, NULL, false, NULL,\n'
      + '   true, false,\n'
      + `   ${sqlString(scriptId)}, NULL,\n`
      + '   NULL,\n'
      + `   'デモ', 'Demo', true)`,
    );
    orderIndex += 1;
  }

  const appendEarTrainingRow = (
    lsongKey: string,
    titleJa: string,
    titleEn: string,
    stageUuidKey: string,
    overrides: string,
  ): void => {
    rows.push(
      `  (${uuidV5(lsongKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"B"}'::jsonb,\n`
      + '   false, NULL, false, NULL, NULL, false, NULL, true,\n'
      + `   ${uuidV5(stageUuidKey)},\n`
      + '   false, false, NULL, NULL,\n'
      + `   ${overrides},\n`
      + `   ${sqlString(titleJa)}, ${sqlString(titleEn)}, true)`,
    );
    orderIndex += 1;
  };

  if (!lesson.isSummary) {
    appendEarTrainingRow(
      `${getLessonKey(lesson)}-quiz-lsong`,
      'クイズ',
      'Quiz',
      `${getLessonKey(lesson)}-quiz`,
      BGM_OVERRIDE_JSON,
    );
    appendEarTrainingRow(
      `${getLessonKey(lesson)}-voicing-lsong`,
      '耳コピバトル',
      'Ear battle',
      `${getLessonKey(lesson)}-voicing`,
      'NULL',
    );
  } else {
    appendEarTrainingRow(
      `${getLessonKey(lesson)}-quiz-lsong`,
      'クイズ',
      'Quiz',
      `${getLessonKey(lesson)}-quiz`,
      BGM_OVERRIDE_JSON,
    );
  }

  const survivalKey = `${getLessonKey(lesson)}-survival-lsong`;
  rows.push(
    `  (${uuidV5(survivalKey)}, ${lessonUuid}, NULL, ${orderIndex}, '{"count":1,"rank":"C"}'::jsonb,\n`
    + '   false, NULL, true,\n'
    + `   ${stageNumber}, 'lesson', false, NULL, false, NULL,\n`
    + '   false, false, NULL, NULL,\n'
    + `   ${BGM_OVERRIDE_JSON},\n`
    + `   'サバイバル', 'Survival', true)`,
  );

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

export const generateTwoHandVoicingIntermediateMigrationSql = (): string => {
  const lines: string[] = [
    '-- 目的別コース: 両手ヴォイシングコース(中級)',
    '-- Drop2 II-V-I A-B-A / B-A-B、2ブロック × 7レッスン',
    'BEGIN;',
    '',
  ];

  lines.push(
    'INSERT INTO public.courses (',
    '  id, title, title_en, description, description_en,',
    '  premium_only, order_index, audience, is_tutorial, is_visible,',
    '  difficulty_tier, is_developer_only, is_main_course',
    ')',
    'SELECT',
    `  ${uuidV5(TWO_HAND_VOICING_COURSE_KEY)},`,
    "  '両手ヴォイシングコース(中級)',",
    "  'Two-Hand Voicing (Intermediate)',",
    "  'Drop2 の II-V-I ヴォイシングを、クイズ・耳コピ・サバイバルで身につけましょう。',",
    "  'Master Drop 2 II-V-I voicings through quiz, ear training, and survival modes.',",
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
    '  order_index = EXCLUDED.order_index,',
    '  difficulty_tier = EXCLUDED.difficulty_tier,',
    '  is_visible = EXCLUDED.is_visible,',
    '  updated_at = now();',
    '',
  );

  for (const lesson of TWO_HAND_VOICING_LESSONS) {
    if (lesson.questIndex === 1) {
      const scriptId = `thvi-demo-${lesson.lessonKey}`;
      lines.push(
        'INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (',
        `  ${sqlString(scriptId)},`,
        `  ${sqlString(`両手ヴォイシング デモ (${lesson.titleJa})`)},`,
        `  ${sqlString(`Two-hand voicing demo (${lesson.titleEn})`)},`,
        `  ${DEMO_SCRIPT(lesson.blockNumber)}`,
        ')',
        'ON CONFLICT (id) DO UPDATE SET',
        '  title = EXCLUDED.title,',
        '  title_en = EXCLUDED.title_en,',
        '  script = EXCLUDED.script,',
        '  updated_at = now();',
        '',
      );
    }
  }

  for (const lesson of TWO_HAND_VOICING_LESSONS) {
    appendSurvivalStageSql(lines, lesson);
  }

  for (const lesson of TWO_HAND_VOICING_LESSONS) {
    appendQuizStageSql(lines, lesson);
    appendVoicingStageSql(lines, lesson);
  }

  for (const lesson of TWO_HAND_VOICING_LESSONS) {
    appendLessonSql(lines, lesson);
    appendLessonSongsSql(lines, lesson);
  }

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
