/**
 * 両手ヴォイシング — 機能度数に基づく key_fifths 解決。
 * マイナーキーの調号は短3度上のメジャーキーと同じ fifths。
 */
import { Note, transpose } from 'tonal';
import {
  KEY_FIFTHS_BY_MAJOR,
  type MajorKey,
} from '@/utils/twoHandVoicingIntermediateCourse';

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

const CHROMA_TO_MINOR_KEY: readonly MinorKey[] = [
  'Cm',
  'C#m',
  'Dm',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gm',
  'G#m',
  'Am',
  'Bbm',
  'Bm',
];

const CHROMA_TO_MAJOR_KEY: readonly MajorKey[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
];

const extractVoicingChordRoot = (symbol: string): string => {
  const match = symbol.match(/^([A-G](?:#|b)?)/);
  if (!match) {
    throw new Error(`Invalid chord symbol: ${symbol}`);
  }
  return match[1];
};

const chromaFromRoot = (root: string): number => {
  const chroma = Note.chroma(root);
  if (chroma == null) {
    throw new Error(`Invalid chord root: ${root}`);
  }
  return Number(chroma);
};

const minorKeyFromRoot = (root: string): MinorKey => (
  CHROMA_TO_MINOR_KEY[chromaFromRoot(root)]
);

const majorKeyFromRoot = (root: string): MajorKey => (
  CHROMA_TO_MAJOR_KEY[chromaFromRoot(root)]
);

const transposedRoot = (root: string, interval: string): string => {
  const nextRoot = transpose(root, interval);
  if (!nextRoot) {
    throw new Error(`Failed to transpose ${root} by ${interval}`);
  }
  return nextRoot;
};

/** Im7 / ImM7 — マイナーキーの tonic */
export const keyFifthsForIm7 = (symbol: string): number => (
  KEY_FIFTHS_BY_MINOR[minorKeyFromRoot(extractVoicingChordRoot(symbol))]
);

/** IIm7(b5) — 親メジャーキーの ii */
export const keyFifthsForIIm7b5 = (symbol: string): number => {
  const root = extractVoicingChordRoot(symbol);
  const parentMajorRoot = transposedRoot(root, '-2M');
  return KEY_FIFTHS_BY_MAJOR[majorKeyFromRoot(parentMajorRoot)];
};

/** bVII7 (Lydian dominant) — 親メジャーキーの ♭VII */
export const keyFifthsForBVII7 = (symbol: string): number => {
  const root = extractVoicingChordRoot(symbol);
  const parentMajorRoot = transposedRoot(root, '2M');
  return KEY_FIFTHS_BY_MAJOR[majorKeyFromRoot(parentMajorRoot)];
};

/** V7alt — 解決先マイナーキーの V7 */
export const keyFifthsForMinorV7Alt = (symbol: string): number => {
  const root = extractVoicingChordRoot(symbol.replace(/alt.*/, ''));
  const tonicRoot = transposedRoot(root, '-5P');
  return KEY_FIFTHS_BY_MINOR[minorKeyFromRoot(tonicRoot)];
};

type AdvancedKeyFifthsCategory = 'm7' | 'mM7' | 'm7b5' | '7(#11)' | '7alt';

export const keyFifthsForAdvancedCategory = (
  category: AdvancedKeyFifthsCategory,
  symbol: string,
): number => {
  if (category === 'm7' || category === 'mM7') {
    return keyFifthsForIm7(symbol);
  }
  if (category === 'm7b5') {
    return keyFifthsForIIm7b5(symbol);
  }
  if (category === '7(#11)') {
    return keyFifthsForBVII7(symbol);
  }
  return keyFifthsForMinorV7Alt(symbol);
};
