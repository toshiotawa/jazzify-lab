/**
 * II-V-I Short 1Bar コース設定。
 * 16 phrases × 4 bars を 5/5/6 の 3 ステージに分割。
 * 1 stage = 1 block = 1 lesson（レッスン内に 12 キー × バトル/精密 = 24 課題）。
 */
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { KEY_FIFTHS as FIFTHS_MAP } from './musicxml-transpose-utils.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
export const ROOT = resolve(__dirname, '..');

export const UUID_NS = 'a0000000-0000-4000-8000-000000000001';
export const COURSE_KEY = 'course-major-251-bebop-licks';
export const CDN_BASE = 'https://jazzify-cdn.com/sozai/major-251-licks';
export const R2_PREFIX = 'sozai/major-251-licks';

export const SOURCE_MUSICXML = resolve('C:/Users/saita/Downloads/1Bar.musicxml');
export const SOURCE_MP3 = resolve('C:/Users/saita/Downloads/1 Bar.mp3');
export const OUT_DIR = join(ROOT, 'public', 'sozai', 'major-251-licks');
export const CLICK_MP3 = join(ROOT, 'public', 'drumstick-count.mp3');

export const BPM = 100;
export const BEATS_PER_MEASURE = 4;
export const MEASURE_SEC = (60 / BPM) * BEATS_PER_MEASURE; // 2.4
export const HAMMER_LEAD_MEASURES = 1;
export const MAX_LOOPS_PER_PHRASE = 4;
/** C キーのバトル/精密のみ必須。他キーは任意。 */
export const REQUIRE_ALL_KEYS = false;

export const COURSE_TITLE = 'II-V-I Short 1Bar';
export const COURSE_TITLE_EN = 'II-V-I Short 1Bar';
export const COURSE_DESC =
  'メジャー II-V-I の Short 1Bar ビバップリックを、全キー・バトルと精密モードで練習します。';
export const COURSE_DESC_EN =
  'Practice major II-V-I Short 1Bar bebop licks in all keys with battle and precision modes.';

/**
 * @typedef {{
 *   slug: string;
 *   key: string;
 *   semitones: number;
 *   label: string;
 *   fifths: number;
 * }} Major251KeySpec
 */

/** @type {readonly Major251KeySpec[]} */
export const KEYS = [
  { slug: 'c', key: 'C', semitones: 0, label: 'C', fifths: FIFTHS_MAP.C },
  { slug: 'db', key: 'Db', semitones: 1, label: '+1st_Db', fifths: FIFTHS_MAP.Db },
  { slug: 'd', key: 'D', semitones: 2, label: '+2st_D', fifths: FIFTHS_MAP.D },
  { slug: 'eb', key: 'Eb', semitones: 3, label: '+3st_Eb', fifths: FIFTHS_MAP.Eb },
  { slug: 'e', key: 'E', semitones: 4, label: '+4st_E', fifths: FIFTHS_MAP.E },
  { slug: 'f', key: 'F', semitones: 5, label: '+5st_F', fifths: FIFTHS_MAP.F },
  { slug: 'gb', key: 'Gb', semitones: 6, label: '+6st_Gb', fifths: FIFTHS_MAP.Gb },
  { slug: 'g', key: 'G', semitones: -5, label: '-5st_G', fifths: FIFTHS_MAP.G },
  { slug: 'ab', key: 'Ab', semitones: -4, label: '-4st_Ab', fifths: FIFTHS_MAP.Ab },
  { slug: 'a', key: 'A', semitones: -3, label: '-3st_A', fifths: FIFTHS_MAP.A },
  { slug: 'bb', key: 'Bb', semitones: -2, label: '-2st_Bb', fifths: FIFTHS_MAP.Bb },
  { slug: 'b', key: 'B', semitones: -1, label: '-1st_B', fifths: FIFTHS_MAP.B },
];

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
 * }} Major251StageSpec
 */

const BARS_PER_PHRASE = 4;
/** ステージごとのフレーズ数（16 phrases → 5 / 5 / 6） */
const PHRASES_PER_STAGE = [5, 5, 6];
/** Call 小節の pitch ノート数（Response へコピー後の Voice1 ターゲット数） */
const PHRASE_TARGET_COUNTS = [
  12, 12, 14, 12, 12, 12, 16, 12,
  12, 12, 12, 12, 12, 12, 12, 12,
];

/** Short 1Bar: 3 stages（1 stage = 1 block = 1 lesson、レッスン内に 12 キー） */
/** @type {readonly Major251StageSpec[]} */
export const SHORT_1BAR_STAGES = PHRASES_PER_STAGE.map((phraseCount, i) => {
  const stageIndex = i + 1;
  const phraseFrom = PHRASES_PER_STAGE.slice(0, i).reduce((sum, n) => sum + n, 0) + 1;
  const phraseTo = phraseFrom + phraseCount - 1;
  const bodyMeasures = phraseCount * BARS_PER_PHRASE;
  const loopMeasures = bodyMeasures + 1; // + blank count-in bar
  const targetCount = PHRASE_TARGET_COUNTS
    .slice(phraseFrom - 1, phraseTo)
    .reduce((sum, n) => sum + n, 0);
  return {
    stageIndex,
    phraseFrom,
    phraseTo,
    sourceFrom: (phraseFrom - 1) * BARS_PER_PHRASE + 1,
    sourceTo: phraseTo * BARS_PER_PHRASE,
    bodyMeasures,
    loopMeasures,
    targetCount,
    durationSec: MEASURE_SEC * loopMeasures,
    blockName: `Short 1Bar Stage ${stageIndex}`,
    blockNameEn: `Short 1Bar Stage ${stageIndex}`,
  };
});

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function assetBaseName(stageIndex, keySlug, mode) {
  return `m251-s1-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug */
export function mp3BaseName(stageIndex, keySlug) {
  return `m251-s1-st${stageIndex}-${keySlug}`;
}

/** @param {string} baseName @param {string} ext */
export function cdnUrl(baseName, ext) {
  return `${CDN_BASE}/${baseName}.${ext}`;
}

/** @param {number} stageIndex */
export function lessonKey(stageIndex) {
  return `m251-s1-lesson-st${stageIndex}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function stageKey(stageIndex, keySlug, mode) {
  return `m251-s1-st${stageIndex}-${keySlug}-${mode}`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function phraseKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-ph0`;
}

/** @param {number} stageIndex @param {string} keySlug @param {'osmd' | 'precision'} mode */
export function lessonSongKey(stageIndex, keySlug, mode) {
  return `${stageKey(stageIndex, keySlug, mode)}-lsong`;
}

/** OSMD バトル: 正解1音あたりの敵ダメージ */
export const OSMD_PER_CORRECT_NOTE_DAMAGE = 50;
/** OSMD バトル: プレイヤー最大HP（miss_damage=5 × 30回で負け） */
export const OSMD_PLAYER_HP = 150;
/**
 * 敵HP。`targetCount * perNoteDamage * 2`（約2周分）。
 * @param {number} targetCount
 * @param {number} [perNoteDamage=OSMD_PER_CORRECT_NOTE_DAMAGE]
 */
export function enemyHpForTargets(targetCount, perNoteDamage = OSMD_PER_CORRECT_NOTE_DAMAGE) {
  return targetCount * perNoteDamage * 2;
}
