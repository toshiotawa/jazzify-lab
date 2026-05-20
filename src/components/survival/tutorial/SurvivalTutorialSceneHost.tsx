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

/** v3 台本末尾の完了 CTA（固定文言）。 */
export function survivalTutorialFinishCtaLabel(isEnglishCopy: boolean): string {
  return isEnglishCopy ? 'Complete' : '完了する';
}

/** オンボーディング等のデモプレイ CTA（固定文言）。 */
export function survivalTutorialDemoPlayCtaLabel(isEnglishCopy: boolean): string {
  return isEnglishCopy ? 'Go to your first quest' : '最初のクエストに進む';
}

export interface SurvivalTutorialSceneHostProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: SurvivalTutorialScriptPayloadV3['scenes'][number];
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialSceneHost: React.FC<SurvivalTutorialSceneHostProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
}) => {
  if (scene.type === 'dialogue_only') {
    return (
      <SurvivalTutorialDialogueScene
        script={script}
        scene={scene}
        bindings={bindings}
        embeddedFullHeight={embeddedFullHeight}
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
