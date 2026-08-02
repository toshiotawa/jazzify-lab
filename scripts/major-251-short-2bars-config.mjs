/**
 * Major II-V-I Bebop Lick (Short II-V 2 Bars) コース設定。
 * 20 phrases × 8 bars、4 phrases × 5 stages。
 * 1 stage = 1 block、1 key = 1 lesson（バトル+精密）。
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

export const UUID_NS = 'a0000000-0000-4000-8000-000000000002';
export const COURSE_KEY = 'course-major-251-short-2bars';
export const CDN_BASE = 'https://jazzify-cdn.com/sozai/major-251-short-2bars';
export const R2_PREFIX = 'sozai/major-251-short-2bars';

export const SOURCE_MUSICXML = resolve('C:/Users/saita/Downloads/Short II-V-I 2bars.musicxml');
export const SOURCE_MP3 = resolve('C:/Users/saita/Downloads/Short II-V-I 2bars.mp3');
export const OUT_DIR = join(ROOT, 'public', 'sozai', 'major-251-short-2bars');
export const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');

/** MP3 尺 320s / 160 bars → 120 BPM（XML tempo と一致） */
export const BPM = 120;
export const BEATS_PER_MEASURE = 4;
export const MEASURE_SEC = (60 / BPM) * BEATS_PER_MEASURE; // 2.0
/** Call が Response の 2 小節前から始まる */
export const HAMMER_LEAD_MEASURES = 2;
export const MAX_LOOPS_PER_PHRASE = 4;
export const REQUIRE_ALL_KEYS = false;
/** Call 1-2 → Response 3-4 */
export const CALL_RESPONSE_OFFSET = 2;

export { KEYS, OSMD_PER_CORRECT_NOTE_DAMAGE, OSMD_PLAYER_HP, enemyHpForTargets };

export const COURSE_TITLE = 'Major II-V-I Bebop Lick (Short II-V 2 Bars)';
export const COURSE_TITLE_EN = 'Major II-V-I Bebop Lick (Short II-V 2 Bars)';
export const COURSE_DESC =
  'メジャー II-V-I の Short II-V（2小節 Call / Response）リックを、全キー・バトルと精密モードで練習します。';
export const COURSE_DESC_EN =
  'Practice major II-V-I short II-V (2-bar call/response) bebop licks in all keys with battle and precision modes.';

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
 * }} Major251Short2BarsStageSpec
 */

const PHRASES_PER_STAGE = 4;
const BARS_PER_PHRASE = 8;

/** @type {readonly Major251Short2BarsStageSpec[]} */
export const SHORT_2BARS_STAGES = [1, 2, 3, 4, 5].map((stageIndex) => {
  const phraseFrom = (stageIndex - 1) * PHRASES_PER_STAGE + 1;
  const phraseTo = stageIndex * PHRASES_PER_STAGE;
  const sourceFrom = (phraseFrom - 1) * BARS_PER_PHRASE + 1;
  const sourceTo = phraseTo * BARS_PER_PHRASE;
  const bodyMeasures = PHRASES_PER_STAGE * BARS_PER_PHRASE; // 32
  const loopMeasures = bodyMeasures + 1; // + blank count-in bar
  // Voice1 pitch counts after call→response copy (precomputed from source)
  const targetByStage = {
    1: 72,
    2: 72,
    3: 78,
    4: 74,
    5: 74,
  };
  return {
    stageIndex,
    phraseFrom,
    phraseTo,
    sourceFrom,
    sourceTo,
    bodyMeasures,
    loopMeasures,
    targetCount: targetByStage[stageIndex],
    durationSec: MEASURE_SEC * loopMeasures,
    blockName: `Short II-V 2Bars Stage ${stageIndex}`,
    blockNameEn: `Short II-V 2Bars Stage ${stageIndex}`,
  };
});

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function assetBaseName(stageIndex, keySlug, mode) {
  return `m251-s2-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug */
export function mp3BaseName(stageIndex, keySlug) {
  return `m251-s2-st${stageIndex}-${keySlug}`;
}

/** @param {string} baseName @param {string} ext */
export function cdnUrl(baseName, ext) {
  return `${CDN_BASE}/${baseName}.${ext}`;
}

/** @param {number} stageIndex @param {string} keySlug */
export function lessonKey(stageIndex, keySlug) {
  return `m251-s2-lesson-st${stageIndex}-${keySlug}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function stageKey(stageIndex, keySlug, mode) {
  return `m251-s2-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function phraseKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-ph0`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function lessonSongKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-lsong`;
}
