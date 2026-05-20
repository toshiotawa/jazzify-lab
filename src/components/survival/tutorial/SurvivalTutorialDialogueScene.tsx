import React, { useEffect, useMemo, useRef } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import { mergeSurvivalTutorialV3Baseline } from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

import type { SurvivalTutorialV3Bindings } from './survivalTutorialV3Bindings';

import { survivalTutorialLocalized } from './survivalTutorialV3Locales';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';

const DUMMY_SURVIVAL_CONFIG = {
  difficulty: 'easy' as const,
  displayName: 'Tutorial',
  description: '',
  descriptionEn: '',
  allowedChords: [] as readonly string[],
  enemySpawnRate: 3,
  enemySpawnCount: 2,
  enemyStatMultiplier: 0.5,
  expMultiplier: 0.5,
  itemDropRate: 0.1,
  bgmUrl: null as string | null,
};

interface SurvivalTutorialDialogueSceneProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: Extract<SurvivalTutorialScriptPayloadV3['scenes'][number], { type: 'dialogue_only' }>;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialDialogueScene: React.FC<SurvivalTutorialDialogueSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const lineSeconds = scene.lineIntervalSeconds ?? SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS;

  const dialogueScenarioOverrides = useMemo(() => {
    const base = mergeSurvivalTutorialV3Baseline(script);
    return {
      ...base,
      disableJoystick: false,
    };
  }, [script]);

  const screenKey = useMemo(
    () => `tutorial-v3-dialog:${scene.lines[0]?.ja ?? ''}:${scene.lines.length}`,
    [scene.lines],
  );

  useEffect(() => {
    const ac = new AbortController();
    const lines = scene.lines ?? [];
    if (lines.length === 0) {
      onSceneComplete();
      return undefined;
    }

    const run = async (): Promise<void> => {
      for (let i = 0; i < lines.length; i += 1) {
        if (ac.signal.aborted) return;
        const line = lines[i];
        if (!line) continue;
        bindingsRef.current.setCharacterLine(
          survivalTutorialLocalized(line, bindingsRef.current.isEnglishCopy),
        );
        await bindingsRef.current.waitForTapOrTimeout(lineSeconds, ac.signal);
        if (ac.signal.aborted) return;
      }
      bindingsRef.current.setCharacterLine('');
      if (!ac.signal.aborted) {
        onSceneComplete();
      }
    };

    void run();

    return () => {
      ac.abort();
      bindingsRef.current.setTapAdvanceCueVisible(false);
    };
  }, [lineSeconds, onSceneComplete, scene.lines]);

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <SurvivalGameScreen
        key={screenKey}
        difficulty="easy"
        hintMode
        stageDefinition={TUTORIAL_STAGE_DEFINITION}
        config={{
          ...DUMMY_SURVIVAL_CONFIG,
          allowedChords: [...DUMMY_SURVIVAL_CONFIG.allowedChords],
        }}
        embeddedFullHeight={embeddedFullHeight}
        survivalTutorialLayout={embeddedFullHeight}
        scenarioMode
        initialScenarioOverrides={dialogueScenarioOverrides}
        onBackToSelect={() => bindingsRef.current.onExit()}
        onBackToMenu={() => bindingsRef.current.onExit()}
      />
    </div>
  );
};
