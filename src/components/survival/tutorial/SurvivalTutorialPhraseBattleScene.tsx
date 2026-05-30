import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  buildDifficultyConfigForSurvivalV3,
  buildStageDefinitionFromSurvivalV3Content,
  buildTutorialPhraseDefinitionFromV3Block,
} from '@/components/survival/tutorial/buildTutorialStageFromSurvivalV3Content';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import {
  SURVIVAL_TUTORIAL_V3_INTRO_HOLD_SECONDS,
  SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_COUNT,
  SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_RADIUS,
} from '@/components/survival/tutorial/survivalTutorialV3Constants';
import {
  survivalTutorialPhraseBattleBaseline,
  survivalTutorialPhraseIntroBlockOverrides,
  survivalTutorialPhraseRevealOverrides,
} from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { survivalTutorialV3ContentIsPhraseBlock } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  clearSurvivalTutorialV3LinePresentation,
  presentSurvivalTutorialV3Line,
  presentSurvivalTutorialV3ResolvedLine,
} from '@/components/survival/tutorial/survivalTutorialV3DialogueSpeaker';
import { survivalTutorialLocalizedWithRemaining } from '@/components/survival/tutorial/survivalTutorialV3Locales';

type PhraseScene = Extract<
  SurvivalTutorialScriptPayloadV3['scenes'][number],
  { type: 'phrase_battle' }
>;

function sleepSeconds(seconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const ms = Math.max(0, seconds * 1000);
    const t = window.setTimeout(() => resolve(), ms);
    signal.addEventListener(
      'abort',
      () => {
        window.clearTimeout(t);
        resolve();
      },
      { once: true },
    );
  });
}

/** `scenarioPhraseFullLoopPulseRef` の増分だけ待つ（低頻ポーリングのみ） */
function waitPhraseLoopPulseDelta(
  getPulse: () => number,
  startPulse: number,
  delta: number,
  signal: AbortSignal,
): Promise<boolean> {
  const target = startPulse + delta;
  const deadline = Date.now() + 320_000;
  return new Promise((resolve) => {
    const tick = (): void => {
      if (signal.aborted) {
        resolve(false);
        return;
      }
      if (getPulse() >= target) {
        resolve(true);
        return;
      }
      if (Date.now() >= deadline) {
        resolve(false);
        return;
      }
      window.setTimeout(tick, 45);
    };
    tick();
  });
}

