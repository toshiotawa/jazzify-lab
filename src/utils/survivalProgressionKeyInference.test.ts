import { describe, expect, it } from 'vitest';

import {
  buildProgressionChordKeyFifths,
  tonicRootMajorKeyFifths,
  type SurvivalChordClass,
} from '@/utils/survivalProgressionKeyInference';

const cls = (root: string, kind: SurvivalChordClass['kind']): SurvivalChordClass => ({ root, kind });

describe('survivalProgressionKeyInference', () => {
  it('forcedFirstFifths でセクション先頭を txt 調に固定する', () => {
    const classes: (SurvivalChordClass | null)[] = [
      cls('D', 'm7'),
      cls('G', '7_9_13'),
      cls('C', 'M7_9'),
    ];
    const na = buildProgressionChordKeyFifths(classes);
    const forced = buildProgressionChordKeyFifths(classes, { forcedFirstFifths: -2 });
    expect(forced[0]).toBe(-2);
    expect(na[0]).not.toBe(-2);
  });

  it('マイナー i の iiø–V–i は平行長調（ルート長調）の fifths', () => {
    const classes: (SurvivalChordClass | null)[] = [
      cls('E', 'm7b5'),
      cls('A', '7_b9_b13'),
      cls('D', 'm7'),
    ];
    const out = buildProgressionChordKeyFifths(classes);
    expect(out[0]).toBe(tonicRootMajorKeyFifths('D'));
    expect(out.every(k => k === tonicRootMajorKeyFifths('D'))).toBe(true);
  });

  it('iiø–V–m6(9) も同様に平行長調の fifths', () => {
    const classes: (SurvivalChordClass | null)[] = [
      cls('E', 'm7b5'),
      cls('A', '7_b9_b13'),
      cls('D', 'm6_9'),
    ];
    const out = buildProgressionChordKeyFifths(classes);
    expect(out[2]).toBe(tonicRootMajorKeyFifths('D'));
  });
});
