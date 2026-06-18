import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS,
  twoHandVoicingCourseFixMigrationFilename,
} from './twoHandVoicingCourseFixMigrationSql';

const outDir = resolve(process.cwd(), 'supabase/migrations');
mkdirSync(outDir, { recursive: true });

for (const [index, part] of TWO_HAND_VOICING_COURSE_FIX_MIGRATION_PARTS.entries()) {
  const filename = twoHandVoicingCourseFixMigrationFilename(index, part.slug);
  const outPath = resolve(outDir, filename);
  writeFileSync(outPath, part.sql, 'utf8');
  process.stdout.write(`Wrote ${outPath} (${part.description})\n`);
}
