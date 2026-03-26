#!/usr/bin/env node
/**
 * music_xml 用 UPDATE を chunkSize 文字ごとに分割し、MCP execute_sql の小さなクエリにする。
 * 各ステージ: CLEAR + (N 回の || 連結)
 *
 *   node scripts/generate-ii-v-i-chunked-sql.mjs --out supabase/patches/ii_v_i_non_c_chunks
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const NS = 'a0000000-0000-4000-8000-000000000001';

const KEYS = [
  { slug: 'c', suffix: 'C' },
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

const KEYS_NON_C = KEYS.filter((k) => k.slug !== 'c');

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
  console.error('Usage: node scripts/generate-ii-v-i-chunked-sql.mjs --out DIR [--chunk-size 18000]');
  process.exit(1);
}
const outDir = resolve(args[oi + 1]);
const csi = args.indexOf('--chunk-size');
const chunkSize = csi !== -1 ? parseInt(args[csi + 1], 10) || 18000 : 18000;

mkdirSync(outDir, { recursive: true });

let totalFiles = 0;
for (const range of RANGES) {
  for (const k of KEYS_NON_C) {
    const rel = `II-V 50 - ${range.fileXml}_${k.suffix}.musicxml`;
    const xmlPath = resolve(__dirname, '..', 'public', 'II-V-I_1-50', rel);
    const xml = compactMusicXml(readFileSync(xmlPath, 'utf8'));
    const chunks = splitChunks(xml, chunkSize);
    const stageId = `uuid_generate_v5('${NS}'::uuid, 'st-${k.slug}-${range.label}')`;
    const base = `st_${k.slug}_${range.fileXml.replace(/-/g, '_')}`;

    const clear = `UPDATE public.fantasy_stages SET music_xml = '' WHERE id = ${stageId};`;
    writeFileSync(resolve(outDir, `${base}_00_clear.sql`), clear, 'utf8');
    totalFiles++;

    chunks.forEach((chunk, idx) => {
      const tag = `xm${idx}`;
      const q = `UPDATE public.fantasy_stages SET music_xml = music_xml || $${tag}$${chunk}$${tag}$ WHERE id = ${stageId};`;
      const n = String(idx + 1).padStart(2, '0');
      writeFileSync(resolve(outDir, `${base}_${n}_append.sql`), q, 'utf8');
      totalFiles++;
    });
  }
}

console.error(`wrote ${totalFiles} chunk SQL files under ${outDir}`);
