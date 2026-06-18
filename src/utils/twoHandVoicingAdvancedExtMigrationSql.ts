/**
 * 両手ヴォイシングコース(上級) フェーズ2 Supabase マイグレーション SQL 生成。
 */
import {
  TWO_HAND_VOICING_ADVANCED_BGM_URL,
  TWO_HAND_VOICING_ADVANCED_COURSE_KEY,
  TWO_HAND_VOICING_ADVANCED_UUID_NS,
  TWO_HAND_VOICING_ADVANCED_BLOCK_META,
  buildAdvancedQuizItems,
  buildAdvancedSurvivalProgression,
  buildAdvancedVoicingPhrase,
  getAdvancedLessonKey,
  getAdvancedStageKey,
  resolveAdvancedSurvivalStageNumberForProgression,
  resolveAdvancedVoicingStaves,
  TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
  type AdvancedProgressionSpec,
  type TwoHandVoicingAdvancedLessonSpec,
} from './twoHandVoicingAdvancedCourse';
import {
  buildMinorIiViQuizItems,
  getAdvancedMinorIiViLessonKey,
  getAdvancedMinorIiViStageKey,
  getMinorIiViProgressionChords,
  resolveAdvancedMinorIiViSurvivalStageNumberForProgression,
  resolveMinorIiViQuizLoopMeasures,
  TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON,
  type MinorIiViProgressionSpec,
  type TwoHandVoicingAdvancedMinorIiViLessonSpec,
} from './twoHandVoicingAdvancedMinorIiViCourse';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const sqlJson = (value: unknown): string => `'${sqlEscape(JSON.stringify(value))}'::jsonb`;

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_ADVANCED_UUID_NS}'::uuid, ${sqlString(key)})`
);

const BGM_OVERRIDE_JSON = sqlJson({ bgmUrl: TWO_HAND_VOICING_ADVANCED_BGM_URL });

const sqlStavesArray = (notes: readonly string[]): string => (
  `ARRAY[${resolveAdvancedVoicingStaves(notes).join(', ')}]::smallint[]`
);

const categoryLabel = (category: TwoHandVoicingAdvancedLessonSpec['category']): string => {
  if (category === 'mM7') {
    return 'mM7';
  }
  if (category === 'm7b5') {
    return 'm7b5';
  }
  return '7(#11)';
};

const ADVANCED_DEMO_SCRIPT = (titleJa: string, chordLabelJa: string): string => sqlJson({
  version: 3,
  audioTracks: {
    drum_loop: { url: TWO_HAND_VOICING_ADVANCED_BGM_URL, volume: 0.5 },
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
          ja: '同音集合の読み替えも、5 音の形をそのまま覚えるのじゃ。',
          en: 'For alternate chord readings, keep the same five-note shape.',
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

const MINOR_II_VI_DEMO_SCRIPT = (titleJa: string): string => sqlJson({
  version: 3,
  audioTracks: {
    drum_loop: { url: TWO_HAND_VOICING_ADVANCED_BGM_URL, volume: 0.5 },
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
          ja: 'マイナー II-V-I では、IIm7b5 → V7alt → ImM7 のトップラインが 5度 → ♭7/#9 → 9度 になるのじゃ。',
          en: 'In minor II-V-I, the top line moves 5th → flat 7/sharp 9 → 9th across IIm7b5, V7alt, and ImM7.',
        },
        {
          speaker: 'fai',
          ja: `${titleJa} の流れを確認してから、弾いてみよう。`,
          en: 'Check the flow first, then try playing.',
        },
        {
          speaker: 'jajii',
          ja: 'V7alt の 3rd は b4 表記じゃ。左手2音 + 右手3音の形を覚えるんじゃ。',
          en: 'Use flat-4 spelling for the V7alt 3rd. Learn the two-left, three-right hand shape.',
        },
      ],
    },
    { type: 'finish' },
  ],
  finish: { showCta: true },
});

const appendAdvancedSurvivalStageSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedLessonSpec,
  progression: AdvancedProgressionSpec,
): void => {
  const progressionChords = buildAdvancedSurvivalProgression(progression, lesson.category);
  const stageNumber = resolveAdvancedSurvivalStageNumberForProgression(lesson, progression);
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
    "  'easy', '', 'So What / UST', 'So What / UST',",
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

const appendAdvancedQuizStageSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedLessonSpec,
  progression: AdvancedProgressionSpec,
): void => {
  const stageKey = getAdvancedStageKey(lesson, progression, 'quiz');
  const isSummary = progression.isSummary;
  const descriptionJa = isSummary
    ? '60秒以内に20問正解。全キーの So What / UST ヴォイシングをランダム出題。'
    : `60秒以内に20問正解。${progression.titleJa} の So What / UST ヴォイシングを弾きましょう。`;
  const descriptionEn = isSummary
    ? 'Answer 20 questions within 60 seconds. Random So What / UST voicings in all keys.'
    : `Answer 20 questions within 60 seconds using ${progression.titleEn} So What / UST voicings.`;

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
    `  ${sqlString(`thva-quiz-${lesson.lessonKey}-${progression.progressionKey}`)},`,
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

  const items = buildAdvancedQuizItems(progression, lesson.category);
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
      `  ${sqlStavesArray(item.notes)}`,
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

const appendAdvancedVoicingStageSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedLessonSpec,
  progression: AdvancedProgressionSpec,
): void => {
  if (progression.isSummary) {
    return;
  }

  const stageKey = getAdvancedStageKey(lesson, progression, 'voicing');
  const phrase = buildAdvancedVoicingPhrase(progression, lesson.category);
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
    `  ${sqlString(`thva-voicing-${lesson.lessonKey}-${progression.progressionKey}`)},`,
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
    `  ${sqlString(TWO_HAND_VOICING_ADVANCED_BGM_URL)},`,
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
      `  ${sqlStavesArray(chordRow.notes)}`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  chord_name = EXCLUDED.chord_name,',
      '  measure_number = EXCLUDED.measure_number,',
      '  voicing = EXCLUDED.voicing,',
      '  voicing_staves = EXCLUDED.voicing_staves;',
    );
  }
  lines.push('');
};

const appendAdvancedLessonSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedLessonSpec,
): void => {
  const lessonUuid = uuidV5(getAdvancedLessonKey(lesson));

  lines.push(
    'INSERT INTO public.lessons (',
    '  id, course_id, title, title_en, description, description_en,',
    '  premium_only, order_index, block_number, block_name, block_name_en,',
    '  nav_links, assignment_description, assignment_description_en',
    ') VALUES (',
    `  ${lessonUuid},`,
    `  ${uuidV5(TWO_HAND_VOICING_ADVANCED_COURSE_KEY)},`,
    `  ${sqlString(lesson.titleJa)},`,
    `  ${sqlString(lesson.titleEn)},`,
    `  ${sqlString(`${lesson.titleJa} の So What / UST 5 音ヴォイシングを練習します。`)},`,
    `  ${sqlString(`Practice So What / UST five-note voicings for ${lesson.titleEn}.`)},`,
    '  true,',
    `  ${lesson.orderIndex}, ${TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNumber},`,
    `  ${sqlString(TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNameJa)},`,
    `  ${sqlString(TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNameEn)},`,
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

const appendAdvancedLessonSongsSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedLessonSpec,
): void => {
  const lessonUuid = uuidV5(getAdvancedLessonKey(lesson));
  const rows: string[] = [];
  let orderIndex = 0;

  const demoKey = `${getAdvancedLessonKey(lesson)}-demo-lsong`;
  const scriptId = `thva-demo-${lesson.lessonKey}`;
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
        `${getAdvancedLessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
        `クイズ: ${progression.titleJa}`,
        `Quiz: ${progression.titleEn}`,
        getAdvancedStageKey(lesson, progression, 'quiz'),
        BGM_OVERRIDE_JSON,
      );
      appendEarTrainingRow(
        `${getAdvancedLessonKey(lesson)}-${progression.progressionKey}-voicing-lsong`,
        `耳コピ: ${progression.titleJa}`,
        `Ear battle: ${progression.titleEn}`,
        getAdvancedStageKey(lesson, progression, 'voicing'),
        'NULL',
      );
    } else {
      appendEarTrainingRow(
        `${getAdvancedLessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
        'クイズ: 全キーまとめ',
        'Quiz: All keys',
        getAdvancedStageKey(lesson, progression, 'quiz'),
        BGM_OVERRIDE_JSON,
      );
    }

    const stageNumber = resolveAdvancedSurvivalStageNumberForProgression(lesson, progression);
    appendSurvivalRow(
      `${getAdvancedLessonKey(lesson)}-${progression.progressionKey}-survival-lsong`,
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

const appendMinorIiViSurvivalStageSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedMinorIiViLessonSpec,
  progression: MinorIiViProgressionSpec,
): void => {
  const progressionChords = getMinorIiViProgressionChords(progression);
  const stageNumber = resolveAdvancedMinorIiViSurvivalStageNumberForProgression(progression);
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
    "  'easy', '', 'II-V-i', 'II-V-i',",
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

const appendMinorIiViQuizStageSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedMinorIiViLessonSpec,
  progression: MinorIiViProgressionSpec,
): void => {
  const stageKey = getAdvancedMinorIiViStageKey(progression, 'quiz');
  const loopMeasures = resolveMinorIiViQuizLoopMeasures(progression);
  const descriptionJa = progression.isSummary
    ? '60秒以内に20問正解。全キーのマイナー II-V-I を順番に弾きましょう。'
    : `60秒以内に20問正解。${progression.titleJa} のマイナー II-V-I を弾きましょう。`;
  const descriptionEn = progression.isSummary
    ? 'Answer 20 questions within 60 seconds. Play minor II-V-I in all keys in order.'
    : `Answer 20 questions within 60 seconds using ${progression.titleEn} minor II-V-I voicings.`;

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
    `  ${sqlString(`thva-quiz-${lesson.lessonKey}-${progression.progressionKey}`)},`,
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

  const items = buildMinorIiViQuizItems(progression);
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
      `  ${sqlStavesArray(item.notes)}`,
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

const appendMinorIiViLessonSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedMinorIiViLessonSpec,
): void => {
  const lessonUuid = uuidV5(getAdvancedMinorIiViLessonKey(lesson));

  lines.push(
    'INSERT INTO public.lessons (',
    '  id, course_id, title, title_en, description, description_en,',
    '  premium_only, order_index, block_number, block_name, block_name_en,',
    '  nav_links, assignment_description, assignment_description_en',
    ') VALUES (',
    `  ${lessonUuid},`,
    `  ${uuidV5(TWO_HAND_VOICING_ADVANCED_COURSE_KEY)},`,
    `  ${sqlString(lesson.titleJa)},`,
    `  ${sqlString(lesson.titleEn)},`,
    `  ${sqlString(`${lesson.titleJa} の So What / UST マイナー II-V-I ヴォイシングを練習します。`)},`,
    `  ${sqlString(`Practice So What / UST minor II-V-I voicings for ${lesson.titleEn}.`)},`,
    '  true,',
    `  ${lesson.orderIndex}, ${TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNumber},`,
    `  ${sqlString(TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNameJa)},`,
    `  ${sqlString(TWO_HAND_VOICING_ADVANCED_BLOCK_META.blockNameEn)},`,
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

const appendMinorIiViLessonSongsSql = (
  lines: string[],
  lesson: TwoHandVoicingAdvancedMinorIiViLessonSpec,
): void => {
  const lessonUuid = uuidV5(getAdvancedMinorIiViLessonKey(lesson));
  const rows: string[] = [];
  let orderIndex = 0;

  const demoKey = `${getAdvancedMinorIiViLessonKey(lesson)}-demo-lsong`;
  const scriptId = `thva-demo-${lesson.lessonKey}`;
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
      `${getAdvancedMinorIiViLessonKey(lesson)}-${progression.progressionKey}-quiz-lsong`,
      progression.isSummary ? 'クイズ: 全キーまとめ' : `クイズ: ${progression.titleJa}`,
      progression.isSummary ? 'Quiz: All keys' : `Quiz: ${progression.titleEn}`,
      getAdvancedMinorIiViStageKey(progression, 'quiz'),
      BGM_OVERRIDE_JSON,
    );

    const stageNumber = resolveAdvancedMinorIiViSurvivalStageNumberForProgression(progression);
    appendSurvivalRow(
      `${getAdvancedMinorIiViLessonKey(lesson)}-${progression.progressionKey}-survival-lsong`,
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

export const generateTwoHandVoicingAdvancedExtMigrationSql = (): string => {
  const minorLesson = TWO_HAND_VOICING_ADVANCED_MINOR_II_VI_LESSON;
  const lines: string[] = [
    '-- 両手ヴォイシングコース(上級) フェーズ2',
    '-- mM7 / m7b5 / 7(#11) + マイナー II-V-I',
    'BEGIN;',
    '',
  ];

  for (const lesson of TWO_HAND_VOICING_ADVANCED_EXT_LESSONS) {
    const scriptId = `thva-demo-${lesson.lessonKey}`;
    lines.push(
      'INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (',
      `  ${sqlString(scriptId)},`,
      `  ${sqlString(`両手ヴォイシング デモ (${lesson.titleJa})`)},`,
      `  ${sqlString(`Two-hand voicing demo (${lesson.titleEn})`)},`,
      `  ${ADVANCED_DEMO_SCRIPT(lesson.titleJa, categoryLabel(lesson.category))}`,
      ')',
      'ON CONFLICT (id) DO UPDATE SET',
      '  title = EXCLUDED.title,',
      '  title_en = EXCLUDED.title_en,',
      '  script = EXCLUDED.script,',
      '  updated_at = now();',
      '',
    );
  }

  const minorScriptId = `thva-demo-${minorLesson.lessonKey}`;
  lines.push(
    'INSERT INTO public.survival_tutorial_scripts (id, title, title_en, script) VALUES (',
    `  ${sqlString(minorScriptId)},`,
    `  ${sqlString(`両手ヴォイシング デモ (${minorLesson.titleJa})`)},`,
    `  ${sqlString(`Two-hand voicing demo (${minorLesson.titleEn})`)},`,
    `  ${MINOR_II_VI_DEMO_SCRIPT(minorLesson.titleJa)}`,
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  title = EXCLUDED.title,',
    '  title_en = EXCLUDED.title_en,',
    '  script = EXCLUDED.script,',
    '  updated_at = now();',
    '',
  );

  for (const lesson of TWO_HAND_VOICING_ADVANCED_EXT_LESSONS) {
    for (const progression of lesson.progressions) {
      appendAdvancedSurvivalStageSql(lines, lesson, progression);
    }
  }

  for (const progression of minorLesson.progressions) {
    appendMinorIiViSurvivalStageSql(lines, minorLesson, progression);
  }

  for (const lesson of TWO_HAND_VOICING_ADVANCED_EXT_LESSONS) {
    for (const progression of lesson.progressions) {
      appendAdvancedQuizStageSql(lines, lesson, progression);
      appendAdvancedVoicingStageSql(lines, lesson, progression);
    }
  }

  for (const progression of minorLesson.progressions) {
    appendMinorIiViQuizStageSql(lines, minorLesson, progression);
  }

  for (const lesson of TWO_HAND_VOICING_ADVANCED_EXT_LESSONS) {
    appendAdvancedLessonSql(lines, lesson);
    appendAdvancedLessonSongsSql(lines, lesson);
  }

  appendMinorIiViLessonSql(lines, minorLesson);
  appendMinorIiViLessonSongsSql(lines, minorLesson);

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
