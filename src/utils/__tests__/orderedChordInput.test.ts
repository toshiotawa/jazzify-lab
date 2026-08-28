import {
  acceptsSequentialPitchClassInput,
  acceptsUnorderedPitchClassInput,
  computeOrderedChordKeyboardHintsFromMidis,
  orderedPitchClassesFromMidis,
  shouldAcceptChordPitchClassInput,
} from '@/utils/orderedChordInput';

describe('orderedChordInput', () => {
  it('orders pitch classes by ascending MIDI', () => {
    expect(orderedPitchClassesFromMidis([67, 60, 64])).toEqual([0, 4, 7]);
  });

  it('accepts sequential input only for the next expected pitch class', () => {
    const ordered = orderedPitchClassesFromMidis([60, 64, 67]);
    expect(acceptsSequentialPitchClassInput(ordered, [], 0)).toBe(true);
    expect(acceptsSequentialPitchClassInput(ordered, [], 7)).toBe(false);
    expect(acceptsSequentialPitchClassInput(ordered, [0], 4)).toBe(true);
    expect(acceptsSequentialPitchClassInput(ordered, [0], 0)).toBe(false);
  });

  it('accepts unordered input in any order', () => {
    const ordered = orderedPitchClassesFromMidis([60, 64, 67]);
    expect(acceptsUnorderedPitchClassInput(ordered, [], 7)).toBe(true);
    expect(acceptsUnorderedPitchClassInput(ordered, [7], 7)).toBe(false);
  });

  it('shouldAcceptChordPitchClassInput respects sequential flag', () => {
    const midis = [60, 64, 67];
    expect(shouldAcceptChordPitchClassInput(midis, [], 67, true).accept).toBe(false);
    expect(shouldAcceptChordPitchClassInput(midis, [], 67, false).accept).toBe(true);
  });

  it('computeOrderedChordKeyboardHintsFromMidis highlights next target', () => {
    const hints = computeOrderedChordKeyboardHintsFromMidis([60, 64, 67], [0]);
    expect(hints.nextMidi).toBe(64);
    expect(hints.completedMidis).toEqual([60]);
    expect(hints.pendingMidis).toEqual([67]);
  });
});
