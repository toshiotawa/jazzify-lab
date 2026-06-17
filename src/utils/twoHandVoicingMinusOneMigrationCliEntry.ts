import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingMinusOneMigrationSql } from './twoHandVoicingMinusOneMigrationSql';

const sql = generateTwoHandVoicingMinusOneMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260622120000_two_hand_voicing_minus_one_audio.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
