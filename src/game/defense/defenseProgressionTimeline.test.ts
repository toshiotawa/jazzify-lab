import {
  buildDefenseProgressionChips,
  elapsedSecToBeatInLoop,
  loopPositionToBeatInLoop,
  resolveDefenseFormBarCount,
  resolveDefenseProgressionActiveIndex,
  resolveDefenseProgressionHudWindow,
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

describe('loopPositionToBeatInLoop', () => {
  it('maps bar position to beats within a 4/4 loop', () => {
    const barSec = 2;
    const beatsPerBar = 4;
    expect(loopPositionToBeatInLoop(0, barSec, beatsPerBar)).toBe(0);
    expect(loopPositionToBeatInLoop(barSec, barSec, beatsPerBar)).toBe(4);
    expect(loopPositionToBeatInLoop(barSec * 3, barSec, beatsPerBar)).toBe(12);
    expect(loopPositionToBeatInLoop(barSec * 4, barSec, beatsPerBar)).toBe(16);
  });
});

const stageOneProgression: readonly DefenseStageProgressionChord[] = [
  { orderIndex: 0, chordName: 'Dm7', measureNumber: 1, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 1, chordName: 'G7', measureNumber: 2, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 2, chordName: 'Dm7', measureNumber: 3, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 3, chordName: 'G7', measureNumber: 4, beatOffset: 1, durationBeats: 4 },
];

describe('elapsedSecToBeatInLoop', () => {
  it('starts at beat zero immediately after phrase switch transport reset', () => {
    const barSec = 2;
    const beatsPerBar = 4;
    expect(elapsedSecToBeatInLoop(0, 0, 8, 0, barSec, beatsPerBar)).toBe(0);
    expect(elapsedSecToBeatInLoop(0, 8, 16, 8, barSec, beatsPerBar)).toBe(0);
  });

  it('advances one bar per barSec after transport reset', () => {
    const barSec = 2;
    const beatsPerBar = 4;
    expect(elapsedSecToBeatInLoop(barSec, 0, 8, 0, barSec, beatsPerBar)).toBe(beatsPerBar);
  });

  it('selects the first HUD chord right after transport reset', () => {
    const beatInForm = elapsedSecToBeatInLoop(0, 0, 8, 0, 2, 4);
    expect(resolveDefenseProgressionActiveIndex(stageOneProgression, beatInForm, 4, 4)).toBe(0);
  });
});

describe('resolveDefenseProgressionHudWindow', () => {
  it('shows all four chips on stage 1', () => {
    expect(resolveDefenseProgressionHudWindow(4, 0)).toEqual({
      firstVisibleIndex: 0,
      visibleCount: 4,
    });
    expect(resolveDefenseProgressionHudWindow(4, 3)).toEqual({
      firstVisibleIndex: 0,
      visibleCount: 4,
    });
  });

  it('pages by four on longer progressions', () => {
    expect(resolveDefenseProgressionHudWindow(8, 4)).toEqual({
      firstVisibleIndex: 4,
      visibleCount: 4,
    });
    expect(resolveDefenseProgressionHudWindow(14, 13)).toEqual({
      firstVisibleIndex: 10,
      visibleCount: 4,
    });
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
