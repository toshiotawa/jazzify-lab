import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { OnboardingOverlays } from '@/components/onboarding/OnboardingOverlays';
import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { StageDefinition } from '@/components/survival/SurvivalStageDefinitions';
import type { DifficultyConfig } from '@/components/survival/SurvivalTypes';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import { TUTORIAL_BOOTSTRAP_OVERRIDES } from '@/components/survival/scenario/survivalScenarioTypes';
import { buildTutorialStageDefinition } from '@/components/survival/tutorial/buildTutorialStageDefinition';
import {
  fetchSurvivalTutorialScript,
  isInterpretedTutorialScript,
  type SurvivalTutorialScriptPayload,
} from '@/components/survival/tutorial/fetchSurvivalTutorialScript';
import {
  resolveLegacyTutorialRunnerKey,
  resolveSurvivalBuiltinTutorialRunner,
  runSurvivalTutorialFromScriptPayload,
  type SurvivalBuiltinTutorialRunner,
} from '@/components/survival/tutorial/tutorialRunnerRegistry';
import type { RunTutorialIiViScriptParams } from '@/components/survival/tutorial/tutorialIiViScript';
import { TutorialAudioController } from '@/components/survival/tutorial/TutorialAudioController';
import { TUTORIAL_DRUM_LOOP_AUDIO_TRACKS } from '@/components/survival/tutorial/tutorialDrumLoopBgm';
import { unlockTutorialAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

const TUTORIAL_CONFIG: DifficultyConfig = {
  difficulty: 'easy',
  displayName: 'Tutorial',
  description: 'チュートリアル',
  descriptionEn: 'Tutorial',
  allowedChords: [],
  enemySpawnRate: 3,
  enemySpawnCount: 2,
  enemyStatMultiplier: 0.5,
  expMultiplier: 0.5,
  itemDropRate: 0.1,
  bgmUrl: null,
};

export interface SurvivalLessonTutorialExperienceProps {
  scriptId?: string;
  embeddedFullHeight?: boolean;
  showSkip?: boolean;
  /** CTA／台本末尾まで完了時のみに呼ぶ（進捗更新用） */
  onLessonTutorialCompleted?: () => void | Promise<void>;
  /** スキップ・戻る・未定義 runner で必ず一度呼ぶ */
  onExit: () => void;
}

type GateState = 'loading' | 'ready' | 'unknown_runner';

/**
 * DB `survival_tutorial_script_id` と `builtinRunner` で駆動するレッスン・サバイバルチュートリアル。
 */
export const SurvivalLessonTutorialExperience: React.FC<
  SurvivalLessonTutorialExperienceProps
> = ({
  scriptId = 'onboarding-v1',
  embeddedFullHeight = false,
  showSkip = true,
  onLessonTutorialCompleted,
  onExit,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const isEnglishCopy = shouldUseEnglishCopy({
    preferredLocale: profile?.preferred_locale,
    country: profile?.country,
    rank: profile?.rank,
  });

  const [gate, setGate] = useState<GateState>('loading');
  const [unknownRunnerKey, setUnknownRunnerKey] = useState<string | null>(null);
  const [loadedScript, setLoadedScript] = useState<SurvivalTutorialScriptPayload | null>(null);
  const [stageDefinition, setStageDefinition] = useState<StageDefinition>(TUTORIAL_STAGE_DEFINITION);

  const [characterText, setCharacterText] = useState('');
  const [narrationText, setNarrationText] = useState('');
  const [connectedDeviceLine, setConnectedDeviceLine] = useState<string | null>(null);
  const [showPillarCard, setShowPillarCard] = useState(false);
  const [pillarCaption, setPillarCaption] = useState<string | null>(null);
  const [pillarSystemImage, setPillarSystemImage] = useState<string | null>(null);
  const [showCta, setShowCta] = useState(false);

  const audioRef = useRef<TutorialAudioController | null>(null);
  const runnerAbortRef = useRef<AbortController | null>(null);
  const runnerStartedRef = useRef(false);
  const userInputPulseRef = useRef(0);
  const slotBCompletionPulseRef = useRef(0);
  const midiNoteReceivedRef = useRef(false);
  const runnerFnRef = useRef<SurvivalBuiltinTutorialRunner | null>(null);
  const finalizedOnceRef = useRef(false);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    const unlockOnce = (): void => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      void unlockTutorialAudio();
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlockOnce);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setGate('loading');
      setUnknownRunnerKey(null);
      setLoadedScript(null);

      try {
        const row = await fetchSurvivalTutorialScript(scriptId);
        if (isInterpretedTutorialScript(row.script)) {
          if (!cancelled) {
            setLoadedScript(row.script);
            setStageDefinition(buildTutorialStageDefinition(row.script));
            runnerFnRef.current = null;
            runnerStartedRef.current = false;
            finalizedOnceRef.current = false;
            setGate('ready');
          }
          return;
        }

        const builtinKey = resolveLegacyTutorialRunnerKey(row.script, scriptId);
        const runnerFn = resolveSurvivalBuiltinTutorialRunner(builtinKey);
        if (!runnerFn) {
          if (!cancelled) {
            setUnknownRunnerKey(builtinKey);
            setGate('unknown_runner');
          }
          return;
        }
        runnerFnRef.current = runnerFn;
        if (!cancelled) {
          setLoadedScript(row.script);
          setStageDefinition(TUTORIAL_STAGE_DEFINITION);
          runnerStartedRef.current = false;
          finalizedOnceRef.current = false;
          setGate('ready');
        }
      } catch {
        const builtinKey = scriptId ?? 'onboarding-v1';
        const runnerFn = resolveSurvivalBuiltinTutorialRunner(builtinKey);
        if (!runnerFn) {
          if (!cancelled) {
            setUnknownRunnerKey(builtinKey);
            setGate('unknown_runner');
          }
          return;
        }
        runnerFnRef.current = runnerFn;
        if (!cancelled) {
          setStageDefinition(TUTORIAL_STAGE_DEFINITION);
          runnerStartedRef.current = false;
          finalizedOnceRef.current = false;
          setGate('ready');
        }
      }
    })();

    return () => {
      cancelled = true;
      runnerAbortRef.current?.abort();
      audioRef.current?.dispose();
    };
  }, [scriptId]);

  const finalizeLesson = useCallback(
    async (kind: 'completed' | 'aborted') => {
      if (finalizedOnceRef.current) return;
      finalizedOnceRef.current = true;
      runnerAbortRef.current?.abort();
      audioRef.current?.stopAllAudio();
      if (kind === 'completed') await onLessonTutorialCompleted?.();
      onExit();
    },
    [onExit, onLessonTutorialCompleted],
  );

  const onScenarioHandleReady = useCallback(
    (handle: SurvivalScenarioHandle) => {
      if (gate !== 'ready' || runnerStartedRef.current) return;
      runnerStartedRef.current = true;

      const run = async () => {
        const audio = new TutorialAudioController();
        audioRef.current = audio;
        await audio.ensureBgmSettings();

        try {
          const row = await fetchSurvivalTutorialScript(scriptId);
          audio.setTracks(row.script.audioTracks ?? TUTORIAL_DRUM_LOOP_AUDIO_TRACKS);
        } catch {
          audio.setTracks(TUTORIAL_DRUM_LOOP_AUDIO_TRACKS);
        }

        const abort = new AbortController();
        runnerAbortRef.current = abort;

        const waitForMidiNoteOrTimeout = (seconds: number): Promise<boolean> => {
          midiNoteReceivedRef.current = false;
          return new Promise((resolve) => {
            const deadline = Date.now() + seconds * 1000;
            const tick = () => {
              if (abort.signal.aborted) {
                resolve(false);
                return;
              }
              if (midiNoteReceivedRef.current) {
                resolve(true);
                return;
              }
              if (Date.now() >= deadline) {
                resolve(false);
                return;
              }
              window.setTimeout(tick, 80);
            };
            tick();
          });
        };

        const waitForFirstInputNote = (): Promise<void> => {
          const start = userInputPulseRef.current;
          return new Promise((resolve) => {
            const check = () => {
              if (abort.signal.aborted || userInputPulseRef.current !== start) {
                resolve();
                return;
              }
              window.setTimeout(check, 40);
            };
            check();
          });
        };

        const waitForSlotBCompletion = (startPulse: number, seconds: number): Promise<boolean> => {
          const deadline = Date.now() + seconds * 1000;
          return new Promise((resolve) => {
            const tick = () => {
              if (abort.signal.aborted) {
                resolve(false);
                return;
              }
              if (slotBCompletionPulseRef.current !== startPulse) {
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

        const params: RunTutorialIiViScriptParams = {
          isEnglishCopy,
          ui: {
            setCharacterText,
            setNarrationText,
            setConnectedDeviceLine,
            setShowPillarCard,
            setPillarCaption,
            setPillarSystemImage,
            setShowCta,
          },
          handle,
          audio,
          waitForMidiNoteOrTimeout,
          waitForFirstInputNote,
          waitForSlotBCompletion,
          onFinish: () => {
            void finalizeLesson('completed');
          },
          signal: abort.signal,
        };

        if (loadedScript && isInterpretedTutorialScript(loadedScript)) {
          await runSurvivalTutorialFromScriptPayload({
            ...params,
            script: loadedScript,
          });
          return;
        }

        const runnerFn = runnerFnRef.current;
        if (!runnerFn) {
          await finalizeLesson('aborted');
          return;
        }
        await runnerFn(params);
      };

      void run();
    },
    [finalizeLesson, gate, isEnglishCopy, loadedScript, scriptId],
  );

  const gameScreenKey = useMemo(
    () => `${scriptId}:${stageDefinition.chordDisplayName}`,
    [scriptId, stageDefinition.chordDisplayName],
  );

  const handleSkip = useCallback(() => {
    void finalizeLesson('aborted');
  }, [finalizeLesson]);

  const handleCta = useCallback(() => {
    void finalizeLesson('completed');
  }, [finalizeLesson]);

  if (gate === 'loading') {
    return (
      <div className="flex h-full min-h-[var(--dvh,100dvh)] w-full flex-col items-center justify-center gap-4 bg-black text-white">
        <span className="text-sm">{isEnglishCopy ? 'Loading…' : '読み込み中…'}</span>
      </div>
    );
  }

  if (gate === 'unknown_runner' && unknownRunnerKey !== null) {
    return (
      <div className="flex h-full min-h-[var(--dvh,100dvh)] w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-base font-semibold">
          {isEnglishCopy ? 'Tutorial is not available for this lesson yet.' : 'この課題用のガイドはまだ準備中です。'}
        </p>
        <button
          type="button"
          onClick={() => onExit()}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
        >
          {isEnglishCopy ? 'Back' : '戻る'}
        </button>
      </div>
    );
  }

  return (
    <div
      className={
        embeddedFullHeight
          ? 'relative h-full min-h-0 w-full overflow-hidden bg-black'
          : 'relative fixed inset-0 z-50 bg-black'
      }
    >
      <SurvivalGameScreen
        key={gameScreenKey}
        difficulty="easy"
        config={TUTORIAL_CONFIG}
        stageDefinition={stageDefinition}
        hintMode
        embeddedFullHeight={embeddedFullHeight}
        survivalTutorialLayout={embeddedFullHeight}
        scenarioMode
        initialScenarioOverrides={TUTORIAL_BOOTSTRAP_OVERRIDES}
        onScenarioHandleReady={onScenarioHandleReady}
        scenarioUserInputPulseRef={userInputPulseRef}
        scenarioSlotBCompletionPulseRef={slotBCompletionPulseRef}
        scenarioMidiNoteReceivedRef={midiNoteReceivedRef}
        onBackToSelect={() => finalizeLesson('aborted')}
        onBackToMenu={() => finalizeLesson('aborted')}
      />

      <OnboardingOverlays
        characterText={characterText}
        narrationText={narrationText}
        connectedDeviceLine={connectedDeviceLine}
        showPillarCard={showPillarCard}
        pillarCaption={pillarCaption}
        pillarSystemImage={pillarSystemImage}
        showCta={showCta}
        showSkip={showSkip}
        isEnglishCopy={isEnglishCopy}
        onCta={handleCta}
        onSkip={handleSkip}
      />
    </div>
  );
};
