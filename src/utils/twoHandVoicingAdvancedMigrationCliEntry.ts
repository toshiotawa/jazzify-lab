import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingAdvancedMigrationSql } from './twoHandVoicingAdvancedMigrationSql';

const sql = generateTwoHandVoicingAdvancedMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260621120000_two_hand_voicing_advanced_phase1.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
