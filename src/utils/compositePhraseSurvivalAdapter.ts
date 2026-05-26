import type { SurvivalPhraseChord, SurvivalPhraseDefinition } from '@/utils/survivalPhraseDefinitions';
import { Note } from 'tonal';
import type {
  CompositePhraseChord,
  CompositePhraseDefinition,
} from '@/utils/compositePhraseEngine';
import { createInitialCompositePhraseRuntimeState } from '@/utils/compositePhraseEngine';

function survivalChordToComposite(chord: SurvivalPhraseChord): CompositePhraseChord {
  return {
    id: chord.id,
    orderIndex: chord.orderIndex,
    chordName: chord.chordName,
    measureNumber: chord.measureNumber,
    notes: chord.notes.map((n) => ({
      pitchClass: n.pitchClass,
      noteName: n.noteName,
      staff: n.staff,
    })),
  };
}

/** Survival map category stages use numeric stage_number as stable source key. */
export function survivalPhrasesToCompositeDefinitions(
  phrases: readonly SurvivalPhraseDefinition[],
): readonly CompositePhraseDefinition[] {
  return phrases.map((p) => ({
    id: p.id,
    sourcePhraseId: String(p.stageNumber),
    title: p.title,
    chords: p.chords.map(survivalChordToComposite),
  }));
}

export function createCompositePhraseRuntimeFromSurvivalPhrases(
  sourcePhrases: readonly SurvivalPhraseDefinition[],
) {
  return createInitialCompositePhraseRuntimeState(survivalPhrasesToCompositeDefinitions(sourcePhrases));
}

export function compositeChordToSurvivalChord(chord: CompositePhraseChord | null): SurvivalPhraseChord | null {
  if (!chord) {
    return null;
  }
  return {
    id: chord.id,
    orderIndex: chord.orderIndex,
    chordName: chord.chordName,
    measureNumber: chord.measureNumber,
    notes: chord.notes.map((n, idx) => {
      const midiParsed = Note.midi(n.noteName);
      const pitchMidi = typeof midiParsed === 'number' ? midiParsed : n.pitchClass + 60;
      return {
        orderIndex: idx,
        pitchMidi,
        pitchClass: n.pitchClass,
        noteName: n.noteName,
        staff: n.staff,
      };
    }),
  };
}
