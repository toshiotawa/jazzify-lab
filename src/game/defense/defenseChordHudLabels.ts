export interface DefenseChordHudLabels {
  readonly current: string;
  readonly next: string;
}

export const getDefenseChordHudLabels = (
  chordNames: readonly string[],
  chordIndex: number,
): DefenseChordHudLabels => {
  if (chordNames.length === 0) {
    return { current: '-', next: '-' };
  }

  const safeIndex = Math.min(Math.max(chordIndex, 0), chordNames.length - 1);
  const current = chordNames[safeIndex] ?? '-';
  const nextIndex = safeIndex + 1;
  const next = nextIndex < chordNames.length ? (chordNames[nextIndex] ?? '-') : '-';
  return { current, next };
};
