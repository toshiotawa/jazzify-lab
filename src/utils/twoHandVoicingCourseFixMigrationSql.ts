/**
 * 両手ヴォイシング中級・上級コース修正 — Supabase マイグレーション SQL 生成。
 * Supabase SQL Editor のサイズ上限を避けるため、複数ファイルに分割する。
 */
import { generateTwoHandVoicingAdvancedExtMigrationSql } from './twoHandVoicingAdvancedExtMigrationSql';
import { generateTwoHandVoicingAdvancedMigrationSql } from './twoHandVoicingAdvancedMigrationSql';
import { generateTwoHandVoicingBlock3ExtMigrationSql } from './twoHandVoicingBlock3MigrationSql';
import { generateTwoHandVoicingBlock3IiValtIMigrationSql } from './twoHandVoicingBlock3IiValtIMigrationSql';
import { generateTwoHandVoicingBlock3MigrationSql } from './twoHandVoicingBlock3MigrationSql';
import { generateTwoHandVoicingBlock3MinorIiValtIMigrationSql } from './twoHandVoicingBlock3MinorIiValtIMigrationSql';
import { generateTwoHandVoicingIntermediateMigrationSql } from './twoHandVoicingIntermediateMigrationSql';

export interface TwoHandVoicingCourseFixMigrationPart {
  readonly slug: string;
  readonly description: string;
  readonly sql: string;
}

export const TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS: readonly TwoHandVoicingCourseFixMigrationPart[] = [
  {
    slug: 'schema',
    description: 'ear_training_chord_quiz_items.key_fifths カラム追加',
    sql: [
      '-- 両手ヴォイシングコース修正 (1/8): schema',
      'BEGIN;',
      '',
      'ALTER TABLE public.ear_training_chord_quiz_items',
      '  ADD COLUMN IF NOT EXISTS key_fifths smallint NOT NULL DEFAULT 0;',
      '',
      'COMMIT;',
    ].join('\n'),
  },
  {
    slug: 'intermediate',
    description: '中級 Drop2 II-V-I（key_fifths / まとめ251 / バトル表記）',
    sql: generateTwoHandVoicingIntermediateMigrationSql(),
  },
  {
    slug: 'block3',
    description: '中級 Block3 Drop2 Resolution（M7/m7/7alt 等）',
    sql: generateTwoHandVoicingBlock3MigrationSql(),
  },
  {
    slug: 'block3_ext',
    description: '中級 Block3 レッスン5–7',
    sql: generateTwoHandVoicingBlock3ExtMigrationSql(),
  },
  {
    slug: 'block3_ii_valt_i',
    description: '中級 Block3 II-Valt-I',
    sql: generateTwoHandVoicingBlock3IiValtIMigrationSql(),
  },
  {
    slug: 'block3_minor_ii_valt_i',
    description: '中級 Block3 マイナー II-Valt-I',
    sql: generateTwoHandVoicingBlock3MinorIiValtIMigrationSql(),
  },
  {
    slug: 'advanced_phase1',
    description: '上級フェーズ1（So What / UST / メジャー II-V-I）',
    sql: generateTwoHandVoicingAdvancedMigrationSql(),
  },
  {
    slug: 'advanced_phase2',
    description: '上級フェーズ2（mM7 / m7b5 / 7#11 / マイナー II-V-I）',
    sql: generateTwoHandVoicingAdvancedExtMigrationSql(),
  },
];

export const twoHandVoicingCourseFixMigrationFilename = (
  partIndex: number,
  slug: string,
): string => {
  const sequence = String(partIndex + 1).padStart(2, '0');
  return `2026062412${sequence}00_two_hand_voicing_course_fix_${slug}.sql`;
};
