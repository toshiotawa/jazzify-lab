#!/usr/bin/env node
/**
 * Bluesy Licks マイグレーションをチャンクから Supabase Management API 経由で適用。
 * MCP execute_sql / apply_migration と同等（SUPABASE_ACCESS_TOKEN 必須）。
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-bluesy-licks-chunks-via-mcp.mjs
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const CHUNK_DIR = join(ROOT, '.cursor', 'bl_chunks');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';

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
  const files = readdirSync(CHUNK_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  for (const file of files) {
    const sql = readFileSync(join(CHUNK_DIR, file), 'utf8').replace(/;\s*$/, '');
    process.stdout.write(`Applying ${file} (${(sql.length / 1024).toFixed(1)} KB)... `);
    await executeSql(sql);
    console.log('OK');
  }
  console.log('All Bluesy Licks chunks applied.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
