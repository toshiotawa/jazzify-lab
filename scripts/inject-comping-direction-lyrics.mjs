/**
 * Comping MusicXML: `<direction><words>` 表現テキストを精密モード歌詞レイヤー用 `<lyric>` に複製する。
 * - 改行は verse 1〜4 に分割（同一 verse 内の改行は使わない）
 * - 注入済み `<direction>` は除去（words レイアウトとの二重表示を防ぐ）
 * - 2 段目 staff-distance を歌詞 4 レーン分に拡大
 *
 * Usage:
 *   node scripts/inject-comping-direction-lyrics.mjs [source.musicxml] [target.musicxml]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve(
  process.cwd(),
  process.argv[2] ?? 'public/sozai/Comping/Donna Lee Comping.musicxml',
);
const TARGET = resolve(
  process.cwd(),
  process.argv[3] ?? 'public/sozai/Comping/Donna Lee Comping precision_lyrics.musicxml',
);

/** 2 段譜の段間（tenths）。歌詞 4 レーン + OSMD 余白向け。 */
const STAFF_DISTANCE_TENTHS = '176';

/** @param {string} text */
const escapeXmlText = (text) => (
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
);

/** @param {string} text */
const decodeXmlText = (text) => (
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
);

/** @param {string} text */
const normalizeLyricText = (text) => text.replace(/\r\n/g, '\n').trim();

/** Finale 歌詞のスペース代替「.」を半角スペースへ（拡張 `(9.13)` 等の digit.digit は維持）。 */
/** @param {string} text */
const replaceFinaleLyricDots = (text) => text.replace(/(?<!\d)\.(?!\d)/g, ' ');

/** @param {string} xml */
const replaceLyricDotsInXml = (xml) => (
  xml.replace(
    /(<lyric\b[^>]*>[\s\S]*?<text\b[^>]*>)([\s\S]*?)(<\/text>)/g,
    (_full, open, textContent, close) => `${open}${replaceFinaleLyricDots(textContent)}${close}`,
  )
);

/** @param {string} directionBlock */
const wordsTextFromDirection = (directionBlock) => {
  const match = directionBlock.match(/<words\b[^>]*>([\s\S]*?)<\/words>/);
  if (!match) {
    return null;
  }
  const normalized = normalizeLyricText(decodeXmlText(match[1]));
  return normalized.length > 0 ? normalized : null;
};

/** @param {string} text */
const lyricLinesFromText = (text) => (
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 4)
);

/** @param {string} noteXml @param {string} text */
const injectLyricIntoNote = (noteXml, text) => {
  if (noteXml.includes('<lyric')) {
    return noteXml;
  }
  const lines = lyricLinesFromText(replaceFinaleLyricDots(text));
  if (lines.length === 0) {
    return noteXml;
  }
  const lyricBlocks = lines.map((line, index) => {
    const verseNumber = index + 1;
    const escaped = escapeXmlText(line);
    return `<lyric number="${verseNumber}"><syllabic>single</syllabic><text>${escaped}</text></lyric>`;
  }).join('');
  if (/<\/staff>/.test(noteXml)) {
    return noteXml.replace(/(\s*<\/staff>)/, `$1${lyricBlocks}`);
  }
  return noteXml.replace(/(\s*)<\/note>/, `${lyricBlocks}$1</note>`);
};

/** @param {string} measureBody */
const injectLyricsFromDirectionsInMeasure = (measureBody) => {
  let updated = measureBody;
  const directionRegex = /<direction[\s\S]*?<\/direction>/g;
  for (const dirMatch of measureBody.matchAll(directionRegex)) {
    const dirBlock = dirMatch[0];
    const lyricText = wordsTextFromDirection(dirBlock);
    if (!lyricText) {
      continue;
    }
    const afterDir = measureBody.slice(dirMatch.index + dirBlock.length);
    const noteMatch = afterDir.match(
      /<note(?=[^>]*>[\s\S]*?<pitch>)(?![^>]*\bchord\b)[^>]*>[\s\S]*?<\/note>/,
    );
    if (noteMatch) {
      const noteXml = noteMatch[0];
      const injected = injectLyricIntoNote(noteXml, lyricText);
      if (injected !== noteXml) {
        updated = updated.replace(noteXml, injected);
      }
    }
    updated = updated.replace(dirBlock, '');
  }
  return updated;
};

/** @param {string} xml */
const widenInterStaffDistance = (xml) => (
  xml.replace(
    /(<staff-layout number="2">\s*<staff-distance>)\d+(<\/staff-distance>)/g,
    `$1${STAFF_DISTANCE_TENTHS}$2`,
  )
);

let sourceXml = readFileSync(SOURCE, 'utf8');
sourceXml = replaceLyricDotsInXml(sourceXml);
writeFileSync(SOURCE, sourceXml, 'utf8');

let xml = sourceXml;
xml = widenInterStaffDistance(xml);
const updated = xml.replace(
  /<measure number="(\d+)"[^>]*>([\s\S]*?)<\/measure>/g,
  (full, _numStr, body) => {
    const newBody = injectLyricsFromDirectionsInMeasure(body);
    if (newBody === body) {
      return full;
    }
    return full.replace(body, newBody);
  },
);

writeFileSync(TARGET, updated, 'utf8');
const measureCount = (updated.match(/<measure number="/g) ?? []).length;
const lyricCount = (updated.match(/<lyric number="/g) ?? []).length;
const directionCount = (updated.match(/<direction[\s\S]*?<words/g) ?? []).length;
process.stdout.write(
  `Wrote ${TARGET} (${measureCount} measures, ${lyricCount} lyrics, ${directionCount} direction-words remaining)\n`,
);
