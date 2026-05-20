import React from 'react';

import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import { SurvivalTutorialDialogueScene } from '@/components/survival/tutorial/SurvivalTutorialDialogueScene';
import { SurvivalTutorialChordBattleScene } from '@/components/survival/tutorial/SurvivalTutorialChordBattleScene';
import { SurvivalTutorialPhraseBattleScene } from '@/components/survival/tutorial/SurvivalTutorialPhraseBattleScene';

export function showSurvivalTutorialFinishCta(
  script: SurvivalTutorialScriptPayloadV3,
  scene: SurvivalTutorialScriptPayloadV3['scenes'][number],
): boolean {
  return scene.type === 'finish' && (script.finish?.showCta ?? true);
}

export function survivalTutorialFinishCtaLabel(isEnglishCopy: boolean): string {
  return isEnglishCopy ? 'Continue' : '続ける';
}

export interface SurvivalTutorialSceneHostProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: SurvivalTutorialScriptPayloadV3['scenes'][number];
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
  readonly onBlinkAdvanceToggle?: (value: boolean) => void;
}

const noopBlink = (): void => undefined;

export const SurvivalTutorialSceneHost: React.FC<SurvivalTutorialSceneHostProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
  onBlinkAdvanceToggle = noopBlink,
}) => {
  if (scene.type === 'dialogue_only') {
    return (
      <SurvivalTutorialDialogueScene
        script={script}
        scene={scene}
        bindings={bindings}
        embeddedFullHeight={embeddedFullHeight}
        onBlinkAdvanceToggle={onBlinkAdvanceToggle}
        onSceneComplete={onSceneComplete}
      />
    );
  }

  if (scene.type === 'finish') {
    return null;
  }

  if (scene.type === 'progression_battle' || scene.type === 'random_battle') {
    return (
      <SurvivalTutorialChordBattleScene
        script={script}
        scene={scene}
        bindings={bindings}
        embeddedFullHeight={embeddedFullHeight}
        onSceneComplete={onSceneComplete}
      />
    );
  }

  if (scene.type === 'phrase_battle') {
    return (
      <SurvivalTutorialPhraseBattleScene
        script={script}
        scene={scene}
        bindings={bindings}
        embeddedFullHeight={embeddedFullHeight}
        onSceneComplete={onSceneComplete}
      />
    );
  }

  return null;
};
