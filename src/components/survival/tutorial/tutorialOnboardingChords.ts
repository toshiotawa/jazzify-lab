/**
 * オンボーディング / サバイバルチュートリアル用 ii-V-I コード定義（iOS OnboardingChords 相当）
 */
import type { SurvivalChordProgressionEntry, StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { SurvivalPhraseChord } from '@/utils/survivalPhraseDefinitions';

const PROGRESSION_ENTRIES: SurvivalChordProgressionEntry[] = [
  { name: 'Dm7', voicing: [53, 57, 60, 64], voicingNames: ['F3', 'A3', 'C4', 'E4'], keyFifths: 0 },
  { name: 'G7', voicing: [53, 57, 59, 64], voicingNames: ['F3', 'A3', 'B3', 'E4'], keyFifths: 0 },
  { name: 'CM7', voicing: [52, 55, 59, 62], voicingNames: ['E3', 'G3', 'B3', 'D4'], keyFifths: 0 },
];

function chordFromEntry(
  entry: SurvivalChordProgressionEntry,
  index: number,
  idPrefix: string,
): ChordDefinition {
  return {
    id: `${idPrefix}:${index}:${entry.name}`,
    root: entry.name,
    quality: 'major',
    notes: [...entry.voicing],
    noteNames: entry.voicingNames ? [...entry.voicingNames] : [],
    displayName: entry.name,
    progressionStaffVoicingNames: entry.voicingNames ? [...entry.voicingNames] : undefined,
    progressionStaffKeyFifths: entry.keyFifths ?? 0,
  };
}

function sceneThreeChord(
  index: number,
  name: string,
  voicing: number[],
  voicingNames: string[],
): ChordDefinition {
  return {
    id: `onboarding-scene3:${index}:${name}`,
    root: name,
    quality: 'major',
    notes: voicing,
    noteNames: [...voicingNames],
    displayName: name,
    progressionStaffVoicingNames: voicingNames,
    progressionStaffKeyFifths: 0,
  };
}

export const TUTORIAL_DM7 = chordFromEntry(PROGRESSION_ENTRIES[0], 0, 'onboarding');
export const TUTORIAL_G7 = chordFromEntry(PROGRESSION_ENTRIES[1], 1, 'onboarding');
export const TUTORIAL_CM7 = chordFromEntry(PROGRESSION_ENTRIES[2], 2, 'onboarding');

export const TUTORIAL_SCENE3_DM7 = sceneThreeChord(0, 'Dm7', [60, 65], ['C4', 'F4']);
export const TUTORIAL_SCENE3_G7 = sceneThreeChord(1, 'G7', [59, 65], ['B3', 'F4']);
export const TUTORIAL_SCENE3_CM7 = sceneThreeChord(2, 'CM7', [59, 64], ['B3', 'E4']);

export const TUTORIAL_STAGE_DEFINITION: StageDefinition = {
  stageNumber: 0,
  name: 'オンボーディング ii-V-I',
  nameEn: 'Onboarding ii-V-I',
  difficulty: 'easy',
  stageType: 'progression',
  playMode: 'survival',
  chordSuffix: '',
  chordDisplayName: 'ii-V-I',
  chordDisplayNameEn: 'ii-V-I',
  rootPattern: null,
  rootPatternName: '',
  rootPatternNameEn: '',
  allowedChords: [],
  blockKey: 'lesson_practice',
  mapCategory: 'lesson',
  lessonOnly: true,
  chordProgression: PROGRESSION_ENTRIES,
  grandStaffMode: false,
};

export function chordToPhraseChord(chord: ChordDefinition, orderIndex: number): SurvivalPhraseChord {
  const names = chord.progressionStaffVoicingNames ?? [];
  const midis = chord.notes;
  const notes = midis.map((pitchMidi: number, i: number) => ({
    orderIndex: i,
    pitchMidi,
    pitchClass: ((pitchMidi % 12) + 12) % 12,
    noteName: names[i] ?? `N${i}`,
    staff: 1 as const,
  }));
  return {
    id: chord.id,
    orderIndex,
    chordName: chord.displayName,
    measureNumber: 1,
    notes,
  };
}
