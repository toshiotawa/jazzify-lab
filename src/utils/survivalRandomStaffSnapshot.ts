import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalProgressionStaffSnapshot } from '@/components/survival/SurvivalProgressionStaff';
import { buildSurvivalRandomDirectStaffVoicing } from '@/utils/survivalRandomHintStaff';

export interface BuildRandomStaffSnapshotParams {
  readonly chord: ChordDefinition;
  readonly correctPitchClasses: readonly number[];
  readonly chordDisplayName: string;
  readonly rootDisplayName?: string;
}

/** Random / 風船ラッシュ B 列: override ヴォイシング優先、なければコード名から direct 譜面を構築。 */
export const buildRandomStaffSnapshotFromChord = (
  params: BuildRandomStaffSnapshotParams,
): SurvivalProgressionStaffSnapshot | null => {
  const { chord, correctPitchClasses, chordDisplayName, rootDisplayName } = params;
  const tutNames = chord.progressionStaffVoicingNames;
  const tutKf = chord.progressionStaffKeyFifths;

  if (tutNames && tutNames.length > 0 && typeof tutKf === 'number') {
    const staves = chord.progressionStaffVoicingStaves;
    const allBass = staves && staves.length === tutNames.length && staves.every(s => s === 2);
    const baseRand: SurvivalProgressionStaffSnapshot = {
      voicingNames: tutNames,
      keyFifths: tutKf,
      correctPitchClasses,
      chordDisplayName,
      rootDisplayName,
      staffClef: allBass ? 'bass' : 'treble',
    };
    if (staves && staves.length === tutNames.length) {
      return { ...baseRand, voicingStaves: staves };
    }
    return baseRand;
  }

  const built = buildSurvivalRandomDirectStaffVoicing(chord.id);
  if (!built) {
    return null;
  }

  return {
    voicingNames: built.voicingNames,
    keyFifths: built.keyFifths,
    correctPitchClasses,
    chordDisplayName,
    rootDisplayName,
    staffClef: 'treble',
  };
};
