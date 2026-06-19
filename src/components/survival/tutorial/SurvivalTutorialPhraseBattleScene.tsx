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
  SURVIVAL_TUTORIAL_V3_PLAY_REST_SECONDS,
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
import type { SurvivalTutorialSharedRuntime } from '@/components/survival/tutorial/survivalTutorialSharedRuntime';
import { mergeSurvivalTutorialV3Baseline } from '@/components/survival/tutorial/survivalTutorialV3Scenario';

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

/** pulse ref の増分だけ待つ（低頻ポーリングのみ。ループ完了/塊正解いずれにも使用） */
function waitPulseDelta(
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
  readonly sharedRuntime?: SurvivalTutorialSharedRuntime;
  readonly sceneFrozen?: boolean;
}

export const SurvivalTutorialPhraseBattleScene: React.FC<SurvivalTutorialPhraseBattleSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
  sharedRuntime,
  sceneFrozen = false,
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

  const localPulseRef = useRef(0);
  const localChordCompleteRef = useRef(0);
  const localSlotBPulseRef = useRef(0);
  const localUserPulseRef = useRef(0);
  const localMidiRef = useRef(false);
  const localJajiiSpeechTextRef = useRef('');
  const localFaiSpeechTextRef = useRef('');
  const pulseRef = sharedRuntime?.phraseFullLoopPulseRef ?? localPulseRef;
  const chordCompleteRef = sharedRuntime?.phraseChordCompletePulseRef ?? localChordCompleteRef;
  const slotBPulseRef = sharedRuntime?.slotBCompletionPulseRef ?? localSlotBPulseRef;
  const userPulseRef = sharedRuntime?.userInputPulseRef ?? localUserPulseRef;
  const midiRef = sharedRuntime?.midiNoteReceivedRef ?? localMidiRef;
  const tutorialJajiiSpeechTextRef = sharedRuntime?.tutorialJajiiSpeechTextRef ?? localJajiiSpeechTextRef;
  const tutorialFaiSpeechTextRef = sharedRuntime?.tutorialFaiSpeechTextRef ?? localFaiSpeechTextRef;

  const [localScenarioHandle, setLocalScenarioHandle] = useState<SurvivalScenarioHandle | null>(null);
  const scenarioHandle = sharedRuntime?.scenarioHandle ?? localScenarioHandle;

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

  const onSceneCompleteRef = useRef(onSceneComplete);
  onSceneCompleteRef.current = onSceneComplete;

  useEffect(() => {
    if (sceneFrozen) {
      return undefined;
    }
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
      onSceneCompleteRef.current();
      return undefined;
    }

    const ac = new AbortController();
    const baseline = scene.playAlong
      ? mergeSurvivalTutorialV3Baseline(script)
      : survivalTutorialPhraseBattleBaseline(script);
    if (!scene.playAlong) {
      bindingsRef.current.pauseSharedDrumLoop?.();
    }

    const playChords = block.phrases[0]?.chords ?? [];

    /** 従来: フレーズ全周回を requiredLoops 回撃破する撃破バトル。 */
    const runBattleLoop = async (
      h2: SurvivalScenarioHandle,
      signal: AbortSignal,
    ): Promise<boolean> => {
      h2.setOverrides(survivalTutorialPhraseIntroBlockOverrides(baseline));
      presentSurvivalTutorialV3Line(
        scene.dialogue.intro,
        bindingsRef.current.isEnglishCopy,
        'battle',
        linePresentationSink,
      );
      await bindingsRef.current.waitForTapOrTimeout(
        scene.introDelaySeconds ?? SURVIVAL_TUTORIAL_V3_INTRO_HOLD_SECONDS,
        signal,
      );
      if (signal.aborted) return false;

      const introPulse = pulseRef.current;
      h2.setOverrides(survivalTutorialPhraseRevealOverrides(baseline));
      presentSurvivalTutorialV3Line(
        scene.dialogue.onReveal,
        bindingsRef.current.isEnglishCopy,
        'battle',
        linePresentationSink,
      );
      h2.clearEnemies();
      h2.spawnStationaryRing(
        SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_COUNT,
        SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_RADIUS,
      );

      const loopsOk = await waitPulseDelta(
        () => pulseRef.current,
        introPulse,
        scene.requiredLoops,
        signal,
      );
      if (!loopsOk || signal.aborted) return false;

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
      h2.emitSpecialShockwave();
      return true;
    };

    /**
     * play(一緒に弾かせる): 塊を1つずつ正解で進める。塊の quote セリフを小節/拍に
     * 同期（=塊単位）で提示し、休符塊は自動送り(タップでも送れる)。staff3 bass は
     * 正解時に SurvivalGameScreen 側で発音する。最後の塊正解後にスキップ提示。
     */
    const runPlayAlong = async (
      h2: SurvivalScenarioHandle,
      signal: AbortSignal,
    ): Promise<boolean> => {
      if (playChords.length === 0) return false;
      h2.setOverrides(survivalTutorialPhraseRevealOverrides(baseline));
      h2.clearEnemies();
      h2.spawnStationaryRing(
        SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_COUNT,
        SURVIVAL_TUTORIAL_V3_PHRASE_REVEAL_ENEMY_RADIUS,
      );
      if (scene.dialogue.intro.ja || scene.dialogue.intro.en) {
        presentSurvivalTutorialV3Line(
          scene.dialogue.intro,
          bindingsRef.current.isEnglishCopy,
          'battle',
          linePresentationSink,
        );
      }

      let prevPulse = chordCompleteRef.current;
      for (let i = 0; i < playChords.length; i += 1) {
        if (signal.aborted) return false;
        const ch = playChords[i];
        if (ch.quote && (ch.quote.ja || ch.quote.en)) {
          presentSurvivalTutorialV3Line(
            ch.quote,
            bindingsRef.current.isEnglishCopy,
            'battle',
            linePresentationSink,
          );
        }
        if (ch.voicing.length === 0) {
          // 会話だけの小節（休符塊）: 自動送り + タップ送り。
          const isLastChunk = i === playChords.length - 1;
          if (!isLastChunk) {
            bindingsRef.current.setTapAdvanceCueVisible(true);
            await bindingsRef.current.waitForTapOrTimeout(
              SURVIVAL_TUTORIAL_V3_PLAY_REST_SECONDS,
              signal,
            );
            bindingsRef.current.setTapAdvanceCueVisible(false);
          }
          if (signal.aborted) return false;
          h2.advancePhraseRestChord();
          prevPulse = chordCompleteRef.current;
        } else {
          const ok = await waitPulseDelta(
            () => chordCompleteRef.current,
            prevPulse,
            1,
            signal,
          );
          if (!ok) return false;
          prevPulse += 1;
        }
      }

      if (signal.aborted) return false;

      h2.emitSpecialShockwave();
      return true;
    };

    const run = async (): Promise<void> => {
      h.setOverrides({ ...baseline });
      h.clearEnemies();

      await sleepSeconds(0.08, ac.signal);

      let progressed = false;

      try {
        if (scene.playAlong) {
          progressed = await runPlayAlong(h, ac.signal);
        } else {
          progressed = await runBattleLoop(h, ac.signal);
        }
      } catch {
        /* ignore */
      } finally {
        clearSurvivalTutorialV3LinePresentation(linePresentationSink);
        if (!scene.playAlong) {
          bindingsRef.current.resumeSharedDrumLoop?.();
        }
        bindingsRef.current.setTapAdvanceCueVisible(false);
        if (progressed) {
          onSceneCompleteRef.current();
        }
      }
    };

    void run();

    return () => {
      ac.abort();
      if (!scene.playAlong) {
        bindingsRef.current.resumeSharedDrumLoop?.();
      }
      bindingsRef.current.setTapAdvanceCueVisible(false);
    };
  }, [
    block,
    difficultyConfig,
    phraseInline,
    scene,
    scenarioHandle,
    script,
    stageDefinition,
    sceneFrozen,
  ]);

  if (!block || phraseInline === null || !stageDefinition || !difficultyConfig) {
    return null;
  }

  const cfg = difficultyConfig;

  return sharedRuntime ? null : (
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
        tutorialFaiSpeechTextRef={tutorialFaiSpeechTextRef}
        tutorialPhraseInlineDefinition={phraseInline}
        scenarioPhraseFullLoopPulseRef={pulseRef}
        scenarioPhraseChordCompletePulseRef={chordCompleteRef}
        onScenarioHandleReady={(x) => {
          setLocalScenarioHandle(x);
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
