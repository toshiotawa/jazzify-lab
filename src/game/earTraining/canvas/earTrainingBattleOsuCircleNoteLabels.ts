const PITCH_CLASS_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/** MIDI → オクターブなし音名。低い音から順に並べる。 */
export const resolveOsuCircleNoteLabels = (midis: readonly number[]): string[] => {
  const unique = new Set<number>();
  for (const midi of midis) {
    if (!Number.isFinite(midi)) continue;
    unique.add(Math.round(midi));
  }
  return Array.from(unique)
    .sort((a, b) => a - b)
    .map(midi => PITCH_CLASS_NAMES[((midi % 12) + 12) % 12]);
};
