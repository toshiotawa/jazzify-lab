/**
 * メインクエスト 1-1（public/sozai/1-1_count-in.musicxml）をベースに、
 * voice 1 の各 pitch 音符を 6 音同時押しコードへ展開する。
 * パリィ円内の音名ラベル（6 行）確認用。
 *
 * Usage:
 *   node scripts/build-mq-b1-q1-six-note-parry-musicxml.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const SOURCE = join(ROOT, 'public', 'sozai', '1-1_count-in.musicxml');
const OUTPUT = join(ROOT, 'public', 'sozai', 'dev-mq-b1-q1-osmd-six-note-parry.musicxml');

/** 6 音・異なる音名（低い順）。ラベルは C D E F G A になる。 */
const SIX_NOTES = [
  { step: 'C', octave: 4 },
  { step: 'D', octave: 4 },
  { step: 'E', octave: 4 },
  { step: 'F', octave: 4 },
  { step: 'G', octave: 4 },
  { step: 'A', octave: 4 },
];

const isElement = (node) => node.nodeType === 1;

const getDirectChild = (parent, localName) => {
  for (let child = parent.firstElementChild; child; child = child.nextElementSibling) {
    if (child.localName === localName) {
      return child;
    }
  }
  return null;
};

const setPitch = (doc, noteEl, step, octave) => {
  let pitch = getDirectChild(noteEl, 'pitch');
  if (!pitch) {
    pitch = doc.createElement('pitch');
    const rest = getDirectChild(noteEl, 'rest');
    if (rest) {
      noteEl.replaceChild(pitch, rest);
    } else {
      noteEl.insertBefore(pitch, noteEl.firstChild);
    }
  }
  while (pitch.firstChild) {
    pitch.removeChild(pitch.firstChild);
  }
  const stepEl = doc.createElement('step');
  stepEl.textContent = step;
  pitch.appendChild(stepEl);
  const octaveEl = doc.createElement('octave');
  octaveEl.textContent = String(octave);
  pitch.appendChild(octaveEl);
};

const createChordNote = (doc, templateNote, step, octave) => {
  const note = doc.createElement('note');
  const chord = doc.createElement('chord');
  note.appendChild(chord);

  const pitch = doc.createElement('pitch');
  const stepEl = doc.createElement('step');
  stepEl.textContent = step;
  pitch.appendChild(stepEl);
  const octaveEl = doc.createElement('octave');
  octaveEl.textContent = String(octave);
  pitch.appendChild(octaveEl);
  note.appendChild(pitch);

  for (const name of ['duration', 'voice', 'type', 'stem', 'staff', 'beam']) {
    const child = getDirectChild(templateNote, name);
    if (child) {
      note.appendChild(child.cloneNode(true));
    }
  }
  return note;
};

const expandPitchedNoteToSix = (doc, noteEl) => {
  if (getDirectChild(noteEl, 'chord')) {
    noteEl.remove();
    return;
  }
  if (!getDirectChild(noteEl, 'pitch')) {
    return;
  }

  const [root, ...upper] = SIX_NOTES;
  setPitch(doc, noteEl, root.step, root.octave);

  let insertAfter = noteEl;
  for (const { step, octave } of upper) {
    const chordNote = createChordNote(doc, noteEl, step, octave);
    insertAfter.parentNode.insertBefore(chordNote, insertAfter.nextSibling);
    insertAfter = chordNote;
  }
};

const xml = readFileSync(SOURCE, 'utf8');
const dom = new JSDOM(xml, { contentType: 'application/xml' });
const doc = dom.window.document;
const part = doc.querySelector('part');
if (!part) {
  throw new Error('part not found');
}

for (const measure of part.querySelectorAll('measure')) {
  const notes = Array.from(measure.children).filter(
    (child) => isElement(child) && child.localName === 'note',
  );
  for (const note of notes) {
    expandPitchedNoteToSix(doc, note);
  }
}

const serializer = new dom.window.XMLSerializer();
let out = serializer.serializeToString(doc);
if (!out.startsWith('<?xml')) {
  out = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n${out}`;
}
writeFileSync(OUTPUT, `${out}\n`, 'utf8');
console.log(`Wrote ${OUTPUT}`);
