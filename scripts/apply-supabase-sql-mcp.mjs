#!/usr/bin/env node
/**
 * Supabase Management API (MCP execute_sql 相当) で SQL を実行する。
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-supabase-sql-mcp.mjs supabase/migrations/20260804230000_code_run_chikuwa_ashiba_platform.sql
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';

async function executeSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN が未設定です（Dashboard → Account → Access Tokens の sbp_...）',
    );
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

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase API ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: node scripts/apply-supabase-sql-mcp.mjs <path-to.sql>');
    process.exit(1);
  }

  const sqlPath = resolve(process.cwd(), fileArg);
  const sql = readFileSync(sqlPath, 'utf8');
  const sizeKb = (Buffer.byteLength(sql, 'utf8') / 1024).toFixed(1);
  process.stdout.write(`Applying ${fileArg} (${sizeKb} KB) to ${PROJECT_REF} ... `);

  const result = await executeSql(sql);
  console.log('OK');
  if (result && typeof result === 'object') {
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
