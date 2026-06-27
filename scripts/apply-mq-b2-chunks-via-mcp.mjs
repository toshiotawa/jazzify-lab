#!/usr/bin/env node
/**
 * MQ Block2 マイグレーションをチャンクファイルから Supabase Management API 経由で適用。
 * MCP execute_sql と同等の API を使用（SUPABASE_ACCESS_TOKEN 必須）。
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-mq-b2-chunks-via-mcp.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const CHUNK_DIR = join(ROOT, '.cursor', 'mq_b2_chunks');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';

const CHUNK_ORDER = [
  'q1_osmd.sql',
  '00.sql',
  '01.sql',
  '02.sql',
  '03.sql',
  '04.sql',
  '05.sql',
  '07.sql',
  '08.sql',
];

async function executeSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN が必要です');
  }
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
    throw new Error(`API ${res.status}: ${text.slice(0, 500)}`);
  }
  return text;
}

async function main() {
  for (const file of CHUNK_ORDER) {
    const path = join(CHUNK_DIR, file);
    let sql = readFileSync(path, 'utf8');
    sql = sql.replace(/\nCOMMIT;\s*$/, '');
    process.stdout.write(`Applying ${file} (${(sql.length / 1024).toFixed(1)} KB)... `);
    await executeSql(sql);
    console.log('OK');
  }
  console.log('All chunks applied.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
