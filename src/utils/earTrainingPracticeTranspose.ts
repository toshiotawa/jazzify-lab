import { getPreferredTargetKey, transposeMusicXml } from '@/utils/musicXmlTransposer';

/** 練習移調の半音オフセット下限 */
export const PRACTICE_TRANSPOSE_MIN = -6;

/** 練習移調の半音オフセット上限 */
export const PRACTICE_TRANSPOSE_MAX = 6;

const FIFTHS_TO_KEY_NAME: Record<number, string> = {
  [-7]: 'Cb',
  [-6]: 'Gb',
  [-5]: 'Db',
  [-4]: 'Ab',
  [-3]: 'Eb',
  [-2]: 'Bb',
  [-1]: 'F',
  0: 'C',
  1: 'G',
  2: 'D',
  3: 'A',
  4: 'E',
  5: 'B',
  6: 'F#',
  7: 'C#',
};

const clampKeyFifths = (fifths: number): number => Math.max(-7, Math.min(7, fifths));

/**
 * 練習移調オフセットを ±6 の符号付き最短経路へ揃える。
 * 例: +10 → -2（F→Eb）。-10 など下限外は -6 へクランプ。
 */
export const normalizeSignedSemitoneOffset = (offset: number): number => {
  const truncated = Math.trunc(offset);
  if (truncated >= PRACTICE_TRANSPOSE_MIN && truncated <= PRACTICE_TRANSPOSE_MAX) {
    return truncated;
  }
  if (truncated < PRACTICE_TRANSPOSE_MIN) {
    return PRACTICE_TRANSPOSE_MIN;
  }
  let wrapped = truncated % 12;
  if (wrapped < 0) {
    wrapped += 12;
  }
  if (wrapped > 6) {
    wrapped -= 12;
  }
  return Math.max(PRACTICE_TRANSPOSE_MIN, Math.min(PRACTICE_TRANSPOSE_MAX, wrapped));
};

export const clampPracticeTransposeOffset = (offset: number): number =>
  normalizeSignedSemitoneOffset(offset);

/**
 * MusicXML 先頭の `<key><fifths>` を読む（`musicXmlTransposer` と同等）。
 */
export const readKeyFifthsFromMusicXml = (xmlString: string): number => {
  const match = /<key[^>]*>[\s\S]*?<fifths>(-?\d+)<\/fifths>[\s\S]*?<\/key>/i.exec(xmlString);
  if (!match) {
    const fallback = /<fifths>(-?\d+)<\/fifths>/i.exec(xmlString);
    if (!fallback) {
      return 0;
    }
    const parsed = Number.parseInt(fallback[1], 10);
    return Number.isFinite(parsed) ? clampKeyFifths(parsed) : 0;
  }
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? clampKeyFifths(parsed) : 0;
};

/** 五度圏 fifths → 読みやすいキー名 */
export const fifthsToPreferredKeyName = (fifths: number): string => {
  const clamped = clampKeyFifths(fifths);
  const raw = FIFTHS_TO_KEY_NAME[clamped] ?? 'C';
  if (raw === 'F#') {
    return 'Gb';
  }
  if (raw === 'C#') {
    return 'Db';
  }
  if (raw === 'Cb') {
    return 'B';
  }
  return raw;
};

/** 原調 fifths + 半音オフセット → 移調先キー名 */
export const getPracticeTransposeTargetKeyName = (
  originalFifths: number,
  semitoneOffset: number,
): string => {
  const originalKeyName = fifthsToPreferredKeyName(originalFifths);
  return getPreferredTargetKey(originalKeyName, semitoneOffset);
};

export const formatPracticeTransposeOffsetLabel = (offset: number): string => {
  if (offset > 0) {
    return `+${offset}`;
  }
  return String(offset);
};

/** 正規化済み MusicXML に練習移調を適用する。offset=0 は入力をそのまま返す。 */
export const applyPracticeTransposeToMusicXml = (
  baseXml: string,
  offset: number,
): string => {
  const clamped = clampPracticeTransposeOffset(offset);
  if (clamped === 0) {
    return baseXml;
  }
  return transposeMusicXml(baseXml, clamped);
};
