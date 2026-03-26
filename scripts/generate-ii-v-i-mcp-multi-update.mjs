#!/usr/bin/env node
/**
 * 1 ステージ = 1 ファイル = 複数 UPDATE を 1 クエリにまとめる（各 XML を partSize 文字で分割し || 連結）。
 * MCP execute_sql 1 回あたり ~75KB 程度に抑える。
 *
 *   node scripts/generate-ii-v-i-mcp-multi-update.mjs --out supabase/patches/ii_v_i_non_c_mcp
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { slug: 'f', suffix: '+5st_F' },
  { slug: 'bb', suffix: '-2st_Bb' },
  { slug: 'eb', suffix: '+3st_Eb' },
  { slug: 'ab', suffix: '-4st_Ab' },
  { slug: 'db', suffix: '+1st_Db' },
  { slug: 'gb', suffix: '+6st_Gb' },
  { slug: 'b', suffix: '-1st_B' },
  { slug: 'e', suffix: '+4st_E' },
  { slug: 'a', suffix: '-3st_A' },
  { slug: 'd', suffix: '+2st_D' },
  { slug: 'g', suffix: '-5st_G' },
];

const RANGES = [
  { label: '1-5', fileXml: '01-05' },
  { label: '6-10', fileXml: '06-10' },
  { label: '11-15', fileXml: '11-15' },
  { label: '16-20', fileXml: '16-20' },
  { label: '21-25', fileXml: '21-25' },
  { label: '26-30', fileXml: '26-30' },
  { label: '31-35', fileXml: '31-35' },
  { label: '36-40', fileXml: '36-40' },
  { label: '41-45', fileXml: '41-45' },
  { label: '46-50', fileXml: '46-50' },
];

function compactMusicXml(raw) {
  return raw.replace(/>\s+</g, '><').trim();
}

function splitChunks(s, size) {
  const out = [];
  for (let i = 0; i < s.length; i += size) {
    out.push(s.slice(i, i + size));
  }
  return out;
}

const args = process.argv.slice(2);
const oi = args.indexOf('--out');
if (oi === -1 || !args[oi + 1]) {
  console.error('Usage: --out DIR [--part-size 28000]');
  process.exit(1);
}
const outDir = resolve(args[oi + 1]);
const psi = args.indexOf('--part-size');
const partSize = psi !== -1 ? parseInt(args[psi + 1], 10) || 28000 : 28000;

mkdirSync(outDir, { recursive: true });

let maxLen = 0;
let maxName = '';

for (const range of RANGES) {
  for (const k of KEYS) {
    const rel = `II-V 50 - ${range.fileXml}_${k.suffix}.musicxml`;
    const xmlPath = resolve(__dirname, '..', 'public', 'II-V-I_1-50', rel);
    const xml = compactMusicXml(readFileSync(xmlPath, 'utf8'));
    const chunks = splitChunks(xml, partSize);
    const stageId = `uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}')`;
    const tagBase = `xm_${randomBytes(16).toString('hex')}`;
    const lines = [
      `UPDATE public.fantasy_stages SET music_xml = '' WHERE id = ${stageId};`,
      ...chunks.map(
        (ch, i) => {
          const tag = `${tagBase}_${i}`;
          return `UPDATE public.fantasy_stages SET music_xml = music_xml || $${tag}$${ch}$${tag}$ WHERE id = ${stageId};`;
        }
      ),
    ];
    const sql = lines.join('\n');
    const name = `mcp_st_${k.slug}_${range.fileXml.replace(/-/g, '_')}.sql`;
    writeFileSync(resolve(outDir, name), sql, 'utf8');
    if (sql.length > maxLen) {
      maxLen = sql.length;
      maxName = name;
    }
  }
}

console.error(`wrote ${RANGES.length * KEYS.length} files, max ${maxLen} bytes (${maxName})`);
