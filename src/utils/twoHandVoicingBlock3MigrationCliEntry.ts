import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingBlock3MigrationSql } from './twoHandVoicingBlock3MigrationSql';

const sql = generateTwoHandVoicingBlock3MigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260618120000_two_hand_voicing_block3_drop2_resolution.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
