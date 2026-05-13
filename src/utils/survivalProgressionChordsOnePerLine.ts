/**
 * `data/.../chords_one_per_line/*.txt` 形式のパース。
 * `Key of` / `key of` 行は必須（先行コードや DBKeySig へのフォールバックなし）。
 */
import {
  buildProgressionChordKeyFifths,
  tonicRootMajorKeyFifths,
} from '@/utils/survivalProgressionKeyInference';
import { classifySurvivalProgressionChordName } from '@/utils/survivalProgressionVoicings';

/** `Key of G` / `Key of D minor` など → 長調ルールの fifths（短調表記は平行長調のメジャー） */
export const parseKeySpecificationToKeyFifths = (spec: string): number => {
  const s = spec.trim();
  const minorMatch = s.match(/^([A-G](?:bb|##|b|#|x)?)\s*(?:m|min|minor)\s*$/i);
  if (minorMatch?.[1]) {
    return tonicRootMajorKeyFifths(minorMatch[1]);
  }
  const majorMatch = s.match(/^([A-G](?:bb|##|b|#|x)?)\s*$/);
  if (majorMatch?.[1]) {
    return tonicRootMajorKeyFifths(majorMatch[1]);
  }
  throw new Error(`Unrecognized key specification: "${spec}"`);
};

const KEY_OF_LINE = /^\s*(?:#\s*)?key\s+of\s+(.+?)\s*$/i;

export interface ChordsOnePerLineSection {
  readonly keyFifths: number;
  readonly chordTokens: readonly string[];
}

const isKeyOfLine = (line: string): string | null => {
  const m = line.match(KEY_OF_LINE);
  return m?.[1]?.trim() ? m[1].trim() : null;
};

/**
 * 非空行のうち、コメント専用行（# で始まり key of を含まない）を除き、
 * Key of で始まる境界とコードトークン列に分割する。
 */
export const parseChordsOnePerLineSections = (fileContent: string): readonly ChordsOnePerLineSection[] => {
  const sections: ChordsOnePerLineSection[] = [];
  let pendingKeySpec: string | null = null;
  let pendingTokens: string[] = [];

  const flush = (): void => {
    if (pendingKeySpec === null) return;
    if (pendingTokens.length === 0) {
      throw new Error(
        'chords_one_per_line: Key 行の後にコードがありません（空セクションは不可）',
      );
    }
    sections.push({
      keyFifths: parseKeySpecificationToKeyFifths(pendingKeySpec),
      chordTokens: [...pendingTokens],
    });
    pendingKeySpec = null;
    pendingTokens = [];
  };

  const lines = fileContent.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) continue;

    const keyTail = isKeyOfLine(line);
    if (keyTail !== null) {
      if (pendingKeySpec !== null && pendingTokens.length > 0) {
        flush();
      } else if (pendingKeySpec !== null && pendingTokens.length === 0) {
        throw new Error(
          `chords_one_per_line: 連続する Key 行は不可（前の Key にコードがありません）: "${line}"`,
        );
      }
      pendingKeySpec = keyTail;
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (pendingKeySpec === null) {
      throw new Error(
        `chords_one_per_line: 「Key of」より前にコードがあります（${line.slice(0, 60)}…）`,
      );
    }

    pendingTokens.push(...line.split(/\s+/).filter(Boolean));
  }

  if (pendingKeySpec !== null) {
    if (pendingTokens.length === 0) {
      throw new Error('chords_one_per_line: 最後の Key 行の後にコードがありません');
    }
    flush();
  }

  if (sections.length === 0) {
    throw new Error('chords_one_per_line: Key of 行が 1 行もありません');
  }

  return sections;
};

export const buildMergedKeyFifthsForChordsOnePerLineSections = (
  sections: readonly ChordsOnePerLineSection[],
): number[] => {
  const out: number[] = [];
  for (const sec of sections) {
    const classed = sec.chordTokens.map(t => classifySurvivalProgressionChordName(t.trim()));
    const part = buildProgressionChordKeyFifths(classed, { forcedFirstFifths: sec.keyFifths });
    out.push(...part);
  }
  return out;
};
