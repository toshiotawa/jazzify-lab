/**
 * Comping MusicXML: `<direction><words>` 表現テキストを 1 番歌詞として複製する。
 * 元 XML の宣言・DOCTYPE・レイアウトを保持する（DOM serialize は使わない）。
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

/** @param {string} directionBlock */
const wordsTextFromDirection = (directionBlock) => {
  const match = directionBlock.match(/<words\b[^>]*>([\s\S]*?)<\/words>/);
  if (!match) {
    return null;
  }
  const normalized = normalizeLyricText(decodeXmlText(match[1]));
  return normalized.length > 0 ? normalized : null;
};

/** @param {string} noteXml @param {string} text */
const injectLyricIntoNote = (noteXml, text) => {
  if (noteXml.includes('<lyric')) {
    return noteXml;
  }
  const escaped = escapeXmlText(text);
  const spaceAttr = text.includes('\n') ? ' xml:space="preserve"' : '';
  const block = `<lyric number="1"><syllabic>single</syllabic><text${spaceAttr}>${escaped}</text></lyric>`;
  if (/<\/staff>/.test(noteXml)) {
    return noteXml.replace(/(\s*<\/staff>)/, `$1${block}`);
  }
  return noteXml.replace(/(\s*)<\/note>/, `${block}$1</note>`);
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
    if (!noteMatch) {
      continue;
    }
    const noteXml = noteMatch[0];
    const injected = injectLyricIntoNote(noteXml, lyricText);
    if (injected !== noteXml) {
      updated = updated.replace(noteXml, injected);
    }
  }
  return updated;
};

const xml = readFileSync(SOURCE, 'utf8');
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
process.stdout.write(`Wrote ${TARGET} (${measureCount} measures)\n`);
