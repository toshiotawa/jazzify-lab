const PITCH_CLASS_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

/**
 * OSU 円の音名。MusicXML 由来の spellings があればそれを優先し、
 * 無いときだけ MIDI → シャープ固定名にフォールバックする。
 */
export const resolveOsuCircleNoteLabels = (
  midis: readonly number[],
  musicXmlSpellings?: readonly string[] | null,
): string[] => {
  if (musicXmlSpellings && musicXmlSpellings.length > 0) {
    return Array.from(musicXmlSpellings);
  }
  const unique = new Set<number>();
  for (const midi of midis) {
    if (!Number.isFinite(midi)) continue;
    unique.add(Math.round(midi));
  }
  return Array.from(unique)
    .sort((a, b) => a - b)
    .map(midi => PITCH_CLASS_NAMES[((midi % 12) + 12) % 12]);
};
