#!/usr/bin/env node
/**
 * 251譜面_C.musicxml を C 以外の11キーへ移調する（Node 単体実行用）。
 *
 * Usage:
 *   node scripts/transpose-251-musicxml-standalone.mjs [input.musicxml] [outputDir]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, basename } from 'node:path';
import { JSDOM } from 'jsdom';
import { Note, Interval, Key } from 'tonal';

const TARGET_KEYS = [
  { key: 'Db', semitones: 1, label: '+1st_Db' },
  { key: 'D', semitones: 2, label: '+2st_D' },
  { key: 'Eb', semitones: 3, label: '+3st_Eb' },
  { key: 'E', semitones: 4, label: '+4st_E' },
  { key: 'F', semitones: 5, label: '+5st_F' },
  { key: 'Gb', semitones: 6, label: '+6st_Gb' },
  { key: 'B', semitones: -1, label: '-1st_B' },
  { key: 'Bb', semitones: -2, label: '-2st_Bb' },
  { key: 'A', semitones: -3, label: '-3st_A' },
  { key: 'Ab', semitones: -4, label: '-4st_Ab' },
  { key: 'G', semitones: -5, label: '-5st_G' },
];

const FIFTHS_TO_KEY = {
  '-7': 'Cb', '-6': 'Gb', '-5': 'Db', '-4': 'Ab', '-3': 'Eb', '-2': 'Bb', '-1': 'F',
  0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
};

const KEY_FIFTHS = {
  C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7,
  Gb: -6, Db: -5, Ab: -4, Eb: -3, Bb: -2, F: -1, Cb: -7,
};

const SCALE_MAP = {
  C: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  G: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  D: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  A: ['A', 'B', 'C#', 'D', 'E', 'F#', 'G#'],
  E: ['E', 'F#', 'G#', 'A', 'B', 'C#', 'D#'],
  B: ['B', 'C#', 'D#', 'E', 'F#', 'G#', 'A#'],
  'F#': ['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'],
  'C#': ['C#', 'D#', 'E#', 'F#', 'G#', 'A#', 'B#'],
  Gb: ['Gb', 'Ab', 'Bb', 'Cb', 'Db', 'Eb', 'F'],
  Db: ['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'],
  Ab: ['Ab', 'Bb', 'C', 'Db', 'Eb', 'F', 'G'],
  Eb: ['Eb', 'F', 'G', 'Ab', 'Bb', 'C', 'D'],
  Bb: ['Bb', 'C', 'D', 'Eb', 'F', 'G', 'A'],
  F: ['F', 'G', 'A', 'Bb', 'C', 'D', 'E'],
  Cb: ['Cb', 'Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb'],
};

function fifthsToKeyName(fifths) {
  return FIFTHS_TO_KEY[fifths] ?? 'C';
}

function serializeMusicXml(xmlDoc, window, originalXml) {
  let body = new window.XMLSerializer().serializeToString(xmlDoc);
  body = body.replace(/^<\?xml[^?]*\?>\s*/i, '');
  body = body.replace(/^<!DOCTYPE[^>]+>\s*/i, '');

  const xmlDeclMatch = originalXml.match(/^<\?xml[^?]*\?>\r?\n?/i);
  const doctypeMatch = originalXml.match(/<!DOCTYPE[^>]+>\r?\n?/i);
  const eol = originalXml.includes('\r\n') ? '\r\n' : '\n';
  const xmlDecl = xmlDeclMatch?.[0] ?? `<?xml version="1.0" encoding="UTF-8" standalone="no"?>${eol}`;
  const doctype = doctypeMatch?.[0] ?? `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">${eol}`;

  return `${xmlDecl}${doctype}${body}`;
}

function setRootAlter(rootEl, rootStepEl, doc, alterValue) {
  const existing = rootEl.querySelector('root-alter');
  if (existing) existing.remove();
  if (alterValue === null || alterValue === 0) return;

  const newRootAlterEl = doc.createElement('root-alter');
  newRootAlterEl.textContent = String(alterValue);
  const insertBefore = rootStepEl.nextSibling;
  if (insertBefore) {
    rootEl.insertBefore(newRootAlterEl, insertBefore);
  } else {
    rootEl.appendChild(newRootAlterEl);
  }
}

function getCorrectInterval(fromKey, toKey) {
  const interval = Interval.distance(fromKey, toKey);
  if (interval) return interval;
  const fromChroma = Note.get(fromKey).chroma ?? 0;
  const toChroma = Note.get(toKey).chroma ?? 0;
  const semitones = ((toChroma - fromChroma) % 12 + 12) % 12;
  return Interval.fromSemitones(semitones) ?? '1P';
}

function getKeyScaleNotes(keyName) {
  const keyInfo = Key.majorKey(keyName);
  if (keyInfo?.scale) return [...keyInfo.scale];
  return SCALE_MAP[keyName] ?? SCALE_MAP.C;
}

