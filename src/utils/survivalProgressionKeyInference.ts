/**
 * Progression の各コードに調号度数 key_fifths（MusicXML の fifths と同趣旨 -7…7）を推定する。
 * DB への焼き込みおよびクライアントのフォールバックを想定したヒューリスティック。
 */
import { note as parseTonalNote } from 'tonal';

import type { SurvivalProgressionVoicingKind } from './survivalProgressionVoicings';

export interface SurvivalChordClass {
  readonly root: string;
  readonly kind: SurvivalProgressionVoicingKind;
}

const MINOR_II_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set(['m7', 'm7b5']);

const DOMINANT_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set([
  '7_9_13', '7_9', '7_b9_b13', 'dom7', 'aug7',
]);

const MAJOR_TONIC_KINDS: ReadonlySet<SurvivalProgressionVoicingKind> = new Set([
  'M7_9', 'mM7_9', '6_9',
]);

/** メジャー tonic のクロマ → key fifths */
export const chromaMajorKeyFifths = (chromaPitchClass: number): number => {
  const chr = ((Math.trunc(chromaPitchClass) % 12) + 12) % 12;
  const chromaMap: Record<number, number> = {
    0: 0,
    1: -5,
    2: 2,
    3: -3,
    4: 4,
    5: -1,
    6: 6,
    7: 1,
    8: -4,
    9: 3,
    10: -2,
    11: 5,
  };
  const v = chromaMap[chr];
  return typeof v === 'number' ? v : 0;
};

/** ナチュラルマイナーの調号度数（長調 tonic +3 半音） */
export const minorRootAeolianKeyFifths = (minorRoot: string): number => {
  const nRef = parseTonalNote(`${minorRoot}4`);
  if (!nRef || typeof nRef.chroma !== 'number') return 0;
  const relativeMajorChrom = (((nRef.chroma + 3) % 12) + 12) % 12;
  return chromaMajorKeyFifths(relativeMajorChrom);
};

export const tonicRootMajorKeyFifths = (majorLikeRoot: string): number => {
  const n = parseTonalNote(`${majorLikeRoot}4`);
  if (!n || typeof n.chroma !== 'number') return 0;
  return chromaMajorKeyFifths(n.chroma);
};

const clampFifths = (k: number): number => Math.max(-7, Math.min(7, Math.trunc(k)));

/** 並び順はコード配列と同じ長さ。null は分類不能。 */
export const buildProgressionChordKeyFifths = (
  classes: readonly (SurvivalChordClass | null)[],
): readonly number[] => {
  const len = classes.length;
  const raw = new Float64Array(len).fill(Number.NaN);

  for (let i = 0; i < len; i += 1) {
    const c = classes[i];
    if (!c || i !== 0) continue;

    /** 開始コードがマイナー系 → Aeolian 調号へ */
    if (c.kind === 'm7' || c.kind === 'mM7_9' || c.kind === 'm7b5') {
      raw[i] = minorRootAeolianKeyFifths(c.root);

      continue;
    }

    /** メジャートニック開始（ブラスアウトライン等） */
    if (MAJOR_TONIC_KINDS.has(c.kind)) {

      raw[i] = tonicRootMajorKeyFifths(c.root);

      continue;


    }


    /** ドミナント開始（ブルーズ等）*/


    if (DOMINANT_KINDS.has(c.kind)) {


      raw[i] = tonicRootMajorKeyFifths(c.root);


    }


  }

  for (let i = 0; i + 2 < len; i += 1) {
    const ii = classes[i];
    const v = classes[i + 1];
    const ic = classes[i + 2];
    if (!ii || !v || !ic) continue;

    /** iiø - V - i(min) */

    if (ii.kind === 'm7b5' && DOMINANT_KINDS.has(v.kind) && ic.kind === 'm7') {
      const kk = minorRootAeolianKeyFifths(ic.root);
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


  /** 前方伝播 */


  let running = chromaMajorKeyFifths(0);


  for (let i = 0; i < len; i += 1) {


    if (!Number.isNaN(raw[i])) {


      running = raw[i];


      continue;


    }


    raw[i] = running;

  }


  /** 後方伝播 */


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
