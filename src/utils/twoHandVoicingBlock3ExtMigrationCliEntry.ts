import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingBlock3ExtMigrationSql } from './twoHandVoicingBlock3MigrationSql';

const sql = generateTwoHandVoicingBlock3ExtMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260620120000_two_hand_voicing_block3_lessons567.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
