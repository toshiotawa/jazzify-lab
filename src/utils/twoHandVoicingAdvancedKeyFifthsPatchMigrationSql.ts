/**
 * 両手ヴォイシング上級 — key_fifths 差分 UPDATE マイグレーション SQL 生成。
 */
import {
  TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
  TWO_HAND_VOICING_ADVANCED_LESSONS,
  buildAdvancedQuizItems,
  buildAdvancedSurvivalProgression,
  getAdvancedStageKey,
  resolveAdvancedSurvivalStageNumberForProgression,
  type TwoHandVoicingAdvancedLessonSpec,
} from './twoHandVoicingAdvancedCourse';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const sqlJson = (value: unknown): string => `'${sqlEscape(JSON.stringify(value))}'::jsonb`;

const TWO_HAND_VOICING_ADVANCED_UUID_NS = 'a0000000-0000-4000-8000-000000000002';

const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_ADVANCED_UUID_NS}'::uuid, ${sqlString(key)})`
);

const ALL_LESSONS: readonly TwoHandVoicingAdvancedLessonSpec[] = [
  ...TWO_HAND_VOICING_ADVANCED_LESSONS,
  ...TWO_HAND_VOICING_ADVANCED_EXT_LESSONS,
];

const KEY_FIFTHS_CATEGORIES = new Set(['m7', 'mM7', 'm7b5', '7alt', '7(#11)']);

export const generateTwoHandVoicingAdvancedKeyFifthsPatchMigrationSql = (): string => {
  const lines: string[] = [
    '-- 両手ヴォイシング上級: key_fifths 機能度数修正 (Im7 / ImM7 / IIm7b5 / bVII7 / V7alt)',
    'BEGIN;',
    '',
  ];

  for (const lesson of ALL_LESSONS) {
    if (!KEY_FIFTHS_CATEGORIES.has(lesson.category)) {
      continue;
    }

    for (const progression of lesson.progressions) {
      const quizStageKey = getAdvancedStageKey(lesson, progression, 'quiz');
      const quizStageUuid = uuidV5(quizStageKey);
      const items = buildAdvancedQuizItems(progression, lesson.category);

      for (const item of items) {
        lines.push(
          'UPDATE public.ear_training_chord_quiz_items',
          `SET key_fifths = ${item.keyFifths}, updated_at = now()`,
          `WHERE stage_id = ${quizStageUuid}`,
          `  AND order_index = ${item.orderIndex};`,
        );
      }

      if (!progression.isSummary) {
        const voicingStageKey = getAdvancedStageKey(lesson, progression, 'voicing');
        const phraseUuid = uuidV5(`${voicingStageKey}-ph0`);
        const firstKeyFifths = items[0]?.keyFifths ?? 0;
        lines.push(
          'UPDATE public.ear_training_phrases',
          `SET key_fifths = ${firstKeyFifths}, updated_at = now()`,
          `WHERE id = ${phraseUuid};`,
          '',
        );
      }

      const survivalStageNumber = resolveAdvancedSurvivalStageNumberForProgression(lesson, progression);

      const survivalChords = buildAdvancedSurvivalProgression(progression, lesson.category);
      lines.push(
        'UPDATE public.survival_stages',
        `SET chord_progression = ${sqlJson(survivalChords)}, updated_at = now()`,
        "WHERE map_category = 'lesson'",
        `  AND stage_number = ${survivalStageNumber};`,
        '',
      );
    }
  }

  lines.push('COMMIT;', '');
  return lines.join('\n');
};
