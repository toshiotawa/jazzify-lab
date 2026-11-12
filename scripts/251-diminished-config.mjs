/**
 * II-V-I Diminished Licks コース設定。
 * 28 phrases × 8 bars、4 phrases × 7 stages。
 * 1 stage = 1 block = 1 lesson（レッスン内に 12 キー × バトル/精密 = 24 課題）。
 * BPM 140 / Swing あり。
 */
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KEYS,
  OSMD_PER_CORRECT_NOTE_DAMAGE,
  OSMD_PLAYER_HP,
  enemyHpForTargets,
} from './major-251-licks-config.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const ROOT = resolve(__dirname, '..');

export const UUID_NS = 'a0000000-0000-4000-8000-000000000003';
export const COURSE_KEY = 'course-251-diminished-licks';
export const CDN_BASE = 'https://jazzify-cdn.com/sozai/251-diminished-licks';
export const R2_PREFIX = 'sozai/251-diminished-licks';

export const SOURCE_MUSICXML = resolve('C:/Users/saita/Downloads/Diminished.musicxml');
export const SOURCE_MP3 = resolve('C:/Users/saita/Downloads/diminished (2).mp3');
export const OUT_DIR = join(ROOT, 'public', 'sozai', '251-diminished-licks');
export const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');

/** MP3 尺 384.024s / 224 bars → 140 BPM（XML tempo と一致） */
export const BPM = 140;
export const BEATS_PER_MEASURE = 4;
export const MEASURE_SEC = (60 / BPM) * BEATS_PER_MEASURE; // ≈ 1.7142857142857142
/** Call が Response の 2 小節前から始まる */
export const HAMMER_LEAD_MEASURES = 2;
export const MAX_LOOPS_PER_PHRASE = 4;
export const REQUIRE_ALL_KEYS = false;
/** Call 1-2 → Response 3-4 */
export const CALL_RESPONSE_OFFSET = 2;

export { KEYS, OSMD_PER_CORRECT_NOTE_DAMAGE, OSMD_PLAYER_HP, enemyHpForTargets };

export const COURSE_TITLE = 'II-V-I Diminished Licks';
export const COURSE_TITLE_EN = 'II-V-I Diminished Licks';
export const COURSE_DESC =
  'メジャー II-V-I のディミニッシュリックを、全キー・バトルと精密モードで練習します。';
export const COURSE_DESC_EN =
  'Practice major II-V-I diminished licks in all keys with battle and precision modes.';

/**
 * @typedef {{
 *   stageIndex: number;
 *   phraseFrom: number;
 *   phraseTo: number;
 *   sourceFrom: number;
 *   sourceTo: number;
 *   bodyMeasures: number;
 *   loopMeasures: number;
 *   targetCount: number;
 *   durationSec: number;
 *   blockName: string;
 *   blockNameEn: string;
 * }} DiminishedStageSpec
 */

const PHRASES_PER_STAGE = 4;
const BARS_PER_PHRASE = 8;

/** Voice1 pitch counts after call→response copy (precomputed from source) */
const TARGET_BY_STAGE = {
  1: 104,
  2: 118,
  3: 112,
  4: 104,
  5: 100,
  6: 104,
  7: 106,
};

/** @type {readonly DiminishedStageSpec[]} */
export const DIMINISHED_STAGES = [1, 2, 3, 4, 5, 6, 7].map((stageIndex) => {
  const phraseFrom = (stageIndex - 1) * PHRASES_PER_STAGE + 1;
  const phraseTo = stageIndex * PHRASES_PER_STAGE;
  const sourceFrom = (phraseFrom - 1) * BARS_PER_PHRASE + 1;
  const sourceTo = phraseTo * BARS_PER_PHRASE;
  const bodyMeasures = PHRASES_PER_STAGE * BARS_PER_PHRASE; // 32
  const loopMeasures = bodyMeasures + 1; // + blank count-in bar
  return {
    stageIndex,
    phraseFrom,
    phraseTo,
    sourceFrom,
    sourceTo,
    bodyMeasures,
    loopMeasures,
    targetCount: TARGET_BY_STAGE[stageIndex],
    durationSec: MEASURE_SEC * loopMeasures,
    blockName: `Diminished Stage ${stageIndex}`,
    blockNameEn: `Diminished Stage ${stageIndex}`,
  };
});

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function assetBaseName(stageIndex, keySlug, mode) {
  return `m251-dim-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug */
export function mp3BaseName(stageIndex, keySlug) {
  return `m251-dim-st${stageIndex}-${keySlug}`;
}

/** @param {string} baseName @param {string} ext */
export function cdnUrl(baseName, ext) {
  return `${CDN_BASE}/${baseName}.${ext}`;
}

/** @param {number} stageIndex */
export function lessonKey(stageIndex) {
  return `m251-dim-lesson-st${stageIndex}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function stageKey(stageIndex, keySlug, mode) {
  return `m251-dim-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function phraseKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-ph0`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function lessonSongKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-lsong`;
}
