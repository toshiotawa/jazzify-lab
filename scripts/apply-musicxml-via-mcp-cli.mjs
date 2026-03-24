#!/usr/bin/env node
/**
 * MusicXML パッチを Supabase に適用。
 * supabase/patches/ の SQL ファイルを読み、PostgREST rpc or direct SQL で実行。
 *
 * このスクリプトは Supabase CLI (`npx supabase db execute`) 経由で実行するか、
 * Management API 経由で実行する。
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/apply-musicxml-via-mcp-cli.mjs
 *   または --supabase-cli フラグで supabase CLI を使用
 */
import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';
const useCli = process.argv.includes('--supabase-cli');

const patchDir = resolve(__dirname, '..', 'supabase', 'patches');

async function executeSqlViaApi(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('Set SUPABASE_ACCESS_TOKEN env var (sbp_... personal access token from supabase.com/dashboard/account/tokens)');

  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

function executeSqlViaCli(sql) {
  const tmpFile = resolve(__dirname, '_tmp_patch.sql');
  writeFileSync(tmpFile, sql, 'utf8');
  try {
    execSync(`npx supabase db execute --project-ref ${PROJECT_REF} < "${tmpFile}"`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
  } finally {
    unlinkSync(tmpFile);
  }
}

async function main() {
  const files = readdirSync(patchDir)
    .filter(f => f.startsWith('patch_ii_v_i_musicxml_') && f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.error('No patch files found. Run: node scripts/patch-ii-v-i-musicxml.mjs --files');
    process.exit(1);
  }

  console.log(`Found ${files.length} patch files. Applying...`);
  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const sql = readFileSync(resolve(patchDir, file), 'utf8');
    const sizeKb = (sql.length / 1024).toFixed(0);
    process.stdout.write(`  ${file} (${sizeKb} KB) ... `);
    try {
      if (useCli) {
        executeSqlViaCli(sql);
      } else {
        await executeSqlViaApi(sql);
      }
      ok++;
      console.log('OK');
    } catch (e) {
      fail++;
      console.log(`ERR: ${e.message}`);
    }
  }

  console.log(`\nDone. applied=${ok}  errors=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
