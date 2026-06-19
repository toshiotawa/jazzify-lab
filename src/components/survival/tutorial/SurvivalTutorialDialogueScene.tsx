import React, { useEffect, useMemo, useRef } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import { mergeSurvivalTutorialV3Baseline } from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import type { SurvivalTutorialV3DialogueLine } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';

import type { SurvivalTutorialV3Bindings } from './survivalTutorialV3Bindings';
import type { SurvivalTutorialSharedRuntime } from './survivalTutorialSharedRuntime';

import {
  clearSurvivalTutorialV3LinePresentation,
  presentSurvivalTutorialV3Line,
} from './survivalTutorialV3DialogueSpeaker';
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

const dialogueSpeakerOf = (line: SurvivalTutorialV3DialogueLine): 'fai' | 'jajii' | 'narration' =>
  line.speaker ?? 'fai';

interface SurvivalTutorialDialogueSceneProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: Extract<SurvivalTutorialScriptPayloadV3['scenes'][number], { type: 'dialogue_only' }>;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
  readonly nextSceneIsFinish?: boolean;
  readonly sharedRuntime?: SurvivalTutorialSharedRuntime;
  readonly sceneFrozen?: boolean;
}

export const SurvivalTutorialDialogueScene: React.FC<SurvivalTutorialDialogueSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
  nextSceneIsFinish = false,
  sharedRuntime,
  sceneFrozen = false,
}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const localJajiiSpeechTextRef = useRef('');
  const localFaiSpeechTextRef = useRef('');
  const tutorialJajiiSpeechTextRef = sharedRuntime?.tutorialJajiiSpeechTextRef ?? localJajiiSpeechTextRef;
  const tutorialFaiSpeechTextRef = sharedRuntime?.tutorialFaiSpeechTextRef ?? localFaiSpeechTextRef;

  const linePresentationSink = useMemo(
    () => ({
      setCharacterText: (text: string) => {
        tutorialFaiSpeechTextRef.current = text;
        bindingsRef.current.setCharacterText('');
      },
      setNarrationText: (text: string) => {
        bindingsRef.current.setNarrationText(text);
      },
      setJajiiSpeechText: (text: string) => {
        tutorialJajiiSpeechTextRef.current = text;
      },
    }),
    [],
  );

  const sceneHasJajii = useMemo(
    () => scene.lines.some((l) => dialogueSpeakerOf(l) === 'jajii'),
    [scene.lines],
  );

  const lineSeconds = scene.lineIntervalSeconds ?? SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS;

  const dialogueScenarioOverrides = useMemo(() => {
    const base = mergeSurvivalTutorialV3Baseline(script);
    return {
      ...base,
      disableJoystick: false,
    };
  }, [script]);

  const screenKey = useMemo(
    () => `tutorial-v3-dialog:${scene.lines[0]?.ja ?? ''}:${scene.lines.length}:${sceneHasJajii}`,
    [scene.lines, sceneHasJajii],
  );

  const onSceneCompleteRef = useRef(onSceneComplete);
  onSceneCompleteRef.current = onSceneComplete;

  useEffect(() => {
    if (sceneFrozen) {
      return undefined;
    }
    const ac = new AbortController();
    const lines = scene.lines ?? [];
    tutorialJajiiSpeechTextRef.current = '';
    tutorialFaiSpeechTextRef.current = '';

    if (lines.length === 0) {
      onSceneCompleteRef.current();
      return undefined;
    }

    const run = async (): Promise<void> => {
      for (let i = 0; i < lines.length; i += 1) {
        if (ac.signal.aborted) return;
        const line = lines[i];
        if (!line) continue;
        presentSurvivalTutorialV3Line(
          line,
          bindingsRef.current.isEnglishCopy,
          'dialogue_only',
          linePresentationSink,
        );
        const isLastLine = i === lines.length - 1;
        if (!(isLastLine && nextSceneIsFinish)) {
          await bindingsRef.current.waitForTapOrTimeout(lineSeconds, ac.signal);
        }
        if (ac.signal.aborted) return;
      }
      clearSurvivalTutorialV3LinePresentation(linePresentationSink);
      if (!ac.signal.aborted) {
        onSceneCompleteRef.current();
      }
    };

    void run();

    return () => {
      ac.abort();
      bindingsRef.current.setTapAdvanceCueVisible(false);
      clearSurvivalTutorialV3LinePresentation(linePresentationSink);
    };
  }, [linePresentationSink, lineSeconds, nextSceneIsFinish, scene.lines, sceneFrozen]);

  return sharedRuntime ? null : (
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
        tutorialDialogueJajii={sceneHasJajii}
        tutorialJajiiSpeechTextRef={tutorialJajiiSpeechTextRef}
        tutorialFaiSpeechTextRef={tutorialFaiSpeechTextRef}
        onBackToSelect={() => bindingsRef.current.onExit()}
        onBackToMenu={() => bindingsRef.current.onExit()}
      />
    </div>
  );
};
