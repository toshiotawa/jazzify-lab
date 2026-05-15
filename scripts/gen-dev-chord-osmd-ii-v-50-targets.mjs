/**
 * `public/II-V-I_1-50/II-V 50 - 01-05_C.musicxml` 相当のパート P1 から
 * ear_training_phrase_chords 用の VALUES 行を stdout に出す（開発者 chord_osmd 用）。
 *
 * Usage:
 *   node scripts/gen-dev-chord-osmd-ii-v-50-targets.mjs [path/to/file.musicxml]
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { JSDOM } from 'jsdom';

const ROOT = resolve(import.meta.dirname, '..');
const DEFAULT_XML = resolve(ROOT, 'public', 'fantasy-bgm', 'ear-training-dev-chord-osmd-ii-v-50-01-05-c-v1.musicxml');


const ACC_NAMES = {
  '-2': 'bb',
  '-1': 'b',
  0: '',
  1: '#',
  2: 'x',
};

function pitchToNoteName(step, alter, octave) {
  const named = ACC_NAMES[String(alter)];
  const accStr = named ?? (alter > 0 ? '#'.repeat(alter) : 'b'.repeat(-alter));
  return `${step}${accStr}${octave}`;
}

function parsePositiveInt(text) {
  const n = Number.parseInt(text, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readMeasureTiming(attributes, previous) {
  if (!attributes) {
    return previous;
  }
  const divEl = attributes.getElementsByTagName('divisions')[0];
  const divisions = divEl?.textContent?.trim()
    ? parsePositiveInt(divEl.textContent.trim())
    : previous.divisions;
  const timeEl = attributes.getElementsByTagName('time')[0];
  let beats = previous.beats;
  let beatType = previous.beatType;
  if (timeEl) {
    const b = timeEl.getElementsByTagName('beats')[0]?.textContent?.trim();
    const bt = timeEl.getElementsByTagName('beat-type')[0]?.textContent?.trim();
    if (b) {
      const pb = parsePositiveInt(b);
      if (pb) beats = pb;
    }
    if (bt) {
      const pbt = parsePositiveInt(bt);
      if (pbt) beatType = pbt;
    }
  }
  return { divisions, beats, beatType };
}

function main() {
  const xmlPath = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_XML;
  const xmlText = readFileSync(xmlPath, 'utf8');
  const doc = new JSDOM(xmlText, { contentType: 'text/xml' }).window.document;

  const part = doc.querySelector('part[id="P1"]') ?? doc.getElementsByTagName('part')[0];
  if (!part) {
    throw new Error('No part found');
  }

  const BPM = 160;
  const beatSec = 60 / BPM;
  let timing = { divisions: 12, beats: 4, beatType: 4 };
  let globalDivisions = 0;
  let lastHarmonyLabel = '?';

  const measures = part.getElementsByTagName('measure');
  const rows = [];

  for (const measure of measures) {
    timing = readMeasureTiming(measure.getElementsByTagName('attributes')[0], timing);
    const measureNumber = parsePositiveInt(measure.getAttribute('number') ?? '') ?? 1;

    let positionInMeasure = 0;

    for (const child of measure.children) {
      if (child.tagName === 'harmony') {
        const rootStep = child.getElementsByTagName('root-step')[0]?.textContent?.trim() ?? '?';
        const kind = child.getElementsByTagName('kind')[0]?.getAttribute('text')?.trim()
          ?? child.getElementsByTagName('kind')[0]?.textContent?.trim()
          ?? '';
        lastHarmonyLabel = kind ? `${rootStep}${kind}` : rootStep;
        continue;
      }

      if (child.tagName !== 'note') {
        continue;
      }

      if (child.getElementsByTagName('chord').length > 0) {
        continue;
      }

      if (child.getElementsByTagName('rest').length > 0) {
        const durationEl = child.getElementsByTagName('duration')[0];
        const d = durationEl?.textContent?.trim()
          ? parsePositiveInt(durationEl.textContent.trim())
          : null;
        if (d) {
          globalDivisions += d;
          positionInMeasure += d;
        }
        continue;
      }

      const durationEl = child.getElementsByTagName('duration')[0];
      const d = durationEl?.textContent?.trim()
        ? parsePositiveInt(durationEl.textContent.trim())
        : null;
      if (!d) {
        continue;
      }

      const pitchEl = child.getElementsByTagName('pitch')[0];
      if (!pitchEl) {
        globalDivisions += d;
        positionInMeasure += d;
        continue;
      }

      const step = pitchEl.getElementsByTagName('step')[0]?.textContent?.trim();
      const octaveTxt = pitchEl.getElementsByTagName('octave')[0]?.textContent?.trim();
      const alterEl = pitchEl.getElementsByTagName('alter')[0];
      const alter = alterEl?.textContent?.trim() ? Number.parseInt(alterEl.textContent.trim(), 10) : 0;
      if (!step || !octaveTxt) {
        globalDivisions += d;
        positionInMeasure += d;
        continue;
      }
      const octave = Number.parseInt(octaveTxt, 10);

      const startQuarter = globalDivisions / timing.divisions;
      const durQuarter = d / timing.divisions;
      const startTimeSec = startQuarter * beatSec;
      const endTimeSec = (startQuarter + durQuarter) * beatSec;

      const positionQuarterInMeasure = positionInMeasure / timing.divisions;
      const beatOffset = Math.min(timing.beats, Math.max(1, Math.floor(positionQuarterInMeasure) + 1));

      const noteName = pitchToNoteName(step, Number.isFinite(alter) ? alter : 0, octave);

      const staffEl = child.getElementsByTagName('staff')[0];
      const staffNum = staffEl?.textContent?.trim() ? Number.parseInt(staffEl.textContent.trim(), 10) : 1;
      const staves = Number.isFinite(staffNum) && staffNum > 0 ? staffNum : 1;

      rows.push({
        measureNumber,
        beatOffset,
        durationBeats: durQuarter,
        startTimeSec,
        endTimeSec,
        chordName: lastHarmonyLabel.replace(/'/g, "''"),
        noteName,
        staff: staves,
      });

      globalDivisions += d;
      positionInMeasure += d;
    }
  }

  const ns = `'a0000000-0000-4000-8000-000000000001'::uuid`;

  rows.forEach((row, idx) => {
    const id = `dev-ear-osmd160-ii50-p1-${String(idx).padStart(4, '0')}`;
    const chordEsc = row.chordName.replace(/'/g, "''");
    console.log(`  (\n    uuid_generate_v5(${ns}, '${id}'),\n    uuid_generate_v5(${ns}, 'dev-ear-osmd120-ph1'),\n    ${idx},\n    '${chordEsc}',\n    ${row.measureNumber},\n    ${row.beatOffset},\n    ${row.durationBeats},\n    ${row.startTimeSec.toFixed(6)},\n    ${row.endTimeSec.toFixed(6)},\n    ARRAY['${row.noteName}']::text[],\n    ARRAY[${row.staff}]::smallint[]\n  )${idx < rows.length - 1 ? ',' : ''}`);
  });

  console.error(`-- note_count=${rows.length} loop_duration_sec=${(globalDivisions / timing.divisions) * beatSec}`);
}

main();
