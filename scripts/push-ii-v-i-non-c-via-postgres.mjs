#!/usr/bin/env node
/**
 * PostgreSQL に直接接続して、II-V-I 非 C キー 110 ステージ分の SQL を実行する。
 * api.supabase.com（Management API）や Personal Access Token は不要。
 *
 * 接続 URI の取得: Supabase Dashboard → Project Settings → Database
 * → Connection string → URI（パスワードは同画面の Database password）
 *
 * 長い UPDATE が多いので、Transaction pooler（:6543）より Session mode（:5432）や
 * Direct connection の URI の方が無難な場合があります。
 *
 *   export DATABASE_URL="postgresql://postgres.[ref]:[PASSWORD]@aws-0-....pooler.supabase.com:5432/postgres"
 *   node scripts/push-ii-v-i-non-c-via-postgres.mjs --dir supabase/patches/ii_v_i_non_c_mcp
 *
 * 環境変数（いずれか）: DATABASE_URL / SUPABASE_DB_URL / POSTGRES_URL
 */
import { readFileSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dirArg =
  di !== -1 && args[di + 1]
    ? args[di + 1]
    : 'supabase/patches/ii_v_i_non_c_singles';
const dir = resolve(__dirname, '..', dirArg);

function getConnectionString() {
  return (
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.POSTGRES_URL ||
    ''
  );
}

async function main() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error(
      'DATABASE_URL（または SUPABASE_DB_URL / POSTGRES_URL）を設定してください。\n' +
        '取得: Dashboard → Project Settings → Database → Connection string（URI）'
    );
    process.exit(1);
  }

  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  if (files.length !== 110) {
    console.error(
      `想定 110 件ですが ${files.length} 件です。--dir で patches ディレクトリを確認してください。`
    );
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  let ok = 0;
  try {
    for (const f of files) {
      const sql = readFileSync(resolve(dir, f), 'utf8');
      process.stdout.write(`${f} (${(sql.length / 1024).toFixed(0)} KB) ... `);
      await client.query(sql);
      console.log('OK');
      ok++;
    }
  } finally {
    await client.end();
  }
  console.log(`\n完了: ${ok} ステージを更新しました。`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
