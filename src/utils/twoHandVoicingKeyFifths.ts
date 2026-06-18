/**
 * マイナーキーの調号 — 短3度上のメジャーキーと同じ fifths。
 */
export type MinorKey =
  | 'Am'
  | 'Bbm'
  | 'Bm'
  | 'Cm'
  | 'C#m'
  | 'Dm'
  | 'Ebm'
  | 'Em'
  | 'Fm'
  | 'F#m'
  | 'Gm'
  | 'G#m';

export const ALL_MINOR_KEYS: readonly MinorKey[] = [
  'Am',
  'Bbm',
  'Bm',
  'Cm',
  'C#m',
  'Dm',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
];

export const KEY_FIFTHS_BY_MINOR: Record<MinorKey, number> = {
  Am: 0,
  Bbm: -5,
  Bm: 2,
  Cm: -3,
  'C#m': 4,
  Dm: -1,
  Ebm: -6,
  Em: 1,
  Fm: -4,
  'F#m': 3,
  Gm: -2,
  'G#m': 5,
};
