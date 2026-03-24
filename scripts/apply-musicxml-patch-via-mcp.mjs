#!/usr/bin/env node
/**
 * MusicXML パッチを Supabase execute_sql 経由で適用する。
 * 1 レンジ（12ステージ）ずつ UPDATE を実行。
 *
 * Usage: node scripts/apply-musicxml-patch-via-mcp.mjs
 *
 * 環境変数:
 *   SUPABASE_ACCESS_TOKEN  – Supabase Management API のアクセストークン
 *   SUPABASE_PROJECT_REF   – プロジェクト参照ID（省略時は URL から推定）
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'tfjubyqveoivwfmqeoij';

const KEYS = ['c','f','bb','eb','ab','db','gb','b','e','a','d','g'];
const RANGES = [
  { label: '1-5',   fileXml: '01-05' },
  { label: '6-10',  fileXml: '06-10' },
  { label: '11-15', fileXml: '11-15' },
  { label: '16-20', fileXml: '16-20' },
  { label: '21-25', fileXml: '21-25' },
  { label: '26-30', fileXml: '26-30' },
  { label: '31-35', fileXml: '31-35' },
  { label: '36-40', fileXml: '36-40' },
  { label: '41-45', fileXml: '41-45' },
  { label: '46-50', fileXml: '46-50' },
];

async function executeSql(sql) {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN is required');

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
    throw new Error(`Supabase API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function main() {
  let ok = 0;
  let fail = 0;

  for (const range of RANGES) {
    const xmlPath = resolve(
      __dirname, '..', 'public', 'II-V-I_1-50',
      `II-V 50 - ${range.fileXml}.musicxml`
    );
    const xml = readFileSync(xmlPath, 'utf8');

    const idList = KEYS.map(k =>
      `uuid_generate_v5('${NS}'::uuid, 'st-${k}-${range.label}')`
    ).join(',\n  ');

    const sql = `UPDATE public.fantasy_stages
SET music_xml = $musicxml$${xml}$musicxml$
WHERE id IN (
  ${idList}
);`;

    process.stdout.write(`range ${range.label} (${(sql.length / 1024).toFixed(0)} KB) ... `);
    try {
      await executeSql(sql);
      ok += 12;
      console.log('OK');
    } catch (e) {
      fail += 12;
      console.log(`ERR: ${e.message}`);
    }
  }

  console.log(`\nDone. updated=${ok}  errors=${fail}`);
}

main().catch(e => { console.error(e); process.exit(1); });
