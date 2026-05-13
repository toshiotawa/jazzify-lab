import { describe, expect, it } from 'vitest';

import {
  buildMergedKeyFifthsForChordsOnePerLineSections,
  parseChordsOnePerLineSections,
  parseKeySpecificationToKeyFifths,
} from '@/utils/survivalProgressionChordsOnePerLine';
import { tonicRootMajorKeyFifths } from '@/utils/survivalProgressionKeyInference';

describe('survivalProgressionChordsOnePerLine', () => {
  it('parseKeySpecificationToKeyFifths: メジャー・マイナー表記とも長調ルール（平行長）で fifths', () => {
    expect(parseKeySpecificationToKeyFifths('F')).toBe(tonicRootMajorKeyFifths('F'));
    expect(parseKeySpecificationToKeyFifths('D minor')).toBe(tonicRootMajorKeyFifths('D'));
    expect(parseKeySpecificationToKeyFifths('Eb')).toBe(tonicRootMajorKeyFifths('Eb'));
  });

  it('Key 行でセクション分割し、セクション先頭の fifths が Key 通り', () => {
    const raw = `
Key of C
Dm7(9) G7(9.13) CM7(9)

Key of F
FM7(9) Em7(b5)
`;
    const sections = parseChordsOnePerLineSections(raw);
    expect(sections.length).toBe(2);
    expect(sections[0]?.keyFifths).toBe(0);
    expect(sections[1]?.keyFifths).toBe(tonicRootMajorKeyFifths('F'));
    const merged = buildMergedKeyFifthsForChordsOnePerLineSections(sections);
    expect(merged[0]).toBe(0);
    expect(merged[3]).toBe(tonicRootMajorKeyFifths('F'));
  });

  it('Key より前にコードがあるとエラー', () => {
    expect(() =>
      parseChordsOnePerLineSections('Dm7(9)\nKey of C\nCM7(9)'),
    ).toThrow(/Key of/);
  });

  it('Key のみで終わるとエラー', () => {
    expect(() => parseChordsOnePerLineSections('Key of C\n')).toThrow();
  });
});
