import { describe, expect, it } from 'vitest';

import {
  estimateChordNameWidthPx,
  layoutBattleChordLabels,
} from '@/components/earTraining/ChordVoicingStaff';

describe('chordVoicingStaff layout helpers', () => {
  it('estimateChordNameWidthPx は空でなく長いコード名ほど幅が広がる', () => {
    expect(estimateChordNameWidthPx('', 18)).toBeGreaterThan(0);
    expect(estimateChordNameWidthPx('CM7', 18)).toBeLessThan(estimateChordNameWidthPx('C#m7(b5)', 18));
  });

  it('layoutBattleChordLabels は近接スロットのラベル X を左から右へ押し出す', () => {
    const layout = {
      measureDividerX: 360,
      measureOneNoteLeftX: 220,
      measureOneNoteRightX: 320,
      measureTwoNoteLeftX: 400,
      measureTwoNoteRightX: 660,
    };
    const groups = [
      {
        id: 'a',
        chordName: 'C#m7(b5)',
        notes: [],
        measureOffset: 0 as const,
        slotIndex: 0,
        slotCount: 2,
        legacyIsActive: false,
        isRest: false,
      },
      {
        id: 'b',
        chordName: 'F#7alt',
        notes: [],
        measureOffset: 0 as const,
        slotIndex: 1,
        slotCount: 2,
        legacyIsActive: false,
        isRest: false,
      },
    ];
    const labels = layoutBattleChordLabels(
      groups,
      layout,
      'a',
      20,
      40,
      680,
      12,
    );
    expect(labels).toHaveLength(2);
    const [left, right] = [...labels].sort((u, v) => u.x - v.x);
    expect(right.x - left.x).toBeGreaterThan(0);
    expect(left.x + estimateChordNameWidthPx(left.chordName, left.fontSize) / 2)
      .toBeLessThanOrEqual(right.x + 1);
  });
});
