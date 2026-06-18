import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useQuestCompleteJingleWhenVisible } from '@/hooks/useQuestCompleteJingle';

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
  isSurvivalTutorialScriptV3,
  type SurvivalTutorialScriptPayload,
} from '@/components/survival/tutorial/fetchSurvivalTutorialScript';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import {
  SurvivalTutorialSceneHost,
  showSurvivalTutorialFinishCta,
  survivalTutorialDemoPlayCtaLabel,
  survivalTutorialFinishCtaLabel,
} from '@/components/survival/tutorial/SurvivalTutorialSceneHost';
import {
  resolveLegacyTutorialRunnerKey,
  resolveSurvivalBuiltinTutorialRunner,
  runSurvivalTutorialFromScriptPayload,
  type SurvivalBuiltinTutorialRunner,
} from '@/components/survival/tutorial/tutorialRunnerRegistry';
import type { RunTutorialIiViScriptParams } from '@/components/survival/tutorial/tutorialIiViScript';
import { TutorialAudioController } from '@/components/survival/tutorial/TutorialAudioController';
import { TutorialTapAdvanceCue } from '@/components/survival/tutorial/TutorialTapAdvanceCue';
import { TUTORIAL_DRUM_LOOP_AUDIO_TRACKS } from '@/components/survival/tutorial/tutorialDrumLoopBgm';
import {
  playTutorialChordPreview,
  unlockTutorialAudio,
} from '@/components/survival/tutorial/tutorialAudioUnlock';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';
import { useAuthStore } from '@/stores/authStore';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import type { TutorialLocalizedText } from '@/components/survival/tutorial/tutorialScriptTypes';
import { survivalTutorialLocalized } from '@/components/survival/tutorial/survivalTutorialV3Locales';
import { SurvivalTutorialSeamlessSceneHost } from '@/components/survival/tutorial/SurvivalTutorialSeamlessSceneHost';
import {
  resolveSurvivalTutorialDemoPlayAudio,
  resolveTutorialV3BgmAction,
  resolveTutorialV3SceneBgmUrl,
} from '@/components/survival/tutorial/resolveSurvivalTutorialDemoPlayAudioUrl';

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

  const [v2CharacterText, setV2CharacterText] = useState('');
  const [narrationText, setNarrationText] = useState('');
  const [connectedDeviceLine, setConnectedDeviceLine] = useState<string | null>(null);
  const [showPillarCard, setShowPillarCard] = useState(false);
  const [pillarCaption, setPillarCaption] = useState<string | null>(null);
  const [pillarSystemImage, setPillarSystemImage] = useState<string | null>(null);
  const [showCta, setShowCta] = useState(false);
  const [tutorialV3Payload, setTutorialV3Payload] = useState<SurvivalTutorialScriptPayloadV3 | null>(null);
  const [v3SceneIndex, setV3SceneIndex] = useState(0);
  const [v3CharacterText, setV3CharacterText] = useState('');
  const [v3NarrationText, setV3NarrationText] = useState('');
  const [v3FinishCta, setV3FinishCta] = useState(false);
  const [v3TapCueVisible, setV3TapCueVisible] = useState(false);

  useQuestCompleteJingleWhenVisible(v3FinishCta || showCta);

  const v3AudioRef = useRef<TutorialAudioController | null>(null);
  const v3TapResolverRef = useRef<(() => void) | null>(null);
  const v3DrumPlayingRef = useRef(false);
  const v3CurrentBgmUrlRef = useRef<string | null>(null);

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
      void FantasySoundManager.preloadCorrectRootBassSoundFont();
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

      setTutorialV3Payload(null);
      setV3SceneIndex(0);
      setV3CharacterText('');
      setV3NarrationText('');
      setV2CharacterText('');
      setV3FinishCta(false);
      setV3TapCueVisible(false);

      try {
        const row = await fetchSurvivalTutorialScript(scriptId);
        if (isSurvivalTutorialScriptV3(row.script)) {
          if (!cancelled) {
            const v3Script = row.script;
            setLoadedScript(null);
            setTutorialV3Payload(v3Script);
            void unlockTutorialAudio();
            const ctl = v3AudioRef.current ?? new TutorialAudioController();
            v3AudioRef.current = ctl;
            const drum = v3Script.audioTracks?.drum_loop;
            const tracks =
              drum?.url?.trim()
                ? {
                    main_bgm: {
                      url: drum.url.trim(),
                      defaultLoop: true,
                      defaultVolume: drum.volume ?? 0.35,
                    },
                    drum_loop: {
                      url: drum.url.trim(),
                      defaultLoop: true,
                      defaultVolume: drum.volume ?? 0.35,
                    },
                  }
                : TUTORIAL_DRUM_LOOP_AUDIO_TRACKS;
            ctl.setTracks(tracks);
            void ctl.ensureBgmSettings();
            runnerFnRef.current = null;
            runnerStartedRef.current = false;
            finalizedOnceRef.current = false;
            setGate('ready');
          }
          return;
        }
        setTutorialV3Payload(null);

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
            setTutorialV3Payload(null);
            setUnknownRunnerKey(builtinKey);
            setGate('unknown_runner');
          }
          return;
        }
        runnerFnRef.current = runnerFn;
        if (!cancelled) {
          setTutorialV3Payload(null);
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
      v3AudioRef.current?.stopAudio('main_bgm');
      v3AudioRef.current?.dispose();
      v3AudioRef.current = null;
      v3DrumPlayingRef.current = false;
      v3CurrentBgmUrlRef.current = null;
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

  const advanceV3Scene = useCallback(() => {
    const pl = tutorialV3Payload;
    if (!pl) return;
    const nextIdx = v3SceneIndex + 1;
    if (nextIdx >= pl.scenes.length) {
      void finalizeLesson('completed');
      return;
    }
    setV3SceneIndex(nextIdx);
  }, [finalizeLesson, tutorialV3Payload, v3SceneIndex]);

  useEffect(() => {
    const pl = tutorialV3Payload;
    if (!pl || gate !== 'ready') return;
    setV3CharacterText('');
    setV3NarrationText('');
    const s = pl.scenes[v3SceneIndex];
    if (!s) return;
    if (s.type === 'finish') {
      setV3FinishCta(showSurvivalTutorialFinishCta(pl, s));
    } else {
      setV3FinishCta(false);
    }
    const ctl = v3AudioRef.current;
    if (!ctl) return;
    let cancelled = false;
    void ctl.ensureBgmSettings().then(async () => {
      if (cancelled) return;
      const drum = pl.audioTracks?.drum_loop;
      const fallbackUrl = ctl.resolveTrackUrl('main_bgm') ?? drum?.url;
      const nextUrl = resolveTutorialV3SceneBgmUrl(s, fallbackUrl);
      const bgmAction = resolveTutorialV3BgmAction(s, nextUrl, {
        currentUrl: v3CurrentBgmUrlRef.current,
        isPlaying: v3DrumPlayingRef.current,
      });
      if (bgmAction === 'stop') {
        ctl.stopAudio('main_bgm');
        v3DrumPlayingRef.current = false;
        v3CurrentBgmUrlRef.current = null;
        return;
      }
      if (bgmAction === 'restart' && nextUrl) {
        ctl.setTracks({
          main_bgm: {
            url: nextUrl,
            defaultLoop: true,
            defaultVolume: drum?.volume ?? 0.35,
          },
        });
        // demo は intro 終了時を時刻0として開始するため、シーン側に再生開始を委ねる。
        if (s.type === 'demo_play') {
          ctl.stopAudio('main_bgm');
          v3DrumPlayingRef.current = false;
          v3CurrentBgmUrlRef.current = null;
          return;
        }
        await ctl.restartFromStart('main_bgm', { loop: true, volume: drum?.volume ?? 0.35 });
        if (cancelled) return;
        v3DrumPlayingRef.current = true;
        v3CurrentBgmUrlRef.current = nextUrl;
      }
      // keep: 同一 URL の要素へ触れず、再生位置を維持する。
    });
    return () => {
      cancelled = true;
    };
  }, [tutorialV3Payload, gate, v3SceneIndex]);

  const waitForTapOrTimeout = useCallback((seconds: number, signal?: AbortSignal): Promise<void> => {
    if (signal?.aborted) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      setV3TapCueVisible(true);
      let settled = false;
      const finish = (): void => {
        if (settled) {
          return;
        }
        settled = true;
        window.clearTimeout(timerId);
        signal?.removeEventListener('abort', onAbort);
        if (v3TapResolverRef.current === finish) {
          v3TapResolverRef.current = null;
        }
        setV3TapCueVisible(false);
        resolve();
      };
      v3TapResolverRef.current = finish;
      const timerId = window.setTimeout(finish, Math.max(0, seconds * 1000));
      const onAbort = (): void => {
        finish();
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  }, []);

  const v3Bindings: SurvivalTutorialV3Bindings | null = useMemo(() => {
    if (!tutorialV3Payload) return null;
    return {
      isEnglishCopy,
      ui: tutorialV3Payload.ui,
      setCharacterText: setV3CharacterText,
      setNarrationText: setV3NarrationText,
      setJajiiSpeechText: () => undefined,
      onExit: () => {
        void finalizeLesson('aborted');
      },
      onLessonTutorialCompleted,
      setTapAdvanceCueVisible: setV3TapCueVisible,
      waitForTapOrTimeout,
      pauseSharedDrumLoop: () => {
        v3AudioRef.current?.pauseAudio('main_bgm');
        v3DrumPlayingRef.current = false;
      },
      resumeSharedDrumLoop: () => {
        const drum = tutorialV3Payload.audioTracks?.drum_loop;
        void v3AudioRef.current?.ensureBgmSettings().then(() => {
          void v3AudioRef.current
            ?.ensurePlaying('main_bgm', { loop: true, volume: drum?.volume ?? 0.35 })
            .then(() => {
              v3DrumPlayingRef.current = true;
              v3CurrentBgmUrlRef.current =
                v3AudioRef.current?.resolveTrackUrl('main_bgm') ?? null;
            });
        });
      },
      stopDemoBgm: () => {
        v3AudioRef.current?.stopAudio('main_bgm');
        v3DrumPlayingRef.current = false;
        v3CurrentBgmUrlRef.current = null;
      },
      startDemoBgmFromStart: async (demoScene) => {
        const ctl = v3AudioRef.current;
        if (!ctl) return;
        const resolved = resolveSurvivalTutorialDemoPlayAudio(
          demoScene,
          tutorialV3Payload,
          isEnglishCopy,
        );
        if (!resolved.url) return;
        ctl.setTracks({
          main_bgm: {
            url: resolved.url,
            defaultLoop: true,
            defaultVolume: resolved.volume,
          },
          drum_loop: {
            url: resolved.url,
            defaultLoop: true,
            defaultVolume: resolved.volume,
          },
        });
        await ctl.restartFromStart('main_bgm', { loop: true, volume: resolved.volume });
        v3DrumPlayingRef.current = true;
        v3CurrentBgmUrlRef.current = resolved.url;
      },
      playDemoChordAudio: (midis) => {
        if (midis.length === 0) return;
        void playTutorialChordPreview(midis);
      },
      playDemoBassAudio: (midis) => {
        for (const midi of midis) {
          FantasySoundManager.playBassMidiNote(midi);
        }
      },
    };
  }, [tutorialV3Payload, isEnglishCopy, finalizeLesson, onLessonTutorialCompleted, waitForTapOrTimeout]);

  const flushV3TapAdvance = useCallback(() => {
    v3TapResolverRef.current?.();
  }, []);

  const setRunnerCharacterOverlay = useCallback((line: TutorialLocalizedText | string) => {
    if (typeof line === 'string') {
      setV2CharacterText(line.trim());
      return;
    }
    setV2CharacterText(survivalTutorialLocalized(line, isEnglishCopy).trim());
  }, [isEnglishCopy]);

  const onScenarioHandleReady = useCallback(
    (handle: SurvivalScenarioHandle) => {
      if (gate !== 'ready' || tutorialV3Payload !== null || runnerStartedRef.current) return;
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
            setCharacterText: setRunnerCharacterOverlay,
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
    [finalizeLesson, gate, isEnglishCopy, loadedScript, scriptId, setRunnerCharacterOverlay, tutorialV3Payload],
  );

  const gameScreenKey = useMemo(
    () => `${scriptId}:${stageDefinition.chordDisplayName}`,
    [scriptId, stageDefinition.chordDisplayName],
  );

  const handleSkip = useCallback(() => {
    void finalizeLesson('aborted');
  }, [finalizeLesson]);

  const handleV3FinishCta = useCallback(() => {
    void finalizeLesson('completed');
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

  if (tutorialV3Payload && v3Bindings) {
    const scenes = tutorialV3Payload.scenes;
    const currentScene = scenes[v3SceneIndex];
    const showExitV3Top = Boolean(tutorialV3Payload.ui.showExitButton);
    const useSeamlessSceneHost = tutorialV3Payload.scenes.some(
      (scene) => scene.type !== 'finish' && scene.bgm !== undefined,
    );

    return (
      <div
        className={
          embeddedFullHeight
            ? 'relative h-full min-h-0 w-full overflow-hidden bg-black'
            : 'relative fixed inset-0 z-50 bg-black'
        }
      >
        {showExitV3Top ? (
          <button
            type="button"
            onClick={() => handleSkip()}
            className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[115] rounded-lg border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/90"
          >
            {isEnglishCopy ? 'Exit' : '退出'}
          </button>
        ) : null}

        {currentScene
        && currentScene.type !== 'finish'
        && useSeamlessSceneHost
        && (currentScene.type === 'dialogue_only'
          || currentScene.type === 'demo_play'
          || currentScene.type === 'phrase_battle') ? (
          <SurvivalTutorialSeamlessSceneHost
            script={tutorialV3Payload}
            scene={currentScene}
            bindings={v3Bindings}
            embeddedFullHeight={embeddedFullHeight}
            onSceneComplete={advanceV3Scene}
          />
        ) : currentScene && currentScene.type !== 'finish' ? (
          <SurvivalTutorialSceneHost
            script={tutorialV3Payload}
            scene={currentScene}
            bindings={v3Bindings}
            embeddedFullHeight={embeddedFullHeight}
            onSceneComplete={advanceV3Scene}
          />
        ) : null}

        <OnboardingOverlays
          characterText={v3CharacterText}
          narrationText={v3NarrationText}
          connectedDeviceLine={null}
          showPillarCard={false}
          pillarCaption={null}
          pillarSystemImage={null}
          showCta={false}
          showSkip={showSkip && !v3FinishCta}
          isEnglishCopy={isEnglishCopy}
          onCta={handleV3FinishCta}
          onSkip={handleSkip}
        />

        {v3TapCueVisible ? (
          <>
            <button
              type="button"
              aria-label={isEnglishCopy ? 'Continue' : '次へ'}
              className="absolute inset-x-0 top-0 bottom-36 z-[110] cursor-pointer bg-transparent"
              onClick={flushV3TapAdvance}
            />
            <TutorialTapAdvanceCue visible />
          </>
        ) : null}

        {v3FinishCta ? (
          <div className="pointer-events-auto absolute inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
            <button
              type="button"
              onClick={handleV3FinishCta}
              className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-purple-500"
            >
              {survivalTutorialFinishCtaLabel(isEnglishCopy)}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={
        embeddedFullHeight
          ? 'relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-black'
          : 'relative fixed inset-0 z-50 flex flex-col bg-black'
      }
    >
      <div className={embeddedFullHeight ? 'min-h-0 flex-1' : 'contents'}>
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
      </div>

      <OnboardingOverlays
        characterText={v2CharacterText}
        narrationText={narrationText}
        connectedDeviceLine={connectedDeviceLine}
        showPillarCard={showPillarCard}
        pillarCaption={pillarCaption}
        pillarSystemImage={pillarSystemImage}
        showCta={showCta}
        showSkip={showSkip}
        isEnglishCopy={isEnglishCopy}
        ctaLabel={survivalTutorialDemoPlayCtaLabel(isEnglishCopy)}
        onCta={handleCta}
        onSkip={handleSkip}
      />
    </div>
  );
};
