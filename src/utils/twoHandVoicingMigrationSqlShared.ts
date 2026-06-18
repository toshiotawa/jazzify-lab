import type { QuizItemSpec } from '@/utils/twoHandVoicingIntermediateCourse';
import type { AdvancedChordCategory, TwoHandVoicingAdvancedLessonSpec } from '@/utils/twoHandVoicingAdvancedCourse';

export const VOICING_BATTLE_TITLE_JA = 'バトル';
export const VOICING_BATTLE_TITLE_EN = 'Battle';

export const voicingBattleTitleJa = (progressionTitle: string): string => (
  `バトル: ${progressionTitle}`
);

export const voicingBattleTitleEn = (progressionTitle: string): string => (
  `Battle: ${progressionTitle}`
);

export const advancedLessonDescriptionJa = (
  lesson: Pick<TwoHandVoicingAdvancedLessonSpec, 'category' | 'titleJa'>,
): string => {
  if (lesson.category === 'm7' || lesson.category === 'M7') {
    return `${lesson.titleJa} の So What 5 音ヴォイシングを練習します。`;
  }
  if (
    lesson.category === '7alt'
    || lesson.category === 'mM7'
    || lesson.category === 'm7b5'
    || lesson.category === '7(#11)'
  ) {
    return `${lesson.titleJa} の UST 5 音ヴォイシングを練習します。`;
  }
  return `${lesson.titleJa} の So What / UST 5 音ヴォイシングを練習します。`;
};

export const advancedLessonDescriptionEn = (
  lesson: Pick<TwoHandVoicingAdvancedLessonSpec, 'category' | 'titleEn'>,
): string => {
  if (lesson.category === 'm7' || lesson.category === 'M7') {
    return `Practice So What five-note voicings for ${lesson.titleEn}.`;
  }
  if (
    lesson.category === '7alt'
    || lesson.category === 'mM7'
    || lesson.category === 'm7b5'
    || lesson.category === '7(#11)'
  ) {
    return `Practice UST five-note voicings for ${lesson.titleEn}.`;
  }
  return `Practice So What / UST five-note voicings for ${lesson.titleEn}.`;
};

export const advancedQuizStageDescriptionJa = (
  lesson: Pick<TwoHandVoicingAdvancedLessonSpec, 'category'>,
  progression: { isSummary: boolean; titleJa: string },
): string => {
  const voicingLabel = lesson.category === 'm7' || lesson.category === 'M7'
    ? 'So What'
    : lesson.category === '7alt' || lesson.category === 'mM7' || lesson.category === 'm7b5' || lesson.category === '7(#11)'
      ? 'UST'
      : 'So What / UST';
  if (progression.isSummary) {
    return `60秒以内に20問正解。全キーの ${voicingLabel} ヴォイシングをランダム出題。`;
  }
  return `60秒以内に20問正解。${progression.titleJa} の ${voicingLabel} ヴォイシングを弾きましょう。`;
};

export const advancedQuizStageDescriptionEn = (
  lesson: Pick<TwoHandVoicingAdvancedLessonSpec, 'category'>,
  progression: { isSummary: boolean; titleEn: string },
): string => {
  const voicingLabel = lesson.category === 'm7' || lesson.category === 'M7'
    ? 'So What'
    : lesson.category === '7alt' || lesson.category === 'mM7' || lesson.category === 'm7b5' || lesson.category === '7(#11)'
      ? 'UST'
      : 'So What / UST';
  if (progression.isSummary) {
    return `Answer 20 questions within 60 seconds. Random ${voicingLabel} voicings in all keys.`;
  }
  return `Answer 20 questions within 60 seconds using ${progression.titleEn} ${voicingLabel} voicings.`;
};

export const appendEarTrainingChordQuizItemSql = (
  lines: string[],
  options: {
    itemKey: string;
    stageKey: string;
    item: QuizItemSpec;
    stavesSql: string;
    uuidV5: (key: string) => string;
    sqlString: (value: string) => string;
    beatOffset?: number;
  },
): void => {
  const { itemKey, stageKey, item, stavesSql, uuidV5, sqlString, beatOffset = 1 } = options;
  lines.push(
    'INSERT INTO public.ear_training_chord_quiz_items (',
    '  id, stage_id, order_index, measure_number, beat_offset, duration_beats,',
    '  chord_name, voicing, voicing_staves, key_fifths',
    ') VALUES (',
    `  ${uuidV5(itemKey)},`,
    `  ${uuidV5(stageKey)},`,
    `  ${item.orderIndex}, ${item.measureNumber}, ${beatOffset}, 4,`,
    `  ${sqlString(item.chordName)},`,
    `  ARRAY[${item.notes.map(sqlString).join(', ')}]::text[],`,
    `  ${stavesSql},`,
    `  ${item.keyFifths}`,
    ')',
    'ON CONFLICT (id) DO UPDATE SET',
    '  order_index = EXCLUDED.order_index,',
    '  measure_number = EXCLUDED.measure_number,',
    '  beat_offset = EXCLUDED.beat_offset,',
    '  chord_name = EXCLUDED.chord_name,',
    '  voicing = EXCLUDED.voicing,',
    '  voicing_staves = EXCLUDED.voicing_staves,',
    '  key_fifths = EXCLUDED.key_fifths,',
    '  updated_at = now();',
  );
};

export const stripMigrationTransaction = (sql: string): string => (
  sql.replace(/^BEGIN;\n?/, '').replace(/\n?COMMIT;\n?$/, '')
);
