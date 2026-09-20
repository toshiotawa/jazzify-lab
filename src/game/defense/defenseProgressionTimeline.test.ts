import {
  buildDefenseProgressionChips,
  resolveDefenseFormBarCount,
  resolveDefenseProgressionActiveIndex,
  type DefenseStageProgressionChord,
} from '@/game/defense/defenseProgressionTimeline';

const twoBeatProgression: readonly DefenseStageProgressionChord[] = [
  { orderIndex: 0, chordName: 'Dm7', measureNumber: 1, beatOffset: 1, durationBeats: 2 },
  { orderIndex: 1, chordName: 'G7', measureNumber: 1, beatOffset: 3, durationBeats: 2 },
];

describe('resolveDefenseProgressionActiveIndex', () => {
  it('selects G7 on beat 2 of a 4/4 bar', () => {
    expect(resolveDefenseProgressionActiveIndex(twoBeatProgression, 2, 1, 4)).toBe(1);
  });

  it('selects Dm7 on beat 0', () => {
    expect(resolveDefenseProgressionActiveIndex(twoBeatProgression, 0, 1, 4)).toBe(0);
  });

  it('wraps within the form loop', () => {
    const fourBar: readonly DefenseStageProgressionChord[] = [
      { orderIndex: 0, chordName: 'Dm7', measureNumber: 1, beatOffset: 1, durationBeats: 4 },
      { orderIndex: 1, chordName: 'G7', measureNumber: 2, beatOffset: 1, durationBeats: 4 },
    ];
    expect(resolveDefenseProgressionActiveIndex(fourBar, 4, 2, 4)).toBe(1);
    expect(resolveDefenseProgressionActiveIndex(fourBar, 8, 2, 4)).toBe(0);
  });
});

describe('resolveDefenseFormBarCount', () => {
  it('prefers progressionBars when set', () => {
    expect(resolveDefenseFormBarCount(12, 4)).toBe(12);
  });

  it('falls back to phrase loop bars', () => {
    expect(resolveDefenseFormBarCount(null, 4)).toBe(4);
  });
});

describe('buildDefenseProgressionChips', () => {
  it('marks the active chip and transposes labels', () => {
    const chips = buildDefenseProgressionChips(
      twoBeatProgression,
      1,
      (label) => (label === 'G7' ? 'A7' : label),
    );
    expect(chips[1]?.active).toBe(true);
    expect(chips[1]?.name).toBe('A7');
  });
});
