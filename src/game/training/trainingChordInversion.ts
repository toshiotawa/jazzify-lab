import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

const accidentalText = (alter: number): string => {
  if (alter === 2) return 'x';
  if (alter === 1) return '#';
  if (alter === -1) return 'b';
  if (alter === -2) return 'bb';
  return '';
};

const spelledName = (parsed: ReturnType<typeof parseVoicingNoteName>): string => (
  `${parsed.step}${accidentalText(parsed.alter)}${parsed.octave}`
);

/** クローズド・ヴォイシングの転回形（各音が直前より高くなるまでオクターブ上げ）。 */
export const applyClosedInversion = (
  names: readonly string[],
  inversion: number,
): string[] => {
  if (inversion <= 0 || names.length === 0) {
    return names.slice();
  }
  const count = names.length;
  const inv = Math.max(0, Math.min(count - 1, inversion));
  const rotated = [...names.slice(inv), ...names.slice(0, inv)];

  let prevMidi = Number.NEGATIVE_INFINITY;
  const result: string[] = [];
  for (const name of rotated) {
    let parsed = parseVoicingNoteName(name);
    let oct = parsed.octave;
    let midi = parsed.midi;
    while (midi <= prevMidi) {
      oct += 1;
      parsed = parseVoicingNoteName(`${parsed.step}${accidentalText(parsed.alter)}${oct}`);
      midi = parsed.midi;
    }
    result.push(spelledName({ ...parsed, octave: oct }));
    prevMidi = midi;
  }
  return result;
};
