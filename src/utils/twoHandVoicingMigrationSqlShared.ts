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

export const stripMigrationTransaction = (sql: string): string => (
  sql.replace(/^BEGIN;\n?/, '').replace(/\n?COMMIT;\n?$/, '')
);
