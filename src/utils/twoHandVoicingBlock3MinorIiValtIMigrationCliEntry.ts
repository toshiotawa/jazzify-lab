import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generateTwoHandVoicingBlock3MinorIiValtIMigrationSql } from './twoHandVoicingBlock3MinorIiValtIMigrationSql';

const sql = generateTwoHandVoicingBlock3MinorIiValtIMigrationSql();
const outPath = resolve(
  process.cwd(),
  'supabase/migrations/20260620130000_two_hand_voicing_block3_lesson8_minor_ii_valt_i.sql',
);
writeFileSync(outPath, sql, 'utf8');
process.stdout.write(`Wrote ${outPath}\n`);
