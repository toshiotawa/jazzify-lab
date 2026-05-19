import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';
import type { TutorialScriptPayload } from './tutorialScriptTypes';

function chordFromDef(
  def: NonNullable<TutorialScriptPayload['chords']>[string],
  index: number,
  idPrefix: string,
): ChordDefinition {
  return {
    id: `${idPrefix}:${index}:${def.name}`,
    root: def.name,
    quality: 'major',
    notes: [...def.voicing],
    noteNames: def.voicingNames ? [...def.voicingNames] : [],
    displayName: def.name,
    progressionStaffVoicingNames: def.voicingNames ? [...def.voicingNames] : undefined,
    progressionStaffKeyFifths: def.keyFifths ?? 0,
  };
}

export function buildTutorialStageDefinition(
  script: TutorialScriptPayload,
): StageDefinition {
  const stage = script.stage;
  if (!stage) {
    return TUTORIAL_STAGE_DEFINITION;
  }

  return {
    stageNumber: 0,
    name: stage.name,
    nameEn: stage.nameEn,
    difficulty: 'easy',
    stageType: stage.stageType,
    chordSuffix: '',
    chordDisplayName: stage.chordDisplayName,
    chordDisplayNameEn: stage.chordDisplayNameEn,
    rootPattern: null,
    rootPatternName: '',
    rootPatternNameEn: '',
    allowedChords: [],
    blockKey: 'lesson_practice',
    mapCategory: stage.mapCategory ?? 'lesson',
    lessonOnly: stage.lessonOnly ?? true,
    chordProgression: stage.chordProgression.map((entry) => ({
      name: entry.name,
      voicing: [...entry.voicing],
      voicingNames: entry.voicingNames ? [...entry.voicingNames] : undefined,
      keyFifths: entry.keyFifths ?? 0,
    })),
  };
}

export function resolveTutorialChordRef(
  script: TutorialScriptPayload,
  ref: string,
): ChordDefinition {
  const def = script.chords?.[ref];
  if (!def) {
    throw new Error(`Unknown tutorial chord ref: ${ref}`);
  }
  return chordFromDef(def, 0, `tutorial:${ref}`);
}
