import { describe, expect, it } from 'vitest';

import {
  CHORD_VOICING_ADJACENT_CLUSTER_OFFSET_RATIO,
  estimateChordNameWidthPx,
  layoutBattleChordLabels,
  layoutChordVoicingStaffNotes,
} from '@/components/earTraining/ChordVoicingStaff';

type ParsedVoicingTestNote = Parameters<typeof layoutChordVoicingStaffNotes>[0][number];

describe('chordVoicingStaff layout helpers', () => {
  const lowSecondCluster: readonly ParsedVoicingTestNote[] = [
    {
      step: 'C',
      alter: 0,
      octave: 4,
      midi: 60,
      staff: 1,
      degree: 28,
      pitchClass: 0,
      voicingIndex: 0,
      displayAccidentalAlter: null,
      tiedFromPrevious: false,
    },
    {
      step: 'D',
      alter: 0,
      octave: 4,
      midi: 62,
      staff: 1,
      degree: 29,
      pitchClass: 2,
      voicingIndex: 1,
      displayAccidentalAlter: null,
      tiedFromPrevious: false,
    },
  ];

  it('layoutChordVoicingStaffNotes anchor-low は低音を 0・高い音だけ右へずらす', () => {
    const positioned = layoutChordVoicingStaffNotes(lowSecondCluster, 100, 200, 'anchor-low');
    const o = 10 * 1.45 * CHORD_VOICING_ADJACENT_CLUSTER_OFFSET_RATIO;
    expect(positioned.map(p => p.xOffset)).toEqual([0, o]);
  });

  it('layoutChordVoicingStaffNotes symmetric は従来どおり左右交互', () => {
    const positioned = layoutChordVoicingStaffNotes(lowSecondCluster, 100, 200, 'symmetric');
    const o = 10 * 1.45 * CHORD_VOICING_ADJACENT_CLUSTER_OFFSET_RATIO;
    expect(positioned.map(p => p.xOffset)).toEqual([-o, o]);
  });

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
