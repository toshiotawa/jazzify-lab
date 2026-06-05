import { Note } from 'tonal';
import { generateNotationCourseMigrationSql } from './notationCourseMigrationSql';

const parseMidi = (noteName: string): number | null => {
  const midi = Note.midi(noteName.trim());
  return typeof midi === 'number' && Number.isFinite(midi) ? midi : null;
};

const phase = process.argv[2] ?? '1';

const sql = phase === '2'
  ? generateNotationCourseMigrationSql(
    {
      blockNumbers: [5, 6, 7, 8, 9, 10, 11, 12],
      migrationComment: '音符の読み方コース: ブロック5〜12（ヘ音・大譜表・臨時記号・ファイナル）',
    },
    parseMidi,
  )
  : generateNotationCourseMigrationSql(
    {
      blockNumbers: [1, 2, 3, 4],
      migrationComment: '音符の読み方コース: ブロック1〜4（ト音記号）',
    },
    parseMidi,
  );

process.stdout.write(sql);