export interface SurvivalTutorialPhraseBattleSceneProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: PhraseScene;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialPhraseBattleScene: React.FC<SurvivalTutorialPhraseBattleSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const phraseBlockRaw = script.content[scene.contentRef];
  const block =
    phraseBlockRaw && survivalTutorialV3ContentIsPhraseBlock(phraseBlockRaw) ? phraseBlockRaw : null;

  const phraseInline = useMemo(() => (block ? buildTutorialPhraseDefinitionFromV3Block(block) : null), [block]);

  const stageDefinition = useMemo(
    () => (block ? buildStageDefinitionFromSurvivalV3Content(block) : null),
    [block],
  );

  const difficultyConfig = useMemo(
    () => (stageDefinition && block ? buildDifficultyConfigForSurvivalV3(stageDefinition, block) : null),
    [stageDefinition, block],
  );

  const pulseRef = useRef(0);
  const slotBPulseRef = useRef(0);
  const userPulseRef = useRef(0);
  const midiRef = useRef(false);
  const tutorialJajiiSpeechTextRef = useRef('');

  const [scenarioHandle, setScenarioHandle] = useState<SurvivalScenarioHandle | null>(null);

  const linePresentationSink = useMemo(
    () => ({
      setCharacterText: (text: string) => {
        bindingsRef.current.setCharacterText(text);
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

  useEffect(() => {
    const h = scenarioHandle;
    if (
      !h ||
      !block ||
      phraseInline === null ||
      phraseInline.chords.length === 0 ||
      stageDefinition === null ||
      difficultyConfig === null
    ) {
      return undefined;
    }
    if (scene.requiredLoops <= 0) {
      onSceneComplete();
      return undefined;
    }

    const ac = new AbortController();
    const baseline = survivalTutorialPhraseBattleBaseline(script);
    bindingsRef.current.pauseSharedDrumLoop?.();

    const run = async (): Promise<void> => {
      h.setOverrides({ ...baseline });
      h.clearEnemies();

      await sleepSeconds(0.08, ac.signal);

      let progressed = false;

      try {
        h.setOverrides(survivalTutorialPhraseIntroBlockOverrides(baseline));
        presentSurvivalTutorialV3Line(
          scene.dialogue.intro,
          bindingsRef.current.isEnglishCopy,
          'battle',
          linePresentationSink,
        );

        await bindingsRef.current.waitForTapOrTimeout(
          scene.introDelaySeconds ?? SURVIVAL_TUTORIAL_V3_INTRO_HOLD_SECONDS,
          ac.signal,
        );
        if (ac.signal.aborted) {
          return;
        }

        const introPulse = pulseRef.current;
        h.setOverrides(survivalTutorialPhraseRevealOverrides(baseline));
        presentSurvivalTutorialV3Line(
          scene.dialogue.onReveal,
          bindingsRef.current.isEnglishCopy,
          'battle',
          linePresentationSink,
        );
        h.clearEnemies();
        h.spawnStationaryRing(
          SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_COUNT,
          SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_RADIUS,
        );

        const loopsOk = await waitPhraseLoopPulseDelta(
          () => pulseRef.current,
          introPulse,
          scene.requiredLoops,
          ac.signal,
        );

        if (loopsOk && !ac.signal.aborted) {
          progressed = true;
          presentSurvivalTutorialV3ResolvedLine(
            scene.dialogue.onCorrectRemaining,
            survivalTutorialLocalizedWithRemaining(
              scene.dialogue.onCorrectRemaining,
              bindingsRef.current.isEnglishCopy,
              0,
            ),
            'battle',
            linePresentationSink,
          );
          h.emitSpecialShockwave();
        }
      } catch {
        /* ignore */
      } finally {
        clearSurvivalTutorialV3LinePresentation(linePresentationSink);
        bindingsRef.current.resumeSharedDrumLoop?.();
        bindingsRef.current.setTapAdvanceCueVisible(false);
        if (progressed) {
          onSceneComplete();
        }
      }
    };

    void run();

    return () => {
      ac.abort();
      bindingsRef.current.resumeSharedDrumLoop?.();
      bindingsRef.current.setTapAdvanceCueVisible(false);
    };
  }, [
    block,
    difficultyConfig,
    onSceneComplete,
    phraseInline,
    scene,
    scenarioHandle,
    script,
    stageDefinition,
  ]);

  if (!block || phraseInline === null || !stageDefinition || !difficultyConfig) {
    return null;
  }

  const cfg = difficultyConfig;

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <SurvivalGameScreen
        key={`tutorial-v3-phrase:${scene.contentRef}`}
        difficulty="easy"
        hintMode
        stageDefinition={stageDefinition}
        config={{
          ...cfg,
          allowedChords: [...cfg.allowedChords],
        }}
        embeddedFullHeight={embeddedFullHeight}
        survivalTutorialLayout={embeddedFullHeight}
        scenarioMode
        initialScenarioOverrides={survivalTutorialPhraseBattleBaseline(script)}
        tutorialDialogueJajii
        tutorialJajiiSpeechTextRef={tutorialJajiiSpeechTextRef}
        tutorialPhraseInlineDefinition={phraseInline}
        scenarioPhraseFullLoopPulseRef={pulseRef}
        onScenarioHandleReady={(x) => {
          setScenarioHandle(x);
        }}
        scenarioUserInputPulseRef={userPulseRef}
        scenarioSlotBCompletionPulseRef={slotBPulseRef}
        scenarioMidiNoteReceivedRef={midiRef}
        onBackToSelect={() => bindingsRef.current.onExit()}
        onBackToMenu={() => bindingsRef.current.onExit()}
      />
    </div>
  );
};