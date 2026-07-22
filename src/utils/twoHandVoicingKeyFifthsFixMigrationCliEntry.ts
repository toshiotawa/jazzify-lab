/**
 * 両手ヴォイシング: phrase.key_fifths / バトル chord 時刻 / b2-q1 BAB デモ 修正 SQL を stdout へ出力。
 * 実行例: npx tsx src/utils/twoHandVoicingKeyFifthsFixMigrationCliEntry.ts
 */
import { buildDrop2IIVIBABDemoScript } from '@/components/survival/tutorial/buildDrop2IIVIBABDemoScript';
import {
  TWO_HAND_VOICING_BLOCK_META,
  TWO_HAND_VOICING_LESSONS,
  TWO_HAND_VOICING_UUID_NS,
  buildQuizItemsForLesson,
  buildVoicingPhrasesForLesson,
  getLessonKey,
} from '@/utils/twoHandVoicingIntermediateCourse';

const sqlEscape = (value: string): string => value.replace(/'/g, "''");
const sqlString = (value: string): string => `'${sqlEscape(value)}'`;
const uuidV5 = (key: string): string => (
  `uuid_generate_v5('${TWO_HAND_VOICING_UUID_NS}'::uuid, ${sqlString(key)})`
);

const lines: string[] = [
  '-- 両手ヴォイシング中級: key_fifths UPSERT 漏れ修正 + phrase chord 時刻丸め + b2-q1 BAB デモ',
  'BEGIN;',
  '',
];

for (const lesson of TWO_HAND_VOICING_LESSONS) {
  const form = TWO_HAND_VOICING_BLOCK_META[lesson.blockNumber].form;

  if (!lesson.isSummary) {
    const stageKey = `${getLessonKey(lesson)}-voicing`;
    const phrases = buildVoicingPhrasesForLesson(lesson, form);
    const stageKeyFifths = phrases[0]?.keyFifths ?? 0;

    lines.push(
      `UPDATE public.ear_training_stages SET key_fifths = ${stageKeyFifths}, updated_at = now()`,
      `WHERE id = ${uuidV5(stageKey)};`,
      '',
    );

    for (const phrase of phrases) {
      const phraseKey = `${stageKey}-ph${phrase.phraseIndex}`;
      lines.push(
        `UPDATE public.ear_training_phrases SET key_fifths = ${phrase.keyFifths}, updated_at = now()`,
        `WHERE id = ${uuidV5(phraseKey)};`,
        '',
      );

      for (const chordRow of phrase.chords) {
        const chordKey = `${phraseKey}-c${chordRow.orderIndex}`;
        lines.push(
          'UPDATE public.ear_training_phrase_chords SET',
          `  start_time_sec = ${chordRow.startTimeSec},`,
          `  end_time_sec = ${chordRow.endTimeSec}`,
          `WHERE id = ${uuidV5(chordKey)};`,
        );
      }
      lines.push('');
    }
  }

  const quizStageKey = `${getLessonKey(lesson)}-quiz`;
  const quizItems = buildQuizItemsForLesson(lesson, form);
  for (const item of quizItems) {
    lines.push(
      `UPDATE public.ear_training_chord_quiz_items SET key_fifths = ${item.keyFifths}, updated_at = now()`,
      `WHERE stage_id = ${uuidV5(quizStageKey)} AND order_index = ${item.orderIndex};`,
    );
  }
  lines.push('');
}

const babScript = sqlEscape(JSON.stringify(buildDrop2IIVIBABDemoScript()));
lines.push(
  'UPDATE public.survival_tutorial_scripts SET',
  `  script = '${babScript}'::jsonb,`,
  '  updated_at = now()',
  "WHERE id = 'thvi-demo-b2-q1';",
  '',
  'COMMIT;',
  '',
);

process.stdout.write(lines.join('\n'));
