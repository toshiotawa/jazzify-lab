import type {
  EarTrainingCompositePhraseBootstrap,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingPhraseNote,
  EarTrainingStage,
} from '@/types';
import { Note } from 'tonal';
import type { CompositePhraseChord, CompositePhraseDefinition } from '@/utils/compositePhraseEngine';
import { chordHasVoicingNotes } from '@/utils/earTrainingChordVoicingEngine';

const NOTE_NAMES_BY_PITCH_CLASS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

const pitchClassFromNoteName = (name: string): number | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const chroma = Note.chroma(trimmed);
  return typeof chroma === 'number' ? chroma : null;
};

const normalizePitchClassValue = (pitchClass: number): number | null => {
  if (!Number.isFinite(pitchClass)) {
    return null;
  }
  return ((Math.trunc(pitchClass) % 12) + 12) % 12;
};

const noteDisplayNameWithOctave = (note: EarTrainingPhraseNote): string => {
  const trimmed = note.note_name.trim();
  if (/\d+$/.test(trimmed)) {
    return trimmed;
  }
  const pitchName = trimmed || NOTE_NAMES_BY_PITCH_CLASS[note.pitch_class] || 'C';
  const octave = typeof note.octave === 'number' && Number.isFinite(note.octave)
    ? Math.trunc(note.octave)
    : 4;
  return `${pitchName}${octave}`;
};

const chordLabelForMeasure = (
  chords: readonly EarTrainingPhraseChord[],
  measureNumber: number,
): EarTrainingPhraseChord | null => (
  chords.find(chord => (chord.measure_number ?? 1) === measureNumber)
    ?? chords[0]
    ?? null
);

const phraseNotesToCompositeChords = (
  phrase: EarTrainingPhrase,
): CompositePhraseChord[] | null => {
  const notes = (phrase.notes ?? [])
    .slice()
    .sort((a, b) => a.note_index - b.note_index);
  if (notes.length === 0) {
    return null;
  }

  const chords = (phrase.chords ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  const measureNumbers: number[] = [];
  const notesByMeasure = new Map<number, EarTrainingPhraseNote[]>();

  for (const note of notes) {
    const measureNumber = Math.max(1, note.measure_number ?? 1);
    const current = notesByMeasure.get(measureNumber);
    if (current) {
      current.push(note);
    } else {
      measureNumbers.push(measureNumber);
      notesByMeasure.set(measureNumber, [note]);
    }
  }

  const outChords: CompositePhraseChord[] = [];
  for (let measureIndex = 0; measureIndex < measureNumbers.length; measureIndex += 1) {
    const measureNumber = measureNumbers[measureIndex];
    const measureNotes = notesByMeasure.get(measureNumber) ?? [];
    const mappedNotes = measureNotes.map((note) => {
      const pc = normalizePitchClassValue(note.pitch_class);
      if (pc === null) {
        return null;
      }
      return {
        pitchClass: pc,
        noteName: noteDisplayNameWithOctave(note),
        staff: 1 as const,
      };
    });
    if (mappedNotes.some((note) => note === null)) {
      return null;
    }

    const labelChord = chordLabelForMeasure(chords, measureNumber);
    outChords.push({
      id: labelChord?.id ?? `${phrase.id}-m${measureNumber}`,
      orderIndex: labelChord?.order_index ?? measureIndex,
      chordName: labelChord?.chord_name ?? '',
      quoteText: labelChord?.quote?.text?.trim() || null,
      measureNumber,
      notes: mappedNotes as Array<{ pitchClass: number; noteName: string; staff: 1 | 2 }>,
    });
  }

  return outChords.length > 0 ? outChords : null;
};

/** `phrase.notes` がある場合はメロディを小節単位で、無い場合のみ旧 voicing fallback を使う。 */
export function earTrainingPhraseToCompositeDefinition(
  phrase: EarTrainingPhrase,
): CompositePhraseDefinition | null {
  const noteChords = phraseNotesToCompositeChords(phrase);
  if (noteChords) {
    return {
      id: phrase.id,
      sourcePhraseId: phrase.id,
      title: phrase.title?.trim() ?? '',
      chords: noteChords,
    };
  }

  const chords = (phrase.chords ?? []).slice().sort((a, b) => a.order_index - b.order_index);
  const outChords: CompositePhraseChord[] = [];

  for (const chord of chords) {
    if (!chordHasVoicingNotes(chord)) {
      continue;
    }

    const voicing = chord.voicing ?? [];
    const stavesRaw = chord.voicing_staves ?? [];
    const notes = voicing.map((noteName, idx) => {
      const pc = pitchClassFromNoteName(noteName);
      if (pc === null) {
        return null;
      }
      const rawStaff = stavesRaw[idx];
      const staff: 1 | 2 = rawStaff === 2 ? 2 : 1;
      return { pitchClass: pc, noteName: noteName.trim(), staff };
    });

    if (notes.some((n) => n === null)) {
      return null;
    }

    outChords.push({
      id: chord.id,
      orderIndex: chord.order_index,
      chordName: chord.chord_name,
      quoteText: chord.quote?.text?.trim() || null,
      measureNumber: chord.measure_number ?? 1,
      notes: notes as Array<{ pitchClass: number; noteName: string; staff: 1 | 2 }>,
    });
  }

  if (outChords.length === 0) {
    return null;
  }

  return {
    id: phrase.id,
    sourcePhraseId: phrase.id,
    title: phrase.title?.trim() ?? '',
    chords: outChords,
  };
}

export interface EarTrainingCompositeConfigRow {
  readonly id: string;
  readonly bgm_url: string;
  readonly key_fifths: number;
}

/** Supabase 検証後、`EarTrainingStage` に付与するブートストラップを組み立てる。 */
export function buildEarTrainingCompositeBootstrap(
  stage: EarTrainingStage,
  cfg: EarTrainingCompositeConfigRow,
  sourcePhraseIdsOrdered: readonly string[],
): EarTrainingCompositePhraseBootstrap | null {
  const phraseMap = new Map((stage.phrases ?? []).map((p) => [p.id, p]));
  const definitions: CompositePhraseDefinition[] = [];

  for (const pid of sourcePhraseIdsOrdered) {
    const ph = phraseMap.get(pid);
    if (!ph) {
      return null;
    }
    const def = earTrainingPhraseToCompositeDefinition(ph);
    if (!def) {
      return null;
    }
    definitions.push(def);
  }

  const trimmedBgm = cfg.bgm_url.trim();
  if (!trimmedBgm) {
    return null;
  }

  return {
    bgmUrl: trimmedBgm,
    keyFifths: cfg.key_fifths,
    sourcePhraseIds: sourcePhraseIdsOrdered,
    definitions,
  };
}
