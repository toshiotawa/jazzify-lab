import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingAdvancedKeyFifthsPatchMigrationSql } from './twoHandVoicingAdvancedKeyFifthsPatchMigrationSql';

const sql = generateTwoHandVoicingAdvancedKeyFifthsPatchMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260627160000_two_hand_voicing_advanced_key_fifths_fix.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