function adjustNoteToKeyScale(noteName, targetKey) {
  const scaleNotes = getKeyScaleNotes(targetKey);
  const chroma = Note.get(noteName).chroma;
  if (chroma === undefined) return noteName;
  for (const scaleNote of scaleNotes) {
    if (Note.get(scaleNote).chroma === chroma) return scaleNote;
  }
  return noteName;
}

function pitchToNote(step, alter, octave) {
  let accidental = '';
  if (alter > 0) accidental = '#'.repeat(alter);
  else if (alter < 0) accidental = 'b'.repeat(-alter);
  return `${step.toUpperCase()}${accidental}${octave}`;
}

const SHARP_KEY_SIGNATURE_STEPS = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_KEY_SIGNATURE_STEPS = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];

function clampKeyFifths(keyFifths) {
  return Math.max(-7, Math.min(7, Math.trunc(keyFifths)));
}

function musicXmlKeySignatureAlter(step, keyFifths) {
  const fifths = clampKeyFifths(keyFifths);
  if (fifths > 0) {
    for (let index = 0; index < fifths; index += 1) {
      if (SHARP_KEY_SIGNATURE_STEPS[index] === step) return 1;
    }
    return 0;
  }
  if (fifths < 0) {
    const flatCount = Math.abs(fifths);
    for (let index = 0; index < flatCount; index += 1) {
      if (FLAT_KEY_SIGNATURE_STEPS[index] === step) return -1;
    }
    return 0;
  }
  return 0;
}

function accidentalXmlValue(alter) {
  if (alter === 2) return 'double-sharp';
  if (alter === 1) return 'sharp';
  if (alter === -1) return 'flat';
  if (alter === -2) return 'double-flat';
  return 'natural';
}

function computeAccidentalNeeded(step, alter, keyFifths, voiceAlterByStep) {
  const keyAlter = musicXmlKeySignatureAlter(step, keyFifths);
  const prevAlter = voiceAlterByStep.get(step);
  if (prevAlter !== undefined) {
    if (alter === prevAlter) return null;
    return accidentalXmlValue(alter);
  }
  if (alter === keyAlter) return null;
  return accidentalXmlValue(alter);
}

function insertAccidental(doc, noteEl, accidentalText) {
  const existing = noteEl.querySelector('accidental');
  if (existing) existing.remove();
  if (!accidentalText) return;

  const accEl = doc.createElement('accidental');
  accEl.textContent = accidentalText;
  const typeEl = noteEl.querySelector('type');
  if (typeEl) {
    noteEl.insertBefore(accEl, typeEl.nextSibling);
    return;
  }
  const durationEl = noteEl.querySelector('duration');
  if (durationEl) {
    noteEl.insertBefore(accEl, durationEl.nextSibling);
    return;
  }
  noteEl.appendChild(accEl);
}

function accToAlter(acc) {
  if (!acc) return null;
  if (acc === '#') return 1;
  if (acc === '##' || acc === 'x') return 2;
  if (acc === 'b') return -1;
  if (acc === 'bb') return -2;
  return null;
}

function applyNoteToPitch(doc, noteStr, pitchEl, targetKeyName) {
  const parsed = Note.get(noteStr);
  if (parsed.empty) return null;

  const { letter, acc, oct } = parsed;
  const noteNameWithoutOctave = letter + (acc || '');
  const adjustedNote = adjustNoteToKeyScale(noteNameWithoutOctave, targetKeyName);
  const adjustedParsed = Note.get(adjustedNote);
  const finalLetter = adjustedParsed?.letter || letter;
  const finalAcc = adjustedParsed?.acc || acc;

  let finalOctave = oct;
  if (adjustedNote !== noteNameWithoutOctave && oct !== undefined) {
    const originalMidi = Note.midi(noteStr);
    const adjustedMidi = Note.midi(adjustedNote + oct);
    if (originalMidi !== null && adjustedMidi !== null && originalMidi !== adjustedMidi) {
      finalOctave = oct + Math.round((originalMidi - adjustedMidi) / 12);
    }
  }

  pitchEl.replaceChildren();
  const stepEl = doc.createElement('step');
  stepEl.textContent = finalLetter;
  pitchEl.appendChild(stepEl);

  const alterValue = accToAlter(finalAcc) ?? 0;
  if (alterValue !== 0) {
    const alterEl = doc.createElement('alter');
    alterEl.textContent = String(alterValue);
    pitchEl.appendChild(alterEl);
  }

  const octaveEl = doc.createElement('octave');
  octaveEl.textContent = String(finalOctave);
  pitchEl.appendChild(octaveEl);

  return { step: finalLetter, alter: alterValue, octave: finalOctave };
}

