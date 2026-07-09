/**
 * メインクエスト 1-1（public/sozai/1-1.musicxml）をベースに、
 * voice 1 の pitch 音符を 1 小節前へ voice 4 ガイドとして複製する。
 *
 * Usage: node scripts/build-mq-b1-q1-guide-voice4-musicxml.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'public', 'sozai', '1-1.musicxml');
const OUTPUT = join(ROOT, 'public', 'sozai', 'dev-mq-b1-q1-osmd-guide-voice4.musicxml');

const GUIDE_VOICE = '4';

const isElement = (node) => node.nodeType === 1;

const getDirectChild = (parent, localName) => {
  for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
};

const getDirectChildText = (parent, localName) => {
  const child = getDirectChild(parent, localName);
  const text = child?.textContent?.trim();
  return text ? text : null;
};

const setDirectChildText = (doc, parent, localName, text) => {
  const existing = getDirectChild(parent, localName);
  if (existing) {
    existing.textContent = text;
    return;
  }
  const child = doc.createElement(localName);
  child.textContent = text;
  parent.appendChild(child);
};

const clonePitchNoteAsGuide = (doc, sourceNote) => {
  const note = doc.createElement('note');
  const pitch = getDirectChild(sourceNote, 'pitch');
  if (pitch) {
    note.appendChild(pitch.cloneNode(true));
  }
  const duration = getDirectChild(sourceNote, 'duration');
  if (duration) {
    note.appendChild(duration.cloneNode(true));
  }
  const type = getDirectChild(sourceNote, 'type');
  if (type) {
    note.appendChild(type.cloneNode(true));
  }
  const dot = getDirectChild(sourceNote, 'dot');
  if (dot) {
    note.appendChild(dot.cloneNode(true));
  }
  const beam = sourceNote.getElementsByTagName('beam');
  for (const beamEl of beam) {
    if (beamEl.parentElement === sourceNote) {
      note.appendChild(beamEl.cloneNode(true));
    }
  }
  setDirectChildText(doc, note, 'voice', GUIDE_VOICE);
  const stem = getDirectChild(sourceNote, 'stem');
  if (stem) {
    note.appendChild(stem.cloneNode(true));
  }
  return note;
};

const collectVoiceOnePitchNotes = (measure) => {
  const notes = [];
  for (const child of measure.children) {
    if (!isElement(child) || child.localName !== 'note') {
      continue;
    }
    if (getDirectChild(child, 'grace')) {
      continue;
    }
    if (getDirectChild(child, 'rest')) {
      continue;
    }
    if (!getDirectChild(child, 'pitch')) {
      continue;
    }
    const voice = getDirectChildText(child, 'voice');
    if (voice !== null && voice !== '1') {
      continue;
    }
    notes.push(child);
  }
  return notes;
};

const isFullMeasureRestOnly = (measure) => {
  const noteElements = [...measure.children].filter(
    (child) => isElement(child) && child.localName === 'note',
  );
  if (noteElements.length !== 1) {
    return false;
  }
  const only = noteElements[0];
  return getDirectChild(only, 'rest') !== null && getDirectChild(only, 'pitch') === null;
};

const removeFullMeasureRestNotes = (measure) => {
  for (const child of [...measure.children]) {
    if (!isElement(child) || child.localName !== 'note') {
      continue;
    }
    if (getDirectChild(child, 'rest') && !getDirectChild(child, 'pitch')) {
      measure.removeChild(child);
    }
  }
};

const xmlText = readFileSync(SOURCE, 'utf8');
const dom = new JSDOM(xmlText, { contentType: 'text/xml' });
const doc = dom.window.document;

if (doc.getElementsByTagName('parsererror').length > 0) {
  console.error('Failed to parse source MusicXML');
  process.exit(1);
}

const part = doc.querySelector('part');
if (!part) {
  console.error('No <part> found');
  process.exit(1);
}

const measures = [...part.children].filter(
  (child) => isElement(child) && child.localName === 'measure',
);

for (let i = 1; i < measures.length; i += 1) {
  const targetMeasure = measures[i];
  const guideMeasure = measures[i - 1];
  const sourceNotes = collectVoiceOnePitchNotes(targetMeasure);
  if (sourceNotes.length === 0) {
    continue;
  }

  if (isFullMeasureRestOnly(guideMeasure)) {
    removeFullMeasureRestNotes(guideMeasure);
  }

  for (const sourceNote of sourceNotes) {
    guideMeasure.appendChild(clonePitchNoteAsGuide(doc, sourceNote));
  }
}

writeFileSync(OUTPUT, dom.serialize(), 'utf8');
console.log(`Wrote ${OUTPUT}`);
