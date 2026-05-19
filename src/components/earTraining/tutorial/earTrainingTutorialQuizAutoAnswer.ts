import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import type { EarTrainingPhraseChord } from '@/types';

export const autoAnswerChordForQuiz = (
  chord: EarTrainingPhraseChord,
  onNote: (midiNote: number) => void,
): void => {
  const voicing = chord.voicing ?? [];
  for (const noteName of voicing) {
    const parsed = parseVoicingNoteName(noteName);
    onNote(parsed.midi);
  }
};
