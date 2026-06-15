/**
 * 既存マイグレーションから OSMD チュートリアル script ブロックを抽出してパッチ SQL を生成する。
 * 生成結果は script JSON 全体を上書きする。stage フラグは生成元 SQL に含めること。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const src = join(ROOT, 'supabase', 'migrations', '20260615120000_mq_block1_c_blues_developer_test.sql');
const out = join(ROOT, 'supabase', 'migrations', '20260615153000_mq_block1_osmd_count_in_update.sql');
const sql = readFileSync(src, 'utf8');
const blocks = [];

for (const id of ['mq-b1-q1-osmd-v1', 'mq-b1-q3-osmd-v1']) {
  const marker = `INSERT INTO public.ear_training_tutorial_scripts`;
  const start = sql.indexOf(marker, sql.indexOf(`'${id}'`) - 200);
  const end = sql.indexOf('updated_at = now();', start) + 'updated_at = now();'.length;
  if (start < 0 || end < start) {
    throw new Error(`missing block for ${id}`);
  }
  blocks.push(sql.slice(start, end));
}

const patch = `-- OSMD count-in assets update (mq-b1-q1-osmd-v1, mq-b1-q3-osmd-v1)\nBEGIN;\n\n${blocks.join('\n\n')}\n\nCOMMIT;\n`;
writeFileSync(out, patch, 'utf8');
process.stdout.write(`Wrote ${out} (${patch.length} bytes)\n`);
