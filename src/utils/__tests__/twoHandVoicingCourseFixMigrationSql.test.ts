import {
  TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS,
  twoHandVoicingCourseFixMigrationFilename,
} from '@/utils/twoHandVoicingCourseFixMigrationSql';

describe('twoHandVoicingCourseFixMigrationSql', () => {
  it('8 分割パートを生成する（SQL Editor サイズ上限回避）', () => {
    expect(TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS).toHaveLength(8);
    expect(TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS[0]?.slug).toBe('schema');
    expect(TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS[0]?.sql).toContain('key_fifths');
    expect(TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS[1]?.sql).toContain('BEGIN;');
    expect(TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS[1]?.sql).toContain('COMMIT;');
  });

  it('ファイル名は連番タイムスタンプ + slug', () => {
    expect(twoHandVoicingCourseFixMigrationFilename(0, 'schema')).toBe(
      '20260624120100_two_hand_voicing_course_fix_schema.sql',
    );
    expect(twoHandVoicingCourseFixMigrationFilename(7, 'advanced_phase2')).toBe(
      '20260624120800_two_hand_voicing_course_fix_advanced_phase2.sql',
    );
  });

  it('各データパートは quiz item INSERT に key_fifths を含む', () => {
    for (const part of TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS.slice(1)) {
      expect(part.sql).toContain('key_fifths');
    }
    const intermediate = TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS.find(
      (part) => part.slug === 'intermediate',
    );
    expect(intermediate?.sql).toContain('バトル');
  });
});
