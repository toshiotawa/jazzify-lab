/**
 * Bluesy Licks コース: フレーズ定義・パス・UUID キー。
 */
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const ROOT = resolve(__dirname, '..');

export const UUID_NS = 'a0000000-0000-4000-8000-000000000001';
export const COURSE_KEY = 'course-bluesy-licks';
export const CDN_BASE = 'https://jazzify-cdn.com/sozai/bluesy-licks';

export const SOURCE_DIR = join(ROOT, 'public', 'sozai', 'new', 'Bluesy Licks');
export const COMBINED_MUSICXML = join(SOURCE_DIR, 'Bluesy Licks.musicxml');
export const OUT_DIR = join(ROOT, 'public', 'sozai', 'bluesy-licks');

export const BEATS_PER_MEASURE = 4;
export const KEY_FIFTHS = -1;
export const LOOP_COUNT = 4;

/** @typedef {{ phraseIndex: number; bpm: number; bodyMeasures: number; sourceFrom: number; sourceTo: number; padToBodyMeasures?: number; standaloneMusicXml?: string }} BluesyLicksPhraseSpec */

/** @type {readonly BluesyLicksPhraseSpec[]} */
export const PHRASE_SPECS = [
  { phraseIndex: 1, bpm: 240, bodyMeasures: 8, sourceFrom: 2, sourceTo: 9 },
  { phraseIndex: 2, bpm: 160, bodyMeasures: 8, sourceFrom: 11, sourceTo: 18 },
  { phraseIndex: 3, bpm: 160, bodyMeasures: 8, sourceFrom: 20, sourceTo: 27 },
  { phraseIndex: 4, bpm: 200, bodyMeasures: 8, sourceFrom: 29, sourceTo: 36 },
  { phraseIndex: 5, bpm: 240, bodyMeasures: 8, sourceFrom: 38, sourceTo: 45 },
  { phraseIndex: 6, bpm: 160, bodyMeasures: 8, sourceFrom: 47, sourceTo: 54 },
  { phraseIndex: 7, bpm: 240, bodyMeasures: 8, sourceFrom: 56, sourceTo: 63 },
  { phraseIndex: 8, bpm: 300, bodyMeasures: 12, sourceFrom: 2, sourceTo: 13, standaloneMusicXml: '8.musicxml' },
  { phraseIndex: 9, bpm: 240, bodyMeasures: 8, sourceFrom: 68, sourceTo: 75 },
  { phraseIndex: 10, bpm: 160, bodyMeasures: 8, sourceFrom: 77, sourceTo: 84 },
  { phraseIndex: 11, bpm: 300, bodyMeasures: 8, sourceFrom: 86, sourceTo: 93 },
];

/** @param {number} phraseIndex @param {boolean} slow */
export function phraseAssetBase(phraseIndex, slow) {
  const spec = PHRASE_SPECS.find((p) => p.phraseIndex === phraseIndex);
  if (!spec) {
    throw new Error(`Unknown phrase ${phraseIndex}`);
  }
  const slug = String(phraseIndex).padStart(2, '0');
  if (slow) {
    return `bluesy-licks-${slug}-${spec.bpm / 2}_slow`;
  }
  return `bluesy-licks-${slug}-${spec.bpm}`;
}

/** @param {number} phraseIndex */
export function sourceMp3Path(phraseIndex) {
  const spec = PHRASE_SPECS.find((p) => p.phraseIndex === phraseIndex);
  if (!spec) {
    throw new Error(`Unknown phrase ${phraseIndex}`);
  }
  return join(SOURCE_DIR, `${phraseIndex}_${spec.bpm}.mp3`);
}

/** @param {number} bpm @param {number} bodyMeasures @param {number} [loopCount] */
export function expectedBodySec(bpm, bodyMeasures, loopCount = LOOP_COUNT) {
  const measureSec = (60 / bpm) * BEATS_PER_MEASURE;
  return measureSec * bodyMeasures * loopCount;
}

/** @param {number} bpm @param {number} bodyMeasures @param {number} [loopCount] */
export function expectedTotalSec(bpm, bodyMeasures, loopCount = LOOP_COUNT) {
  const countInSec = (60 / bpm) * BEATS_PER_MEASURE;
  return countInSec + expectedBodySec(bpm, bodyMeasures, loopCount);
}

/** @param {number} bpm @param {number} bodyMeasures */
export function loopDurationSec(bpm, bodyMeasures) {
  return expectedTotalSec(bpm, bodyMeasures, LOOP_COUNT);
}

/** @param {number} phraseIndex @param {boolean} slow */
export function cdnUrl(baseName, ext) {
  return `${CDN_BASE}/${baseName}.${ext}`;
}

/** @param {number} bpm */
export function isOptionalNormalTempo(bpm) {
  return bpm >= 240;
}

/** @param {number} phraseIndex */
export function mergedLessonKey(phraseIndex) {
  return `bl-${phraseIndex}`;
}

/** @param {number} phraseIndex @param {boolean} slow */
export function lessonKey(phraseIndex, slow) {
  return `bl-${phraseIndex}-${slow ? 'slow' : 'normal'}`;
}

/** @param {number} phraseIndex @param {boolean} slow */
export function stageKey(phraseIndex, slow) {
  return `bl-stage-${phraseIndex}-${slow ? 'slow' : 'normal'}`;
}
