/**
 * Bluesy Licks precision MusicXML → SMF 変換。
 *
 * Usage:
 *   node --experimental-strip-types scripts/build-bluesy-precision-midi.mjs [musicxml] [output.mid] [bpm]
 *
 * 既定:
 *   public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision_lyrics.musicxml
 *   public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision.mid
 *   BPM 120
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { register } from 'node:module';
import { JSDOM } from 'jsdom';

register('./ts-extension-resolve-hook.mjs', import.meta.url);

const xmlPath = resolve(
  process.cwd(),
  process.argv[2] ?? 'public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision_lyrics.musicxml',
);
const outPath = resolve(
  process.cwd(),
  process.argv[3] ?? 'public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision.mid',
);
const bpm = Number(process.argv[4] ?? '120');
const beatsPerMeasure = 4;
const ticksPerQuarter = 480;

const dom = new JSDOM('');
globalThis.DOMParser = dom.window.DOMParser;

const { buildPrecisionNotesFromMusicXml } = await import(
  resolve(process.cwd(), 'src/utils/earTrainingPrecisionNotes.ts')
);

const xmlText = readFileSync(xmlPath, 'utf8');
const { notes } = buildPrecisionNotesFromMusicXml(xmlText, bpm, beatsPerMeasure);

/** @param {number} value */
const encodeVlq = (value) => {
  let v = value >>> 0;
  const bytes = [v & 0x7f];
  while (v > 0x7f) {
    v >>>= 7;
    bytes.unshift((v & 0x7f) | 0x80);
  }
  return bytes;
};

/** @param {number} sec */
const secToTick = (sec) => Math.max(0, Math.round(sec * ticksPerQuarter * bpm / 60));

/** @type {Array<{ tick: number, kind: 'on' | 'off', midi: number, velocity?: number }>} */
const rawEvents = [];
for (const note of notes) {
  const startTick = secToTick(note.startSec);
  const endTick = Math.max(startTick + 1, secToTick(note.startSec + note.durationSec));
  rawEvents.push({ tick: startTick, kind: 'on', midi: note.midi, velocity: 80 });
  rawEvents.push({ tick: endTick, kind: 'off', midi: note.midi });
}
rawEvents.sort((a, b) => {
  if (a.tick !== b.tick) {
    return a.tick - b.tick;
  }
  if (a.kind === b.kind) {
    return a.midi - b.midi;
  }
  return a.kind === 'off' ? -1 : 1;
});

/** @type {number[]} */
const trackBytes = [];
let previousTick = 0;
const pushDelta = (tick) => {
  trackBytes.push(...encodeVlq(Math.max(0, tick - previousTick)));
  previousTick = tick;
};

pushDelta(0);
const usPerQuarter = Math.round(60_000_000 / bpm);
trackBytes.push(
  0xff, 0x51, 0x03,
  (usPerQuarter >> 16) & 0xff,
  (usPerQuarter >> 8) & 0xff,
  usPerQuarter & 0xff,
);

for (const event of rawEvents) {
  pushDelta(event.tick);
  if (event.kind === 'on') {
    trackBytes.push(0x90, event.midi & 0x7f, (event.velocity ?? 80) & 0x7f);
  } else {
    trackBytes.push(0x80, event.midi & 0x7f, 0x40);
  }
}
pushDelta(previousTick);
trackBytes.push(0xff, 0x2f, 0x00);

/** @param {number} value */
const writeUint32 = (value) => [
  (value >>> 24) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 8) & 0xff,
  value & 0xff,
];

/** @param {number} value */
const writeUint16 = (value) => [(value >> 8) & 0xff, value & 0xff];

const header = [
  ...[0x4d, 0x54, 0x68, 0x64],
  ...writeUint32(6),
  ...writeUint16(0),
  ...writeUint16(1),
  ...writeUint16(ticksPerQuarter),
];
const trackChunk = [
  ...[0x4d, 0x54, 0x72, 0x6b],
  ...writeUint32(trackBytes.length),
  ...trackBytes,
];
const output = new Uint8Array([...header, ...trackChunk]);
writeFileSync(outPath, output);

console.log(`Wrote ${outPath} (${notes.length} notes, ${output.length} bytes)`);
