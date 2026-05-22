import React, { useEffect, useMemo, useRef, useState } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  buildDifficultyConfigForSurvivalV3,
  buildStageDefinitionFromSurvivalV3Content,
  chordDefinitionFromV3ChordDef,
  pickRandomTutorialChords,
} from '@/components/survival/tutorial/buildTutorialStageFromSurvivalV3Content';
import { runSurvivalTutorialQuestions } from '@/components/survival/tutorial/survivalTutorialQuestionFlow';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import { SURVIVAL_TUTORIAL_V3_INTRO_HOLD_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';
import {
  clearSurvivalTutorialV3LinePresentation,
  presentSurvivalTutorialV3Line,
  presentSurvivalTutorialV3ResolvedSegments,
} from '@/components/survival/tutorial/survivalTutorialV3DialogueSpeaker';
import {
  mergeSurvivalTutorialV3Baseline,
  survivalTutorialChordIntroBlockOverrides,
  survivalTutorialChordRevealOverrides,
} from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { survivalTutorialV3ContentIsPhraseBlock } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import {
  survivalTutorialResolvedSegmentsWithRemaining,
} from '@/components/survival/tutorial/survivalTutorialV3Locales';
import type { TutorialResolvedTextSegment } from '@/types/tutorialStyledText';

type ChordBattleScene =
  | Extract<SurvivalTutorialScriptPayloadV3['scenes'][number], { type: 'progression_battle' }>
  | Extract<SurvivalTutorialScriptPayloadV3['scenes'][number], { type: 'random_battle' }>;

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

export interface SurvivalTutorialChordBattleSceneProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: ChordBattleScene;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialChordBattleScene: React.FC<SurvivalTutorialChordBattleSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const content = script.content[scene.contentRef];
  const block = content && !survivalTutorialV3ContentIsPhraseBlock(content) ? content : null;

  const stageDefinition = useMemo(
    () => (block ? buildStageDefinitionFromSurvivalV3Content(block) : null),
    [block],
  );

  const difficultyConfig = useMemo(
    () => (stageDefinition && block ? buildDifficultyConfigForSurvivalV3(stageDefinition, block) : null),
    [stageDefinition, block],
  );

  const progressionChords = useMemo(() => {
    if (!block || block.stage.stageType !== 'progression') {
      return [];
    }
    const prog = block.chordProgression ?? [];
    return prog.map((c, i) => chordDefinitionFromV3ChordDef(c, i, 'tutorial-v3-prog'));
  }, [block]);

  const randomChords = useMemo(() => {
    if (!block || scene.type !== 'random_battle') {
      return [];
    }
    return pickRandomTutorialChords(block, scene.hardQuestions ?? false, scene.questionCount);
  }, [block, scene]);

  const chords = scene.type === 'progression_battle' ? progressionChords : randomChords;

  const totalQuestions =
    scene.type === 'progression_battle'
      ? Math.max(0, scene.loopCount)
      : Math.max(0, scene.questionCount);

  const slotBPulseRef = useRef(0);
  const userPulseRef = useRef(0);
  const midiRef = useRef(false);
  const tutorialJajiiSpeechSegmentsRef = useRef<readonly TutorialResolvedTextSegment[]>([]);

  const [scenarioHandle, setScenarioHandle] = useState<SurvivalScenarioHandle | null>(null);

  const linePresentationSink = useMemo(
    () => ({
      setCharacterSegments: (segments: readonly TutorialResolvedTextSegment[]) => {
        bindingsRef.current.setCharacterSegments(segments);
      },
      setNarrationText: (text: string) => {
        bindingsRef.current.setNarrationText(text);
      },
      setJajiiSpeechSegments: (segments: readonly TutorialResolvedTextSegment[]) => {
        tutorialJajiiSpeechSegmentsRef.current = segments;
      },
    }),
    [],
  );

  useEffect(() => {
    const h = scenarioHandle;
    if (!h || !block || stageDefinition === null || difficultyConfig === null) {
      return undefined;
    }
    if (totalQuestions <= 0 || chords.length === 0) {
      onSceneComplete();
      return undefined;
    }

    const ac = new AbortController();
    const baseline = mergeSurvivalTutorialV3Baseline(script);

    const waitChordCompletion = (timeoutSeconds: number): Promise<boolean> => {
      const start = slotBPulseRef.current;
      const deadline = Date.now() + timeoutSeconds * 1000;
      return new Promise((resolve) => {
        const tick = (): void => {
          if (ac.signal.aborted) {
            resolve(false);
            return;
          }
          if (slotBPulseRef.current !== start) {
            resolve(true);
            return;
          }
          if (Date.now() >= deadline) {
            resolve(false);
            return;
          }
          window.setTimeout(tick, 40);
        };
        tick();
      });
    };

    const run = async (): Promise<void> => {
      h.setOverrides({ ...baseline });
      h.clearEnemies();
      h.setSlotAEnabled(false);
      h.setSlotBEnabled(true);

      const introSecs = scene.introDelaySeconds ?? SURVIVAL_TUTORIAL_V3_INTRO_HOLD_SECONDS;
      let progressed = false;
      let activeQuestionIndex = 0;
      try {
        const finishedOk = await runSurvivalTutorialQuestions({
          totalQuestions,
          signal: ac.signal,
          introHoldSeconds: introSecs,
          sleepSeconds,
          callbacks: {
            onIntro: () => {
              h.setOverrides(survivalTutorialChordIntroBlockOverrides(baseline));
              h.clearEnemies();
              h.setSlotBChord(null);
              presentSurvivalTutorialV3Line(
                scene.dialogue.intro,
                bindingsRef.current.isEnglishCopy,
                'battle',
                linePresentationSink,
              );
            },
            onRevealFight: () => {
              const ch = chords[activeQuestionIndex % chords.length];
              if (ch) {
                h.setSlotBChord(ch);
              }
              h.setOverrides(survivalTutorialChordRevealOverrides(baseline));
              presentSurvivalTutorialV3Line(
                scene.dialogue.onReveal,
                bindingsRef.current.isEnglishCopy,
                'battle',
                linePresentationSink,
              );
              h.clearEnemies();
              h.spawnStationaryRing(12, 180);
            },
          },
          onPrepareQuestion: (qi) => {
            activeQuestionIndex = qi;
          },
          waitIntroAdvance: (seconds, signal) =>
            bindingsRef.current.waitForTapOrTimeout(seconds, signal),
          waitForChordCompletion: waitChordCompletion,
          emitSpecialGaugeSkill: () => {
            h.emitSpecialShockwave();
          },
          afterCorrect: (_remainingQuestions, qiCompleted) => {
            const answered = qiCompleted + 1;
            const remainingAfter = Math.max(0, totalQuestions - answered);
            presentSurvivalTutorialV3ResolvedSegments(
              scene.dialogue.onCorrectRemaining,
              survivalTutorialResolvedSegmentsWithRemaining(
                scene.dialogue.onCorrectRemaining,
                bindingsRef.current.isEnglishCopy,
                remainingAfter,
              ),
              'battle',
              linePresentationSink,
            );
          },
        });
        progressed = Boolean(finishedOk) && !ac.signal.aborted;
      } catch {
        progressed = false;
      }

      clearSurvivalTutorialV3LinePresentation(linePresentationSink);
      if (progressed) {
        onSceneComplete();
      }
    };

    void run();

    return () => {
      ac.abort();
      bindingsRef.current.setTapAdvanceCueVisible(false);
    };
  }, [
    block,
    chords,
    difficultyConfig,
    onSceneComplete,
    scene,
    scenarioHandle,
    script,
    stageDefinition,
    totalQuestions,
  ]);

  if (!block || !stageDefinition || !difficultyConfig) {
    return null;
  }

  const cfg = difficultyConfig;

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <SurvivalGameScreen
        key={`tutorial-v3-chord:${scene.type}:${scene.contentRef}`}
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
        initialScenarioOverrides={mergeSurvivalTutorialV3Baseline(script)}
        tutorialDialogueJajii
        tutorialJajiiSpeechSegmentsRef={tutorialJajiiSpeechSegmentsRef}
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
