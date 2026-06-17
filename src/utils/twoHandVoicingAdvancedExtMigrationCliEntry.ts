import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingAdvancedExtMigrationSql } from './twoHandVoicingAdvancedExtMigrationSql';

const sql = generateTwoHandVoicingAdvancedExtMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260621130000_two_hand_voicing_advanced_phase2.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
