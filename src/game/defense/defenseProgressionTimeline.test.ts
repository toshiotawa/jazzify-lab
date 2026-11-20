import {
  buildDefenseProgressionChips,
  elapsedSecToBeatInLoop,
  loopPositionToBeatInLoop,
  resolveDefenseFormBarCount,
  resolveDefensePhraseProgressionChords,
  resolveDefenseProgressionActiveIndex,
  resolveDefenseProgressionHudWindow,
  type DefenseStageProgressionChord,
} from '@/game/defense/defenseProgressionTimeline';

const twoBeatProgression: readonly DefenseStageProgressionChord[] = [
  { orderIndex: 0, chordName: 'Dm7', measureNumber: 1, beatOffset: 1, durationBeats: 2 },
  { orderIndex: 1, chordName: 'G7', measureNumber: 1, beatOffset: 3, durationBeats: 2 },
];

describe('resolveDefenseProgressionActiveIndex', () => {
  it('leaves all chips unlit before the first audible beat', () => {
    const index = resolveDefenseProgressionActiveIndex(twoBeatProgression, null, 1, 4);
    expect(buildDefenseProgressionChips(twoBeatProgression, index, (name) => name).some((chip) => chip.active)).toBe(false);
  });

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

const essentialLicks24: readonly DefenseStageProgressionChord[] = [
  { orderIndex: 0, chordName: 'CM7', measureNumber: 1, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 1, chordName: 'CM7', measureNumber: 2, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 2, chordName: 'FM7', measureNumber: 3, beatOffset: 1, durationBeats: 4 },
  { orderIndex: 3, chordName: 'FM7', measureNumber: 4, beatOffset: 1, durationBeats: 4 },
];

describe('resolveDefensePhraseProgressionChords', () => {
  it('slices single_source 12-key progression to the current 2-bar phrase', () => {
    const phrase0 = resolveDefensePhraseProgressionChords({
      stageProgressionChords: essentialLicks24,
      usesFullStageProgressionHud: false,
      phraseLoopStartMeasure: 1,
      phraseLoopEndMeasure: 2,
      phraseLoopBarCount: 2,
    });
    expect(phrase0).toHaveLength(2);
    expect(phrase0[0]?.chordName).toBe('CM7');
    expect(phrase0[0]?.measureNumber).toBe(1);
    expect(phrase0[1]?.measureNumber).toBe(2);

    const phrase1 = resolveDefensePhraseProgressionChords({
      stageProgressionChords: essentialLicks24,
      usesFullStageProgressionHud: false,
      phraseLoopStartMeasure: 3,
      phraseLoopEndMeasure: 4,
      phraseLoopBarCount: 2,
    });
    expect(phrase1).toHaveLength(2);
    expect(phrase1[0]?.chordName).toBe('FM7');
    expect(phrase1[0]?.measureNumber).toBe(1);
  });

  it('falls back to measures 1..phraseLoopBarCount when loop range is absent in DB', () => {
    const fourBarCommon: readonly DefenseStageProgressionChord[] = [
      { orderIndex: 0, chordName: 'Dm7', measureNumber: 1, beatOffset: 1, durationBeats: 4 },
      { orderIndex: 1, chordName: 'G7', measureNumber: 2, beatOffset: 1, durationBeats: 4 },
      { orderIndex: 2, chordName: 'Dm7', measureNumber: 3, beatOffset: 1, durationBeats: 4 },
      { orderIndex: 3, chordName: 'G7', measureNumber: 4, beatOffset: 1, durationBeats: 4 },
    ];
    const resolved = resolveDefensePhraseProgressionChords({
      stageProgressionChords: fourBarCommon,
      usesFullStageProgressionHud: false,
      phraseLoopStartMeasure: null,
      phraseLoopEndMeasure: null,
      phraseLoopBarCount: 4,
    });
    expect(resolved).toHaveLength(4);
    expect(resolved[0]?.chordName).toBe('Dm7');
  });

  it('returns full stage progression for shared_progression HUD', () => {
    const blues12 = Array.from({ length: 12 }, (_, index) => ({
      orderIndex: index,
      chordName: 'F7',
      measureNumber: index + 1,
      beatOffset: 1,
      durationBeats: 4,
    }));
    const resolved = resolveDefensePhraseProgressionChords({
      stageProgressionChords: blues12,
      usesFullStageProgressionHud: true,
      phraseLoopStartMeasure: 1,
      phraseLoopEndMeasure: 4,
      phraseLoopBarCount: 4,
    });
    expect(resolved).toHaveLength(12);
  });
});
