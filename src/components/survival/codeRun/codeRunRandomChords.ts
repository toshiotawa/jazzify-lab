import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { selectRandomChord } from '@/components/survival/SurvivalGameEngine';
import type { SurvivalProgressionBuiltChord } from '@/utils/survivalProgressionChords';

/** Code Run で演奏・表示に使うアクティブコード（progression / random 共通） */
export type CodeRunActiveChord = Pick<
  SurvivalProgressionBuiltChord,
  'id' | 'displayName' | 'notes' | 'root'
>;

export const chordDefinitionToCodeRunActive = (chord: ChordDefinition): CodeRunActiveChord => ({
  id: chord.id,
  displayName: chord.displayName,
  notes: chord.notes,
  root: chord.root,
});

export const pickCodeRunRandomChord = (
  allowedChordIds: readonly string[],
  excludeId?: string,
): CodeRunActiveChord | null => {
  if (allowedChordIds.length === 0) {
    return null;
  }
  const picked = selectRandomChord([...allowedChordIds], excludeId);
  if (!picked) {
    return null;
  }
  return chordDefinitionToCodeRunActive(picked);
};

export const isCodeRunRandomStage = (
  stageType: string,
  allowedChordIds: readonly string[],
): boolean => stageType === 'random' && allowedChordIds.length > 0;
