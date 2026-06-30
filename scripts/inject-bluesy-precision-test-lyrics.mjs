/**
 * Bluesy Licks フレーズ1: 精密モード開発テスト用に verse 1 歌詞を挿入する。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUT_DIR } from './bluesy-licks-config.mjs';

const SOURCE = join(OUT_DIR, 'bluesy-licks-01-240_loop4_ci.musicxml');
const TARGET = join(OUT_DIR, 'bluesy-licks-01-120_slow_precision_lyrics.musicxml');

/** 各8小節ループ先頭（measure 2 = 1周目本編） */
const LYRIC_BY_MEASURE = new Map([
  [2, 'Fブルース・リック1'],
  [10, '2周目'],
  [18, '3周目'],
  [26, '4周目'],
]);

const LYRIC_BLOCK = (text) => `
        <lyric number="1">
          <syllabic>single</syllabic>
          <text>${text}</text>
        </lyric>`;

/**
 * @param {string} measureBody
 * @param {string} text
 */
function injectFirstPitchLyric(measureBody, text) {
  const noteMatch = measureBody.match(/<note(?![^>]*<chord)[^>]*>[\s\S]*?<pitch>[\s\S]*?<\/note>/);
  if (!noteMatch) {
    return measureBody;
  }
  const noteXml = noteMatch[0];
  if (noteXml.includes('<lyric')) {
    return measureBody;
  }
  const withLyric = noteXml.replace('</pitch>', `</pitch>${LYRIC_BLOCK(text)}`);
  return measureBody.replace(noteXml, withLyric);
}

const xml = readFileSync(SOURCE, 'utf8');
const updated = xml.replace(
  /<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g,
  (full, numStr, body) => {
    const num = Number(numStr);
    const text = LYRIC_BY_MEASURE.get(num);
    if (!text) {
      return full;
    }
    const newBody = injectFirstPitchLyric(body, text);
    return full.replace(body, newBody);
  },
);

writeFileSync(TARGET, updated, 'utf8');
process.stdout.write(`Wrote ${TARGET}\n`);
