import { midiToPitchClass } from '@/utils/earTrainingEngine';
import {
  computeOrderedChordKeyboardHintsFromMidis,
  orderedPitchClassesFromMidis,
} from '@/utils/orderedChordInput';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';

interface VoicingKeyboardHints {
  pendingMidis: readonly number[];
  completedMidis: readonly number[];
  nextMidi: number | null;
}

const EMPTY_HINTS: VoicingKeyboardHints = {
  pendingMidis: [],
  completedMidis: [],
  nextMidi: null,
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
  sequential = false,
): VoicingKeyboardHints => {
  if (!voicing || voicing.length === 0) {
    return EMPTY_HINTS;
  }

  const midis: number[] = [];
  const seenMidis = new Set<number>();
  for (let index = 0; index < voicing.length; index += 1) {
    const midi = tryParseMidi(voicing[index]);
    if (midi === null || seenMidis.has(midi)) {
      continue;
    }
    seenMidis.add(midi);
    midis.push(midi);
  }

  if (midis.length === 0) {
    return EMPTY_HINTS;
  }

  if (sequential) {
    const orderedPcs = orderedPitchClassesFromMidis(midis);
    const completedPcs: number[] = [];
    for (const pc of orderedPcs) {
      if (pressedPitchClasses?.has(pc)) {
        completedPcs.push(pc);
      } else {
        break;
      }
    }
    return computeOrderedChordKeyboardHintsFromMidis(midis, completedPcs);
  }

  const pending: number[] = [];
  const completed: number[] = [];

  for (const midi of midis) {
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
  return { pendingMidis: pending, completedMidis: completed, nextMidi: null };
};
