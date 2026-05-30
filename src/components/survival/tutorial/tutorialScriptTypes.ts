import type { SurvivalScenarioOverrides } from '@/components/survival/scenario/survivalScenarioTypes';

import type { TutorialAudioTracksMap } from './TutorialAudioController';

export interface TutorialLocalizedText {
  readonly ja: string;
  readonly en: string;
}

export interface TutorialChordDef {
  name: string;
  voicing: number[];
  voicingNames?: string[];
  keyFifths?: number;
}

export interface TutorialStageDef {
  name: string;
  nameEn: string;
  stageType: 'progression' | 'random';
  chordDisplayName: string;
  chordDisplayNameEn: string;
  chordProgression: TutorialChordDef[];
  mapCategory?: 'basic' | 'songs' | 'phrases' | 'lesson';
  lessonOnly?: boolean;
}

export type TutorialSpawnStep =
  | { kind: 'front'; distance: number }
  | { kind: 'ring'; count: number; radius: number }
  | { kind: 'perpOffsets'; distanceForward: number; offsets: number[] }
  | { kind: 'at'; x: number; y: number };

export type TutorialAttackStep =
  | { slot: 'A' | 'B' }
  | { special: true };

export type TutorialScriptStep =
  | { type: 'delay'; seconds: number }
  | { type: 'character'; text: TutorialLocalizedText }
  | { type: 'narration'; text?: TutorialLocalizedText; clear?: boolean }
  | { type: 'connectedDevice'; text?: TutorialLocalizedText | null }
  | { type: 'overrides'; preset?: string; patch?: Partial<SurvivalScenarioOverrides> }
  | {
      type: 'slot';
      aEnabled?: boolean;
      bEnabled?: boolean;
      bChord?: string;
      clearBChord?: boolean;
      resetBCompletion?: boolean;
    }
  | { type: 'clearEnemies' }
  | { type: 'spawn'; spawn: TutorialSpawnStep }
  | {
      type: 'demoOneChord';
      chord: string;
      spawn: TutorialSpawnStep;
      attack: TutorialAttackStep;
    }
  | {
      type: 'chordFight';
      chord: string;
      spawn: TutorialSpawnStep;
      assistAttack: TutorialAttackStep;
      completionAttack?: TutorialAttackStep | null;
      useSpecial?: boolean;
      timeoutSeconds?: number;
      introCharacter?: TutorialLocalizedText;
      introDelaySeconds?: number;
      successCharacter?: TutorialLocalizedText;
      successDelaySeconds?: number;
      failCharacter?: TutorialLocalizedText;
      failDelaySeconds?: number;
    }
  | { type: 'keyboardSetup'; midiWaitSeconds?: number }
  | { type: 'waitInput' }
  | { type: 'attack'; attack: TutorialAttackStep }
  | {
      type: 'pillar';
      text: TutorialLocalizedText;
      systemImage: string;
      imageAsset?: string;
      durationSeconds?: number;
    }
  | { type: 'showCta'; show: boolean }
  | { type: 'audio'; trackId: string; action: 'play' | 'stop'; loop?: boolean; volume?: number }
  | { type: 'finish' };

/** DB `survival_tutorial_scripts.script` v2 */
export interface TutorialScriptPayload {
  version: 2;
  audioTracks?: TutorialAudioTracksMap;
  /** @deprecated v2 では steps を優先。移行期のみ */
  builtinRunner?: string;
  stage?: TutorialStageDef;
  chords?: Record<string, TutorialChordDef>;
  overridePresets?: Record<string, Partial<SurvivalScenarioOverrides>>;
  steps: TutorialScriptStep[];
}

export function isTutorialScriptPayload(raw: unknown): raw is TutorialScriptPayload {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as Record<string, unknown>;
  return o.version === 2 && Array.isArray(o.steps);
}
