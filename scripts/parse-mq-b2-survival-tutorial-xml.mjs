/**
 * 3-1サバイバルチュートリアル.musicxml から S2(demo) / S3(playalong) 区間を抽出する。
 *
 * Usage:
 *   node scripts/parse-mq-b2-survival-tutorial-xml.mjs
 *   node scripts/parse-mq-b2-survival-tutorial-xml.mjs --json
 */
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');
const XML_PATH = join(ROOT, 'public', 'sozai', 'new', '3-1サバイバルチュートリアル.musicxml');

const STEP_TO_SEMITONE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** @param {string} step @param {number} alter @param {number} octave */
function pitchToMidi(step, alter, octave) {
  const base = STEP_TO_SEMITONE[step];
  if (base === undefined) {
    return null;
  }
  return (octave + 1) * 12 + base + (alter ?? 0);
}

/** @param {number} midi */
function midiToName(midi) {
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const pc = ((midi % 12) + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const flatPc = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const idx = flatPc.indexOf(pc);
  return `${flatNames[idx] ?? names[pc]}${octave}`;
}

/** @param {string} xml */
function extractPart(xml, partId) {
  const open = `<part id="${partId}">`;
  const start = xml.indexOf(open);
  if (start === -1) {
    return '';
  }
  const end = xml.indexOf('</part>', start);
  if (end === -1) {
    return '';
  }
  return xml.slice(start + open.length, end);
}

/** @param {string} measureXml */
function parseMeasureNumber(measureXml) {
  const m = measureXml.match(/<measure number="(\d+)"/);
  return m ? Number.parseInt(m[1], 10) : 0;
}

/** @param {string} measureXml */
function parseRehearsal(measureXml) {
  const m = measureXml.match(/<rehearsal[^>]*>([^<]+)<\/rehearsal>/);
  return m ? m[1].trim() : null;
}

/** @param {string} measureXml */
function parseLyricQuote(measureXml) {
  const texts = [...measureXml.matchAll(/<text>([^<]*)<\/text>/g)]
    .map((x) => x[1].trim())
    .filter((t) => t.length > 0 && !t.startsWith('-'));
  if (texts.length === 0) {
    return undefined;
  }
  return texts.join('');
}

/** @param {string} measureXml @param {number} staffNum */
function parseStaffNotes(measureXml, staffNum) {
  /** @type {number[]} */
  const midis = [];
  const noteBlocks = measureXml.match(/<note[\s\S]*?<\/note>/g) ?? [];
  for (const block of noteBlocks) {
    if (block.includes('<rest')) {
      continue;
    }
    const staffMatch = block.match(/<staff>(\d+)<\/staff>/);
    const staff = staffMatch ? Number.parseInt(staffMatch[1], 10) : 1;
    if (staff !== staffNum) {
      continue;
    }
    const step = block.match(/<step>([A-G])<\/step>/)?.[1];
    const octave = block.match(/<octave>(\d+)<\/octave>/)?.[1];
    if (!step || !octave) {
      continue;
    }
    const alterMatch = block.match(/<alter>(-?\d+)<\/alter>/);
    const alter = alterMatch ? Number.parseInt(alterMatch[1], 10) : 0;
    const midi = pitchToMidi(step, alter, Number.parseInt(octave, 10));
    if (midi !== null) {
      midis.push(midi);
    }
  }
  return midis;
}

/** @param {string} partXml @param {'S2' | 'S3'} section */
function extractSectionMeasures(partXml, section) {
  const measureBlocks = partXml.match(/<measure number="\d+"[\s\S]*?(?=<measure number=|<\/part>)/g) ?? [];
  /** @type {'S2' | 'S3' | null} */
  let current = null;
  /** @type {Array<{ measureNumber: number; midis: number[]; quote?: string }>} */
  const rows = [];

  for (const block of measureBlocks) {
    const rehearsal = parseRehearsal(block);
    if (rehearsal === 'S2' || rehearsal === 'S3') {
      current = rehearsal;
    }
    if (current !== section) {
      continue;
    }
    const midis = parseStaffNotes(block, 1);
    const quote = parseLyricQuote(block);
    rows.push({
      measureNumber: parseMeasureNumber(block),
      midis,
      quote: quote ? { ja: quote, en: quote } : undefined,
    });
  }
  return rows;
}

/** @param {readonly { midis: number[]; quote?: { ja: string; en: string } }[]} rows */
function toDemoChords(rows) {
  return rows.map((row, i) => ({
    startBeat: i * 4,
    durationBeats: 4,
    chordName: row.midis.length > 0 ? 'Motif' : '—',
    voicing: row.midis,
    voicingNames: row.midis.map(midiToName),
    voicing_staves: row.midis.map(() => 1),
    measureNumber: i + 1,
    keyFifths: 0,
  }));
}

/** @param {readonly { midis: number[]; quote?: { ja: string; en: string } }[]} rows */
function toPhraseChords(rows) {
  return rows.map((row, i) => ({
    name: row.midis.length > 0 ? 'Motif' : 'Rest',
    voicing: row.midis,
    voicingNames: row.midis.map(midiToName),
    keyFifths: 0,
    voicing_staves: row.midis.map(() => 1),
    measure_number: i + 1,
    quote: row.quote,
  }));
}

export function parseMqB2SurvivalTutorialXml(xmlText = readFileSync(XML_PATH, 'utf8')) {
  const partXml = extractPart(xmlText, 'P1');
  if (!partXml) {
    throw new Error('Part P1 not found');
  }
  const tempoMatch = partXml.match(/<sound tempo="(\d+)"/);
  const bpm = tempoMatch ? Number.parseInt(tempoMatch[1], 10) : 60;
  const s2Rows = extractSectionMeasures(partXml, 'S2');
  const s3Rows = extractSectionMeasures(partXml, 'S3');
  const demoChords = toDemoChords(s2Rows);
  const playalongChords = toPhraseChords(s3Rows);
  const demoDurationSec = demoChords.length * (60 / bpm) * 4;
  const playalongDurationSec = playalongChords.length * (60 / bpm) * 4;

  return {
    bpm,
    demoMeasureCount: demoChords.length,
    playalongMeasureCount: playalongChords.length,
    demoDurationSec,
    playalongDurationSec,
    demoChords,
    playalongChords,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}` ||
    process.argv[1]?.endsWith('parse-mq-b2-survival-tutorial-xml.mjs')) {
  const parsed = parseMqB2SurvivalTutorialXml();
  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(parsed, null, 2)}\n`);
  } else {
    console.log(`BPM=${parsed.bpm} S2=${parsed.demoMeasureCount} (${parsed.demoDurationSec}s) S3=${parsed.playalongMeasureCount} (${parsed.playalongDurationSec}s)`);
  }
}
