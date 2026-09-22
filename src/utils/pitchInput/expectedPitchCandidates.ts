export interface ExpectedPitchCandidates {
  pitchClassMask: number;
  midis: number[];
  /** 同音連打待ち: この pitch class だけ再発音条件を厳格化する。0 で無効。 */
  repeatPitchClassMask: number;
}

export const EMPTY_EXPECTED_PITCH_CANDIDATES: ExpectedPitchCandidates = {
  pitchClassMask: 0,
  midis: [],
  repeatPitchClassMask: 0,
};

export const buildPitchClassMask = (midis: readonly number[]): number => {
  let mask = 0;
  for (const midi of midis) {
    const pitchClass = ((Math.round(midi) % 12) + 12) % 12;
    mask |= 1 << pitchClass;
  }
  return mask;
};

export const buildExpectedPitchCandidates = (
  midis: readonly number[],
  repeatPitchClassMask = 0,
): ExpectedPitchCandidates => {
  const uniqueMidis: number[] = [];
  const seen = new Set<number>();
  for (const raw of midis) {
    const midi = Math.round(raw);
    if (seen.has(midi)) {
      continue;
    }
    seen.add(midi);
    uniqueMidis.push(midi);
  }
  return {
    pitchClassMask: buildPitchClassMask(uniqueMidis),
    midis: uniqueMidis,
    repeatPitchClassMask: repeatPitchClassMask & 0xfff,
  };
};

export const expectedPitchCandidatesEqual = (
  left: ExpectedPitchCandidates,
  right: ExpectedPitchCandidates,
): boolean => {
  if (
    left.pitchClassMask !== right.pitchClassMask
    || left.repeatPitchClassMask !== right.repeatPitchClassMask
  ) {
    return false;
  }
  if (left.midis.length !== right.midis.length) {
    return false;
  }
  for (let index = 0; index < left.midis.length; index += 1) {
    if (left.midis[index] !== right.midis[index]) {
      return false;
    }
  }
  return true;
};
