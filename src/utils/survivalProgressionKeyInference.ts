/**
 * Progression の各コードに調号度数 key_fifths（MusicXML の fifths と同趣旨 -7…7）を推定する。
 * DB への焼き込みおよびクライアントのフォールバックを想定したヒューリスティック。
 *
 * 調号は常に「長調トニック」の fifths で表現する（マイナー調の別クランプは持たない）。
 * 短調 i やマイナー始まりは、ルート音を共有する長調（平行長調）の fifths を使う。
 */
import { note as parseTonalNote } from 'tonal';

import type { SurvivalProgressionVoicingKind } from './survivalProgressionVoicings';

export interface SurvivalChordClass {
  readonly root: string;
  readonly kind: SurvivalProgressionVoicingKind;
}

const MINOR_II_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set(['m7', 'm7_9', 'm7b5']);

const DOMINANT_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set([
  '7_9_13', '7_9', '7_b9_b13', 'dom7', 'aug7',
]);

const MAJOR_TONIC_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set([
  'M7_9', 'mM7_9', '6_9',
]);

const MINOR_SONORITIES_AT_TONIC = new Set<SurvivalProgressionVoicingKind>([
  'm7',
  'm7_9',
  'mM7_9',
  'm7b5',
  'm6_9',
]);

/**
 * メジャー tonic のクロマ → key fifths（-6..+5 の範囲で返す）
 *
 * 仕様メモ:
 * - F#（chroma 6）は採用せず、Gb（-6）に固定する。これにより AI Agent に
 *   「Key of Gb」を依頼した結果が誤って +6 と解釈されるリスクを排除する。
 * - したがって戻り値の取り得る範囲は -6..+5（12 キー）。
 */
export const chromaMajorKeyFifths = (chromaPitchClass: number): number => {
  const chr = ((Math.trunc(chromaPitchClass) % 12) + 12) % 12;
  const chromaMap: Record<number, number> = {
    0: 0,
    1: -5,
    2: 2,
    3: -3,
    4: 4,
    5: -1,
    6: -6,
    7: 1,
    8: -4,
    9: 3,
    10: -2,
    11: 5,
  };
  const v = chromaMap[chr];
  return typeof v === 'number' ? v : 0;
};

/** 長調トニック名 → fifths（調号は長調のルールのみ） */
export const tonicRootMajorKeyFifths = (majorLikeRoot: string): number => {
  const n = parseTonalNote(`${majorLikeRoot}4`);
  if (!n || typeof n.chroma !== 'number') return 0;
  return chromaMajorKeyFifths(n.chroma);
};

export interface BuildProgressionChordKeyFifthsOptions {
  /**
   * セクション先頭など、推定ではなく明示で先頭コードの fifths を固定する。
   * 指定時は index 0 の種別ベースのシードをスキップする。
   */
  readonly forcedFirstFifths?: number;
}

/** 採用範囲は -6..+5（F# キーは Gb で表現する方針） */
const clampFifths = (k: number): number => Math.max(-6, Math.min(5, Math.trunc(k)));

/** 並び順はコード配列と同じ長さ。null は分類不能。 */
export const buildProgressionChordKeyFifths = (
  classes: readonly (SurvivalChordClass | null)[],
  options?: BuildProgressionChordKeyFifthsOptions,
): readonly number[] => {
  const len = classes.length;
  const raw = new Float64Array(len).fill(Number.NaN);
  const forced = options?.forcedFirstFifths;

  for (let i = 0; i < len; i += 1) {
    const c = classes[i];
    if (!c || i !== 0) continue;

    if (typeof forced === 'number') {
      raw[i] = forced;
      continue;
    }

    /** マイナー系・m6(9) 開始 → 平行長調（ルート共有のメジャー）の fifths */
    if (MINOR_SONORITIES_AT_TONIC.has(c.kind)) {
      raw[i] = tonicRootMajorKeyFifths(c.root);
      continue;
    }

    if (MAJOR_TONIC_KINDS.has(c.kind)) {
      raw[i] = tonicRootMajorKeyFifths(c.root);
      continue;
    }

    if (DOMINANT_KINDS.has(c.kind)) {
      raw[i] = tonicRootMajorKeyFifths(c.root);
    }
  }

  for (let i = 0; i + 2 < len; i += 1) {
    if (typeof forced === 'number' && i === 0) {
      continue;
    }
    const ii = classes[i];
    const v = classes[i + 1];
    const ic = classes[i + 2];
    if (!ii || !v || !ic) continue;

    /** iiø - V - i: i を平行長調の fifths で扱う */
    if (
      ii.kind === 'm7b5'
      && DOMINANT_KINDS.has(v.kind)
      && (ic.kind === 'm7' || ic.kind === 'm6_9')
    ) {
      const kk = tonicRootMajorKeyFifths(ic.root);
      raw[i] = kk;
      raw[i + 1] = kk;
      raw[i + 2] = kk;
      continue;
    }

    if (!MINOR_II_KINDS.has(ii.kind) || ii.kind === 'm7b5') continue;

    if (!DOMINANT_KINDS.has(v.kind)) continue;

    if (!MAJOR_TONIC_KINDS.has(ic.kind)) continue;

    const kk = tonicRootMajorKeyFifths(ic.root);

    raw[i] = kk;

    raw[i + 1] = kk;

    raw[i + 2] = kk;
  }

  let running = chromaMajorKeyFifths(0);

  for (let i = 0; i < len; i += 1) {
    if (!Number.isNaN(raw[i])) {
      running = raw[i];
      continue;
    }

    raw[i] = running;
  }

  running = chromaMajorKeyFifths(0);

  for (let i = len - 1; i >= 0; i -= 1) {
    if (!Number.isNaN(raw[i])) {
      running = raw[i];
    } else {
      raw[i] = running;
    }
  }

  return Array.from(raw, k => clampFifths(k));
};
