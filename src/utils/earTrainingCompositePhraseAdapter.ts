import type {
  EarTrainingCompositePhraseBootstrap,
  EarTrainingPhrase,
  EarTrainingStage,
} from '@/types';
import { Note } from 'tonal';
import type { CompositePhraseChord, CompositePhraseDefinition } from '@/utils/compositePhraseEngine';
import { chordHasVoicingNotes } from '@/utils/earTrainingChordVoicingEngine';

const pitchClassFromNoteName = (name: string): number | null => {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const chroma = Note.chroma(trimmed);
  return typeof chroma === 'number' ? chroma : null;
};

/** 1 コード = 1 小節、`voicing` 配列順に 1 音ずつ正解。 */
export function earTrainingPhraseToCompositeDefinition(
  phrase: EarTrainingPhrase,
): CompositePhraseDefinition | null {
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
