export interface DefenseChordHudLabels {
  readonly current: string;
}

export const getDefenseChordHudLabels = (
  chordNames: readonly string[],
  chordIndex: number,
): DefenseChordHudLabels => {
  if (chordNames.length === 0) {
    return { current: '-' };
  }

  const safeIndex = Math.min(Math.max(chordIndex, 0), chordNames.length - 1);
  const current = chordNames[safeIndex] ?? '-';
  return { current };
};
