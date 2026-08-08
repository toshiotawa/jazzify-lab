/**
 * MQ B2 ドミファ OSMD（voice4 cue 版）をベースに、
 * voice 1 の pitched アタックをすべて C4 + Eb4 + F4 和音塊へ置換する。
 *
 * Usage:
 *   node scripts/build-dev-adlib-call-response-domifa-musicxml.mjs
 *   node scripts/build-dev-adlib-call-response-domifa-musicxml.mjs \
 *     --source public/sozai/mq-b2-domifa-guide-voice4-cue.musicxml \
 *     --output public/sozai/dev-adlib-call-response-domifa.musicxml
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_SOURCE = join(ROOT, 'public', 'sozai', 'mq-b2-domifa-guide-voice4-cue.musicxml');
const DEFAULT_OUTPUT = join(ROOT, 'public', 'sozai', 'dev-adlib-call-response-domifa.musicxml');

const TARGET_VOICE = '1';
const DOMIFA_PITCHES = [
  { step: 'C', alter: null, accidental: null },
  { step: 'E', alter: '-1', accidental: 'flat' },
  { step: 'F', alter: null, accidental: null },
];

const readArg = (flag) => {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return null;
  }
  return process.argv[index + 1];
};

const SOURCE = resolve(ROOT, readArg('--source') ?? DEFAULT_SOURCE);
const OUTPUT = resolve(ROOT, readArg('--output') ?? DEFAULT_OUTPUT);

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

const getNoteVoice = (note) => getDirectChildText(note, 'voice') ?? TARGET_VOICE;

const isVoiceOneNote = (note) => getNoteVoice(note) === TARGET_VOICE;

const isGraceNote = (note) => getDirectChild(note, 'grace') !== null;

const isRestNote = (note) => getDirectChild(note, 'rest') !== null;

const isPitchedNote = (note) => getDirectChild(note, 'pitch') !== null;

const isChordContinuation = (note) => getDirectChild(note, 'chord') !== null;

const cloneNoteShell = (doc, sourceNote, { asChord = false } = {}) => {
  const note = doc.createElement('note');
  if (asChord) {
    note.appendChild(doc.createElement('chord'));
  }

  const copyNames = new Set(['duration', 'voice', 'type', 'dot', 'stem', 'beam', 'notations', 'lyric']);
  for (let child = sourceNote.firstElementChild; child; child = child.nextElementSibling) {
    const name = child.localName;
    if (name === 'pitch' || name === 'rest' || name === 'chord' || name === 'grace' || name === 'accidental') {
      continue;
    }
    if (copyNames.has(name)) {
      note.appendChild(child.cloneNode(true));
    }
  }

  for (const attr of ['default-x', 'default-y', 'print-object']) {
    const value = sourceNote.getAttribute(attr);
    if (value !== null) {
      note.setAttribute(attr, value);
    }
  }

  return note;
};

const appendPitch = (doc, note, pitchDef) => {
  const pitch = doc.createElement('pitch');
  const step = doc.createElement('step');
  step.textContent = pitchDef.step;
  pitch.appendChild(step);
  if (pitchDef.alter !== null) {
    const alter = doc.createElement('alter');
    alter.textContent = pitchDef.alter;
    pitch.appendChild(alter);
  }
  const octave = doc.createElement('octave');
  octave.textContent = '4';
  pitch.appendChild(octave);
  note.insertBefore(pitch, note.firstElementChild);

  if (pitchDef.accidental !== null) {
    const accidental = doc.createElement('accidental');
    accidental.textContent = pitchDef.accidental;
    note.appendChild(accidental);
  }
};

const buildDomifaCluster = (doc, sourceNote) => {
  const cluster = DOMIFA_PITCHES.map((pitchDef, index) => {
    const note = cloneNoteShell(doc, sourceNote, { asChord: index > 0 });
    appendPitch(doc, note, pitchDef);
    return note;
  });
  return cluster;
};

const collectVoiceOneCluster = (notes, startIndex) => {
  const head = notes[startIndex];
  const cluster = [head];
  for (let i = startIndex + 1; i < notes.length; i += 1) {
    const next = notes[i];
    if (!isVoiceOneNote(next) || !isChordContinuation(next) || isRestNote(next)) {
      break;
    }
    cluster.push(next);
  }
  return cluster;
};

const transformMeasure = (doc, measure) => {
  const notes = [];
  for (const child of measure.children) {
    if (isElement(child) && child.localName === 'note') {
      notes.push(child);
    }
  }

  for (let i = 0; i < notes.length; i += 1) {
    const note = notes[i];
    if (!isVoiceOneNote(note) || isGraceNote(note) || isRestNote(note) || isChordContinuation(note)) {
      continue;
    }
    if (!isPitchedNote(note)) {
      continue;
    }

    const cluster = collectVoiceOneCluster(notes, i);
    const replacement = buildDomifaCluster(doc, cluster[0]);

    for (const node of replacement) {
      measure.insertBefore(node, cluster[0]);
    }

    for (const member of cluster) {
      member.remove();
    }
  }
};

const pitchClassFromNote = (note) => {
  const pitch = getDirectChild(note, 'pitch');
  if (!pitch) {
    return null;
  }
  const step = getDirectChildText(pitch, 'step');
  const alterText = getDirectChildText(pitch, 'alter');
  const octaveText = getDirectChildText(pitch, 'octave');
  if (!step || !octaveText) {
    return null;
  }
  const stepMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const base = stepMap[step];
  if (base === undefined) {
    return null;
  }
  const alter = alterText ? Number.parseInt(alterText, 10) : 0;
  const octave = Number.parseInt(octaveText, 10);
  const midi = (octave + 1) * 12 + base + alter;
  return ((midi % 12) + 12) % 12;
};

const validateDomifaVoiceOne = (doc) => {
  const allowed = new Set([0, 3, 5]);
  const measures = doc.querySelectorAll('measure');
  let attackCount = 0;

  for (const measure of measures) {
    const notes = [...measure.children].filter(
      (child) => isElement(child) && child.localName === 'note',
    );
    for (let i = 0; i < notes.length; i += 1) {
      const note = notes[i];
      if (!isVoiceOneNote(note) || isGraceNote(note) || isRestNote(note) || isChordContinuation(note)) {
        continue;
      }
      if (!isPitchedNote(note)) {
        continue;
      }
      attackCount += 1;
      const cluster = collectVoiceOneCluster(notes, i);
      const pitchClasses = new Set();
      for (const member of cluster) {
        const pc = pitchClassFromNote(member);
        if (pc !== null) {
          pitchClasses.add(pc);
        }
      }
      if (pitchClasses.size !== 3 || ![...pitchClasses].every((pc) => allowed.has(pc))) {
        throw new Error(
          `voice1 attack is not domifa cluster: measure=${measure.getAttribute('number')} pcs=${[...pitchClasses].join(',')}`,
        );
      }
    }
  }

  return attackCount;
};

const main = () => {
  const xml = readFileSync(SOURCE, 'utf8');
  const dom = new JSDOM(xml, { contentType: 'application/xml' });
  const doc = dom.window.document;

  const measures = doc.querySelectorAll('measure');
  for (const measure of measures) {
    transformMeasure(doc, measure);
  }

  const attackCount = validateDomifaVoiceOne(doc);
  const output = dom.serialize();
  writeFileSync(OUTPUT, output, 'utf8');
  console.log(`Wrote ${OUTPUT}`);
  console.log(`Validated ${attackCount} voice1 pitched attacks as C/Eb/F clusters.`);
};

main();