function transposeMusicXml(xmlString, semitones, targetKeyName, window) {
  const { document: doc, DOMParser } = window;
  const xmlDoc = new DOMParser().parseFromString(xmlString, 'application/xml');

  const firstKeyEl = xmlDoc.querySelector('key fifths');
  const originalFifths = firstKeyEl ? parseInt(firstKeyEl.textContent || '0', 10) : 0;
  const originalKeyName = fifthsToKeyName(originalFifths);
  const transposeInterval = getCorrectInterval(originalKeyName, targetKeyName);
  const targetFifths = KEY_FIFTHS[targetKeyName] ?? 0;
  const octaveShift = Math.floor(semitones / 12);
  const octaveInterval = octaveShift !== 0 ? `${Math.abs(octaveShift) * 8}P` : null;

  xmlDoc.querySelectorAll('measure').forEach((measureEl) => {
    const voiceAlterByStep = new Map();

    measureEl.querySelectorAll('note').forEach((noteEl) => {
      if (noteEl.querySelector('rest')) return;
      const pitchEl = noteEl.querySelector('pitch');
      if (!pitchEl) return;
      const stepEl = pitchEl.querySelector('step');
      const alterEl = pitchEl.querySelector('alter');
      const octaveEl = pitchEl.querySelector('octave');
      if (!stepEl || !octaveEl) return;

      const step = stepEl.textContent || 'C';
      const alter = alterEl ? parseInt(alterEl.textContent || '0', 10) : 0;
      const octave = parseInt(octaveEl.textContent || '4', 10);
      const noteStr = pitchToNote(step, alter, octave);

      let transposedNote = Note.transpose(noteStr, transposeInterval);
      if (octaveInterval && transposedNote) {
        transposedNote = octaveShift > 0
          ? Note.transpose(transposedNote, octaveInterval)
          : Note.transpose(transposedNote, `-${octaveInterval}`);
      }
      if (!transposedNote) return;

      const pitchInfo = applyNoteToPitch(xmlDoc, transposedNote, pitchEl, targetKeyName);
      if (!pitchInfo) return;

      const accidentalText = computeAccidentalNeeded(
        pitchInfo.step,
        pitchInfo.alter,
        targetFifths,
        voiceAlterByStep,
      );
      insertAccidental(xmlDoc, noteEl, accidentalText);
      voiceAlterByStep.set(pitchInfo.step, pitchInfo.alter);
    });
  });

  xmlDoc.querySelectorAll('harmony').forEach((harmonyEl) => {
    const rootStepEl = harmonyEl.querySelector('root root-step');
    const rootAlterEl = harmonyEl.querySelector('root root-alter');
    if (!rootStepEl?.textContent) return;

    const rootAlter = rootAlterEl ? parseInt(rootAlterEl.textContent || '0', 10) : 0;
    let rootNote = rootStepEl.textContent;
    if (rootAlter > 0) rootNote += '#'.repeat(rootAlter);
    else if (rootAlter < 0) rootNote += 'b'.repeat(-rootAlter);

    const transposedRootNote = Note.transpose(rootNote, transposeInterval);
    if (!transposedRootNote) return;

    const parsed = Note.get(transposedRootNote);
    if (parsed.empty) return;

    const rootEl = harmonyEl.querySelector('root');
    if (!rootEl) return;

    const { letter, acc } = parsed;
    rootStepEl.textContent = letter;
    setRootAlter(rootEl, rootStepEl, xmlDoc, accToAlter(acc));
  });

  xmlDoc.querySelectorAll('key').forEach((keyEl) => {
    const fifthsEl = keyEl.querySelector('fifths');
    if (fifthsEl) fifthsEl.textContent = String(targetFifths);
  });

  return serializeMusicXml(xmlDoc, window, xmlString);
}

function outputBaseName(sourcePath) {
  const name = basename(sourcePath, '.musicxml');
  return name.endsWith('_C') ? name.slice(0, -2) : name;
}

function main() {
  const defaultInput = resolve('C:/Users/saita/Downloads/251譜面_C.musicxml');
  const inputPath = resolve(process.argv[2] ?? defaultInput);
  const outputDir = resolve(process.argv[3] ?? dirname(inputPath));
  const baseName = outputBaseName(inputPath);

  const sourceXml = readFileSync(inputPath, 'utf8');
  mkdirSync(outputDir, { recursive: true });

  const dom = new JSDOM('');
  const { window } = dom;

  for (const { key, semitones, label } of TARGET_KEYS) {
    const transposed = transposeMusicXml(sourceXml, semitones, key, window);
    const outPath = resolve(outputDir, `${baseName}_${label}.musicxml`);
    writeFileSync(outPath, transposed, 'utf8');
    console.log(`Wrote ${outPath}`);
  }

  console.log(`Done: ${TARGET_KEYS.length} files -> ${outputDir}`);
}

main();
