/** 和音入力: 定義 MIDI 昇順のピッチクラス列と、音声入力時の順序判定 */

export const normalizePitchClass = (midi: number): number =>
  ((Math.round(midi) % 12) + 12) % 12;

export const orderedPitchClassesFromMidis = (midis: readonly number[]): readonly number[] => {
  const sorted = [...midis].sort((a, b) => a - b);
  const result: number[] = [];
  const seen = new Set<number>();
  for (const midi of sorted) {
    const pc = normalizePitchClass(midi);
    if (!seen.has(pc)) {
      seen.add(pc);
      result.push(pc);
    }
  }
  return result;
};

export const getNextExpectedPitchClass = (
  orderedTargetPcs: readonly number[],
  completedPcs: readonly number[],
): number | null => {
  const nextIndex = completedPcs.length;
  if (nextIndex >= orderedTargetPcs.length) {
    return null;
  }
  return orderedTargetPcs[nextIndex] ?? null;
};

export const acceptsSequentialPitchClassInput = (
  orderedTargetPcs: readonly number[],
  completedPcs: readonly number[],
  inputPc: number,
): boolean => {
  const next = getNextExpectedPitchClass(orderedTargetPcs, completedPcs);
  return next !== null && next === inputPc;
};

export const acceptsUnorderedPitchClassInput = (
  orderedTargetPcs: readonly number[],
  completedPcs: readonly number[],
  inputPc: number,
): boolean => {
  if (completedPcs.includes(inputPc)) {
    return false;
  }
  return orderedTargetPcs.includes(inputPc);
};

export const shouldAcceptChordPitchClassInput = (
  targetMidis: readonly number[],
  completedPcs: readonly number[],
  inputMidi: number,
  sequential: boolean,
): { accept: boolean; inputPc: number; orderedTargetPcs: readonly number[] } => {
  const orderedTargetPcs = orderedPitchClassesFromMidis(targetMidis);
  const inputPc = normalizePitchClass(inputMidi);
  const accept = sequential
    ? acceptsSequentialPitchClassInput(orderedTargetPcs, completedPcs, inputPc)
    : acceptsUnorderedPitchClassInput(orderedTargetPcs, completedPcs, inputPc);
  return { accept, inputPc, orderedTargetPcs };
};

export interface OrderedChordKeyboardHints {
  nextMidi: number | null;
  pendingMidis: readonly number[];
  completedMidis: readonly number[];
}

const pcToLowestMidi = (chordMidis: readonly number[]): Map<number, number> => {
  const sortedMidis = [...chordMidis].sort((a, b) => a - b);
  const map = new Map<number, number>();
  for (const midi of sortedMidis) {
    const pc = normalizePitchClass(midi);
    if (!map.has(pc)) {
      map.set(pc, midi);
    }
  }
  return map;
};

export const computeOrderedChordKeyboardHintsFromMidis = (
  chordMidis: readonly number[],
  completedPcs: readonly number[],
): OrderedChordKeyboardHints => {
  const orderedPcs = orderedPitchClassesFromMidis(chordMidis);
  const pcToMidi = pcToLowestMidi(chordMidis);
  const nextPc = getNextExpectedPitchClass(orderedPcs, completedPcs);

  const completedMidis: number[] = [];
  const pendingMidis: number[] = [];
  let nextMidi: number | null = null;

  for (const pc of orderedPcs) {
    const midi = pcToMidi.get(pc);
    if (midi === undefined) {
      continue;
    }
    if (completedPcs.includes(pc)) {
      completedMidis.push(midi);
    } else if (pc === nextPc) {
      nextMidi = midi;
    } else {
      pendingMidis.push(midi);
    }
  }

  return { nextMidi, pendingMidis, completedMidis };
};
