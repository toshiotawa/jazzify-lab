#!/usr/bin/env node
/**
 * II-V-I 非 C キー 110 ステージの music_xml を、生成済み SQL ファイルから一括適用する。
 * Cursor の Supabase MCP `execute_sql` と同じ Management API を使用する。
 * PAT が使えない場合は `scripts/push-ii-v-i-non-c-via-postgres.mjs`（DATABASE_URL）を使う。
 *
 *   SUPABASE_ACCESS_TOKEN=<アカウントの PAT> node scripts/push-ii-v-i-non-c-singles.mjs
 *   SUPABASE_ACCESS_TOKEN=<PAT> node scripts/push-ii-v-i-non-c-singles.mjs --dir supabase/patches/ii_v_i_non_c_mcp
 *
 * 生成:
 *   node scripts/apply-ii-v-i-non-c-musicxml-batches.mjs --write-singles supabase/patches/ii_v_i_non_c_singles
 *   node scripts/generate-ii-v-i-mcp-multi-update.mjs --out supabase/patches/ii_v_i_non_c_mcp
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';
const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dirArg =
  di !== -1 && args[di + 1]
    ? args[di + 1]
    : 'supabase/patches/ii_v_i_non_c_singles';
const dir = resolve(__dirname, '..', dirArg);

function assertManagementApiToken(token) {
  if (token.startsWith('sb_secret_') || token.startsWith('sb_publishable_')) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN にプロジェクト用の sb_secret_ / sb_publishable_ を使っています。' +
        'このスクリプトは api.supabase.com（Management API）向けで、' +
        'アカウントの Personal Access Token（通常は sbp_ で始まる）が必要です。' +
        '発行: https://supabase.com/dashboard/account/tokens'
    );
  }
}

async function executeSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error('SUPABASE_ACCESS_TOKEN が未設定です（Dashboard → Account → Access Tokens）');
  }
  assertManagementApiToken(token);
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

async function main() {
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length !== 110) {
    console.error(
      `想定 110 件ですが ${files.length} 件です。--write-singles または generate-ii-v-i-mcp-multi-update.mjs を先に実行してください。`
    );
    process.exit(1);
  }
  let ok = 0;
  for (const f of files) {
    const sql = readFileSync(resolve(dir, f), 'utf8');
    process.stdout.write(`${f} (${(sql.length / 1024).toFixed(0)} KB) ... `);
    try {
      await executeSql(sql);
      console.log('OK');
      ok++;
    } catch (e) {
      console.log(`ERR: ${e.message}`);
      process.exit(1);
    }
  }
  console.log(`\n完了: ${ok} ステージを更新しました。`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
