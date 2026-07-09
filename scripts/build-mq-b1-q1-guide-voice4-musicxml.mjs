/**
 * メインクエスト 1-1（public/sozai/1-1.musicxml）をベースに、
 * voice 1 のタイムライン（pitch + rest）を 1 小節前へ voice 4 ガイドとして複製する。
 *
 * Usage:
 *   node scripts/build-mq-b1-q1-guide-voice4-musicxml.mjs
 *   node scripts/build-mq-b1-q1-guide-voice4-musicxml.mjs --cue
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'public', 'sozai', '1-1.musicxml');
const OUTPUT_DIM = join(ROOT, 'public', 'sozai', 'dev-mq-b1-q1-osmd-guide-voice4.musicxml');
const OUTPUT_CUE = join(ROOT, 'public', 'sozai', 'dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml');

const GUIDE_VOICE = '4';
const useCue = process.argv.includes('--cue');
const OUTPUT = useCue ? OUTPUT_CUE : OUTPUT_DIM;

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

const appendDirectChildrenByName = (doc, sourceNote, targetNote, localName) => {
  for (let child = sourceNote.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      targetNote.appendChild(child.cloneNode(true));
    }
  }
};

/** voice 1 の pitch / rest を時間順に収集（grace 除外） */
const collectVoiceOneTimelineNotes = (measure) => {
  const notes = [];
  for (const child of measure.children) {
    if (!isElement(child) || child.localName !== 'note') {
      continue;
    }
    if (getDirectChild(child, 'grace')) {
      continue;
    }
    const voice = getDirectChildText(child, 'voice');
    if (voice !== null && voice !== '1') {
      continue;
    }
    const hasPitch = getDirectChild(child, 'pitch') !== null;
    const hasRest = getDirectChild(child, 'rest') !== null;
    if (!hasPitch && !hasRest) {
      continue;
    }
    notes.push(child);
  }
  return notes;
};

const cloneTimelineNoteAsGuide = (doc, sourceNote, asCue) => {
  const note = doc.createElement('note');
  const isRest = getDirectChild(sourceNote, 'rest') !== null;

  if (isRest) {
    const rest = getDirectChild(sourceNote, 'rest');
    if (rest) {
      note.appendChild(rest.cloneNode(true));
    }
  } else {
    const pitch = getDirectChild(sourceNote, 'pitch');
    if (pitch) {
      note.appendChild(pitch.cloneNode(true));
    }
  }

  appendDirectChildrenByName(doc, sourceNote, note, 'duration');

  const type = getDirectChild(sourceNote, 'type');
  if (type) {
    const typeClone = type.cloneNode(true);
    if (asCue && !isRest) {
      typeClone.setAttribute('size', 'cue');
    }
    note.appendChild(typeClone);
  }

  appendDirectChildrenByName(doc, sourceNote, note, 'dot');
  appendDirectChildrenByName(doc, sourceNote, note, 'beam');
  setDirectChildText(doc, note, 'voice', GUIDE_VOICE);

  if (!isRest) {
    appendDirectChildrenByName(doc, sourceNote, note, 'stem');
  }

  return note;
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

const sumNoteDurations = (notes) => {
  let total = 0;
  for (const note of notes) {
    const durationText = getDirectChildText(note, 'duration');
    const duration = durationText ? Number.parseInt(durationText, 10) : NaN;
    if (Number.isFinite(duration) && duration > 0) {
      total += duration;
    }
  }
  return total;
};

const createBackup = (doc, duration) => {
  const backup = doc.createElement('backup');
  const durationEl = doc.createElement('duration');
  durationEl.textContent = String(duration);
  backup.appendChild(durationEl);
  return backup;
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
  const sourceNotes = collectVoiceOneTimelineNotes(targetMeasure);
  if (sourceNotes.length === 0) {
    continue;
  }

  const guideWasFullRest = isFullMeasureRestOnly(guideMeasure);
  if (guideWasFullRest) {
    removeFullMeasureRestNotes(guideMeasure);
  } else {
    const backupDuration = sumNoteDurations(sourceNotes);
    if (backupDuration > 0) {
      guideMeasure.appendChild(createBackup(doc, backupDuration));
    }
  }

  for (const sourceNote of sourceNotes) {
    guideMeasure.appendChild(cloneTimelineNoteAsGuide(doc, sourceNote, useCue));
  }
}

writeFileSync(OUTPUT, dom.serialize(), 'utf8');
console.log(`Wrote ${OUTPUT}${useCue ? ' (cue)' : ' (dim)'}`);
