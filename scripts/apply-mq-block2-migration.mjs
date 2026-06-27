#!/usr/bin/env node
/**
 * MQ Block2 マイグレーションを Supabase Management API 経由で適用する。
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-mq-block2-migration.mjs
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const SQL_PATH = join(ROOT, 'supabase', 'migrations', '20260625120000_mq_block2_motif.sql');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN が必要です');
    process.exit(1);
  }
  const sql = readFileSync(SQL_PATH, 'utf8');
  console.log(`Applying mq_block2_motif (${(sql.length / 1024).toFixed(0)} KB)...`);
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    },
  );
  const text = await res.text();
  if (!res.ok) {
    console.error(`API ${res.status}: ${text.slice(0, 500)}`);
    process.exit(1);
  }
  console.log('OK');
  if (text.trim()) {
    console.log(text.slice(0, 500));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
