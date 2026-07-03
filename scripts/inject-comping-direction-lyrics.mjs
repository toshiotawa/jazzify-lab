/**
 * Comping MusicXML: `<direction><words>` 表現テキストを 1 番歌詞として複製する。
 * 精密モードの歌詞オーバーレイ用。楽譜表示では stripLyrics により歌詞は非表示のまま。
 *
 * Usage:
 *   node scripts/inject-comping-direction-lyrics.mjs [source.musicxml] [target.musicxml]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

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
const normalizeLyricText = (text) => text.replace(/\r\n/g, '\n').trim();

/** @param {Element} directionEl */
const wordsTextFromDirection = (directionEl) => {
  const wordsEls = directionEl.querySelectorAll('direction-type words');
  const parts = [];
  for (const wordsEl of wordsEls) {
    const raw = wordsEl.textContent ?? '';
    const normalized = normalizeLyricText(raw);
    if (normalized.length > 0) {
      parts.push(normalized);
    }
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join('\n');
};

/** @param {Element} noteEl */
const noteIsInjectTarget = (noteEl) => (
  noteEl.localName === 'note'
  && !noteEl.querySelector('grace')
  && !noteEl.querySelector('rest')
  && noteEl.querySelector('pitch')
  && !noteEl.querySelector('chord')
);

/** @param {Element} noteEl @param {string} text */
const injectLyricOnNote = (noteEl, text) => {
  if (noteEl.querySelector('lyric')) {
    return;
  }
  const lyricEl = noteEl.ownerDocument.createElement('lyric');
  lyricEl.setAttribute('number', '1');
  const syllabicEl = noteEl.ownerDocument.createElement('syllabic');
  syllabicEl.textContent = 'single';
  lyricEl.appendChild(syllabicEl);
  const textEl = noteEl.ownerDocument.createElement('text');
  if (text.includes('\n')) {
    textEl.setAttribute('xml:space', 'preserve');
  }
  textEl.textContent = text;
  lyricEl.appendChild(textEl);
  const pitch = noteEl.querySelector('pitch');
  if (pitch?.nextSibling) {
    noteEl.insertBefore(lyricEl, pitch.nextSibling);
  } else {
    noteEl.appendChild(lyricEl);
  }
};

/** @param {Element} measureEl */
const injectLyricsFromDirectionsInMeasure = (measureEl) => {
  const children = Array.from(measureEl.children);
  for (let i = 0; i < children.length; i += 1) {
    const child = children[i];
    if (child.localName !== 'direction') {
      continue;
    }
    const lyricText = wordsTextFromDirection(child);
    if (!lyricText) {
      continue;
    }
    for (let j = i + 1; j < children.length; j += 1) {
      const next = children[j];
      if (noteIsInjectTarget(next)) {
        injectLyricOnNote(next, lyricText);
        break;
      }
    }
  }
};

const dom = new JSDOM(readFileSync(SOURCE, 'utf8'), { contentType: 'application/xml' });
const doc = dom.window.document;
const measures = doc.querySelectorAll('part > measure');
for (const measure of measures) {
  injectLyricsFromDirectionsInMeasure(measure);
}

const serialized = dom.serialize();
writeFileSync(TARGET, serialized, 'utf8');
process.stdout.write(`Wrote ${TARGET} (${measures.length} measures)\n`);
