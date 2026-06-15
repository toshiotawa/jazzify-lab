import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const query = readFileSync(
  join(ROOT, 'supabase', 'migrations', '20260615153000_mq_block1_osmd_count_in_update.sql'),
  'utf8',
).replace(/^--[^\n]*\n/, '');

process.stdout.write(JSON.stringify({ name: 'mq_block1_osmd_count_in_update', query }));
