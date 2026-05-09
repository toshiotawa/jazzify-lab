import { midiToPitchClass } from '@/utils/earTrainingEngine';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

interface VoicingKeyboardHints {
  pendingMidis: readonly number[];
  completedMidis: readonly number[];
}

const EMPTY_HINTS: VoicingKeyboardHints = {
  pendingMidis: [],
  completedMidis: [],
};

const tryParseMidi = (noteName: string): number | null => {
  const trimmed = noteName.trim();
  if (!trimmed) {
    return null;
  }
  try {
    return parseVoicingNoteName(trimmed).midi;
  } catch {
    return null;
  }
};

export const computeVoicingKeyboardHints = (
  voicing: readonly string[] | null | undefined,
  pressedPitchClasses: ReadonlySet<number> | undefined,
): VoicingKeyboardHints => {
  if (!voicing || voicing.length === 0) {
    return EMPTY_HINTS;
  }

  const seenMidis = new Set<number>();
  const pending: number[] = [];
  const completed: number[] = [];

  for (let index = 0; index < voicing.length; index += 1) {
    const midi = tryParseMidi(voicing[index]);
    if (midi === null || seenMidis.has(midi)) {
      continue;
    }
    seenMidis.add(midi);
    const pc = midiToPitchClass(midi);
    if (pressedPitchClasses && pressedPitchClasses.has(pc)) {
      completed.push(midi);
    } else {
      pending.push(midi);
    }
  }

  if (pending.length === 0 && completed.length === 0) {
    return EMPTY_HINTS;
  }
  return { pendingMidis: pending, completedMidis: completed };
};
