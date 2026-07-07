import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { OnboardingOverlays } from '@/components/onboarding/OnboardingOverlays';
import { fetchSurvivalCharacters, type SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { recordEarTrainingTutorialOsmdSceneResult } from '@/platform/supabaseEarTrainingTutorialOsmdResults';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';

import type { EarTrainingTutorialBindings } from './earTrainingTutorialBindings';
import {
  EarTrainingTutorialSceneHost,
  showTutorialFinishCta,
  tutorialFinishCtaLabel,
} from './EarTrainingTutorialSceneHost';
import { fetchEarTrainingTutorialScript } from './fetchEarTrainingTutorialScript';
import type {
  EarTrainingTutorialOsmdSceneResult,
  EarTrainingTutorialScene,
  EarTrainingTutorialScriptPayload,
} from './earTrainingTutorialScriptTypes';
import { useQuestCompleteJingleWhenVisible } from '@/hooks/useQuestCompleteJingle';
import { unlockTutorialAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';
import { preloadEarTrainingTutorialBattleChunks } from './preloadEarTrainingTutorialBattleChunks';

export interface EarTrainingLessonTutorialExperienceProps {
  scriptId?: string;
  lessonId?: string;
  lessonSongId?: string;
  embeddedFullHeight?: boolean;
  onPlayable?: () => void;
  onLessonTutorialCompleted?: () => void | Promise<void>;
  onExit: () => void;
}

type GateState = 'loading' | 'ready' | 'error';

const isRunnableScene = (scene: EarTrainingTutorialScene): boolean => (
  scene.type !== 'finish'
);

export const EarTrainingLessonTutorialExperience: React.FC<
  EarTrainingLessonTutorialExperienceProps
> = ({
  scriptId = 'developer-full-v1',
  lessonId = '',
  lessonSongId = '',
  embeddedFullHeight = false,
  onPlayable,
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
  const [enemy, setEnemy] = useState<SurvivalCharacterRow | null>(null);
  const [scriptRow, setScriptRow] = useState<Awaited<ReturnType<typeof fetchEarTrainingTutorialScript>> | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showCta, setShowCta] = useState(false);
  const [greatInterstitialVisible, setGreatInterstitialVisible] = useState(false);
  const [greatInterstitialPercent, setGreatInterstitialPercent] = useState<number | null>(null);
  const finalizedRef = useRef(false);
  const sceneCompleteTimerRef = useRef<number | null>(null);
  const audioUnlockedRef = useRef(false);

  useQuestCompleteJingleWhenVisible(showCta);

  const noopSetCharacterText = useCallback((_text: string) => undefined, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setGate('loading');
      try {
        const row = await fetchEarTrainingTutorialScript(scriptId);
        if (cancelled) return;
        setScriptRow(row);
        setSceneIndex(0);
        setGate('ready');
        onPlayable?.();
        void unlockTutorialAudio();
        const needsEnemyAvatar = row.script.scenes.some(
          (scene) => scene.type !== 'dialogue_only',
        );
        if (needsEnemyAvatar) {
          const characters = await fetchSurvivalCharacters();
          if (!cancelled) {
            setEnemy(characters[0] ?? null);
          }
        } else {
          setEnemy(null);
        }
      } catch {
        if (!cancelled) {
          setGate('error');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scriptId, onPlayable]);

  useEffect(() => () => {
    if (sceneCompleteTimerRef.current !== null) {
      window.clearTimeout(sceneCompleteTimerRef.current);
      sceneCompleteTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unlockOnce = (): void => {
      if (audioUnlockedRef.current) {
        return;
      }
      audioUnlockedRef.current = true;
      void unlockTutorialAudio();
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlockOnce);
  }, []);

  const script = scriptRow?.script ?? null;
  const scenes = script?.scenes ?? [];
  const currentScene = scenes[sceneIndex] ?? null;

  useEffect(() => {
    if (gate !== 'ready' || !script?.scenes.length) return;
    if (script.scenes[0]?.type !== 'dialogue_only') return;
    void preloadEarTrainingTutorialBattleChunks({ script, isEnglishCopy });
  }, [gate, isEnglishCopy, script]);

  const finalizeLesson = useCallback(
    async (kind: 'completed' | 'aborted') => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      if (kind === 'completed') {
        await onLessonTutorialCompleted?.();
      }
      onExit();
    },
    [onExit, onLessonTutorialCompleted],
  );

  const bindings: EarTrainingTutorialBindings = useMemo(
    () => ({
      ui: script?.ui ?? {
        hidePlayerHpBar: true,
        hideSettingsButton: false,
        hideBackButton: true,
        hideLobby: true,
        hideMidiToggle: true,
        hidePhraseIntroQuota: true,
        showExitButton: true,
        playerInvincible: true,
        disableEnemyAttacks: true,
        keyboardHintsDefault: true,
      },
      isEnglishCopy,
      setCharacterText: noopSetCharacterText,
      onSceneComplete: () => undefined,
      onExit: () => {
        void finalizeLesson('aborted');
      },
    }),
    [finalizeLesson, isEnglishCopy, noopSetCharacterText, script?.ui],
  );

  const advanceSceneImmediate = useCallback(() => {
    if (!script) return;
    const nextIndex = sceneIndex + 1;
    if (nextIndex >= script.scenes.length) {
      void finalizeLesson('completed');
      return;
    }
    const nextScene = script.scenes[nextIndex];
    if (nextScene?.type === 'finish') {
      setSceneIndex(nextIndex);
      setShowCta(showTutorialFinishCta(script, nextScene));
      return;
    }
    setSceneIndex(nextIndex);
    setShowCta(false);
  }, [finalizeLesson, sceneIndex, script]);

  const onTutorialSceneComplete = useCallback((result?: EarTrainingTutorialOsmdSceneResult) => {
    const completed = scenes[sceneIndex];
    if (!completed || completed.type === 'dialogue_only') {
      advanceSceneImmediate();
      return;
    }
    setGreatInterstitialPercent(result?.noteHitPercent ?? null);
    if (
      result
      && profile
      && lessonId
      && lessonSongId
      && completed.type === 'chord_osmd'
    ) {
      void recordEarTrainingTutorialOsmdSceneResult({
        lessonSongId,
        scriptId,
        sceneIndex,
        requiredLoops: completed.requiredLoops,
        noteHitRatio: result.noteHitPercent / 100,
      }).catch(() => undefined);
    }
    setGreatInterstitialVisible(true);
    sceneCompleteTimerRef.current = window.setTimeout(() => {
      sceneCompleteTimerRef.current = null;
      setGreatInterstitialVisible(false);
      setGreatInterstitialPercent(null);
      advanceSceneImmediate();
    }, 1000);
  }, [
    advanceSceneImmediate,
    lessonId,
    lessonSongId,
    profile,
    sceneIndex,
    scenes,
    scriptId,
  ]);

  const bindingsWithAdvance: EarTrainingTutorialBindings = useMemo(
    () => ({
      ...bindings,
      onSceneComplete: onTutorialSceneComplete,
    }),
    [bindings, onTutorialSceneComplete],
  );

  const handleCta = useCallback(() => {
    void finalizeLesson('completed');
  }, [finalizeLesson]);

  const handleExitClick = useCallback(() => {
    if (sceneCompleteTimerRef.current !== null) {
      window.clearTimeout(sceneCompleteTimerRef.current);
      sceneCompleteTimerRef.current = null;
    }
    setGreatInterstitialVisible(false);
    setGreatInterstitialPercent(null);
    void finalizeLesson('aborted');
  }, [finalizeLesson]);

  useEffect(() => {
    if (gate !== 'ready' || !script || !currentScene) return;
    if (currentScene.type === 'finish') {
      setShowCta(showTutorialFinishCta(script, currentScene));
      return;
    }
    if (isRunnableScene(currentScene)) {
      setShowCta(false);
    }
  }, [currentScene, gate, script]);

  if (gate === 'loading') {
    return (
      <div className="flex h-full min-h-[var(--dvh,100dvh)] w-full items-center justify-center bg-black text-white">
        <span className="text-sm">{isEnglishCopy ? 'Loading…' : '読み込み中…'}</span>
      </div>
    );
  }

  if (gate === 'error' || !script || !currentScene) {
    return (
      <div className="flex h-full min-h-[var(--dvh,100dvh)] w-full flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
        <p className="text-base font-semibold">
          {isEnglishCopy ? 'Tutorial is not available.' : 'チュートリアルを読み込めませんでした。'}
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

  const showExit = script.ui.showExitButton;

  return (
    <div
      className={
        embeddedFullHeight
          ? 'relative h-full min-h-0 w-full overflow-hidden bg-black'
          : 'fixed inset-0 z-50 bg-black'
      }
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden">
        {showExit ? (
          <button
            type="button"
            onClick={handleExitClick}
            className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[45] rounded-lg border border-white/20 bg-black/70 px-3 py-1.5 text-xs font-bold text-white hover:bg-black/90"
          >
            {isEnglishCopy ? 'Exit' : '退出'}
          </button>
        ) : null}

        {currentScene.type !== 'finish' ? (
          <EarTrainingTutorialSceneHost
            key={`scene-${sceneIndex}`}
            script={script}
            scene={currentScene}
            sceneIndex={sceneIndex}
            enemy={enemy}
            bindings={bindingsWithAdvance}
            isEnglishCopy={isEnglishCopy}
            onSceneComplete={onTutorialSceneComplete}
          />
        ) : null}

        <OnboardingOverlays
          characterText=""
          narrationText=""
          connectedDeviceLine={null}
          showPillarCard={false}
          pillarCaption={null}
          pillarSystemImage={null}
          showCta={false}
          showSkip={false}
          isEnglishCopy={isEnglishCopy}
          onCta={handleCta}
          onSkip={() => undefined}
          ctaLabel={tutorialFinishCtaLabel(isEnglishCopy)}
        />
      </div>

      {greatInterstitialVisible ? (
        <div
          className="pointer-events-none absolute inset-0 z-[110] flex items-center justify-center bg-black/35"
          aria-hidden
        >
          <span className="text-5xl font-black tracking-wide text-[#fde68a] [text-shadow:0_2px_0_rgb(2_6_23),0_4px_24px_rgb(2_6_23)] sm:text-6xl">
            {greatInterstitialPercent !== null
              ? `Great!!(${greatInterstitialPercent}%)`
              : 'Great!!'}
          </span>
        </div>
      ) : null}

      {showCta ? (
        <div className="pointer-events-auto absolute inset-0 z-[120] flex items-center justify-center bg-black/50 px-4">
          <button
            type="button"
            onClick={handleCta}
            className="rounded-xl bg-purple-600 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-purple-500"
          >
            {tutorialFinishCtaLabel(isEnglishCopy)}
          </button>
        </div>
      ) : null}
    </div>
  );
};
