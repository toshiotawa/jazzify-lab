import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingIntermediateMigrationSql } from './twoHandVoicingIntermediateMigrationSql';

const sql = generateTwoHandVoicingIntermediateMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260617120000_two_hand_voicing_intermediate_course.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
