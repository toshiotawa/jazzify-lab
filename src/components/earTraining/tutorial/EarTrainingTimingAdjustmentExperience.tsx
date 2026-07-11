import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { fetchSurvivalCharacters, type SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { useAuthStore } from '@/stores/authStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getEarTrainingTimingAdjustmentCopy } from '@/utils/earTrainingUiCopy';
import type { EarTrainingTimingAdjustmentEntry } from '@/utils/earTrainingTimingAdjustmentLaunch';
import { OSMD_TIMING_ADJUSTMENT_SCRIPT_ID } from '@/components/earTraining/tutorial/buildOsmdTimingAdjustmentV1Script';
import type { EarTrainingTutorialBindings } from '@/components/earTraining/tutorial/earTrainingTutorialBindings';
import {
  EarTrainingTutorialSceneHost,
  showTutorialFinishCta,
} from '@/components/earTraining/tutorial/EarTrainingTutorialSceneHost';
import { fetchEarTrainingTutorialScript } from '@/components/earTraining/tutorial/fetchEarTrainingTutorialScript';
import type {
  EarTrainingTutorialOsmdSceneResult,
  EarTrainingTutorialScene,
} from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';
import { unlockTutorialAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';
import { preloadEarTrainingTutorialBattleChunks } from '@/components/earTraining/tutorial/preloadEarTrainingTutorialBattleChunks';

export interface EarTrainingTimingAdjustmentExperienceProps {
  entry: EarTrainingTimingAdjustmentEntry;
  lessonId?: string;
  lessonSongId?: string;
  embeddedFullHeight?: boolean;
  onQuestCompleted?: () => void | Promise<void>;
  onExit: () => void;
}

type GateState = 'loading' | 'ready' | 'error';

export const EarTrainingTimingAdjustmentExperience: React.FC<
  EarTrainingTimingAdjustmentExperienceProps
> = ({
  entry,
  lessonId = '',
  lessonSongId = '',
  embeddedFullHeight = false,
  onQuestCompleted,
  onExit,
}) => {
  const profile = useAuthStore((s) => s.profile);
  const isEnglishCopy = shouldUseEnglishCopy({
    preferredLocale: profile?.preferred_locale,
    country: profile?.country,
    rank: profile?.rank,
  });
  const copy = useMemo(
    () => getEarTrainingTimingAdjustmentCopy(isEnglishCopy),
    [isEnglishCopy],
  );

  const [gate, setGate] = useState<GateState>('loading');
  const [enemy, setEnemy] = useState<SurvivalCharacterRow | null>(null);
  const [scriptRow, setScriptRow] = useState<Awaited<ReturnType<typeof fetchEarTrainingTutorialScript>> | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [showFinishCta, setShowFinishCta] = useState(false);
  const [bluetoothNoticeOpen, setBluetoothNoticeOpen] = useState(true);
  const [playbackReady, setPlaybackReady] = useState(false);
  const finalizedRef = useRef(false);
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setGate('loading');
      try {
        const row = await fetchEarTrainingTutorialScript(OSMD_TIMING_ADJUSTMENT_SCRIPT_ID);
        if (cancelled) return;
        setScriptRow(row);
        setSceneIndex(0);
        setGate('ready');
        void unlockTutorialAudio();
        const characters = await fetchSurvivalCharacters();
        if (!cancelled) {
          setEnemy(characters[0] ?? null);
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
    if (gate !== 'ready' || !script) return;
    void preloadEarTrainingTutorialBattleChunks({ script, isEnglishCopy });
  }, [gate, isEnglishCopy, script]);

  const finalize = useCallback(
    async (kind: 'completed' | 'aborted') => {
      if (finalizedRef.current) return;
      finalizedRef.current = true;
      if (kind === 'completed') {
        await onQuestCompleted?.();
      }
      onExit();
    },
    [onExit, onQuestCompleted],
  );

  const noopSetCharacterText = useCallback((_text: string) => undefined, []);

  const advanceSceneImmediate = useCallback(() => {
    if (!script) return;
    const nextIndex = sceneIndex + 1;
    if (nextIndex >= script.scenes.length) {
      void finalize('completed');
      return;
    }
    const nextScene = script.scenes[nextIndex];
    if (nextScene?.type === 'finish') {
      if (showTutorialFinishCta(script, nextScene)) {
        setSceneIndex(nextIndex);
        setShowFinishCta(true);
        return;
      }
      void finalize('completed');
      return;
    }
    setSceneIndex(nextIndex);
    setShowFinishCta(false);
  }, [finalize, sceneIndex, script]);

  const onTutorialSceneComplete = useCallback((_result?: EarTrainingTutorialOsmdSceneResult) => {
    advanceSceneImmediate();
  }, [advanceSceneImmediate]);

  const bindings: EarTrainingTutorialBindings = useMemo(
    () => ({
      ui: script?.ui ?? {
        hidePlayerHpBar: true,
        hideSettingsButton: true,
        hideBackButton: true,
        hideLobby: true,
        hideMidiToggle: true,
        hidePhraseIntroQuota: true,
        showExitButton: false,
        playerInvincible: true,
        disableEnemyAttacks: true,
        keyboardHintsDefault: false,
      },
      isEnglishCopy,
      setCharacterText: noopSetCharacterText,
      onSceneComplete: onTutorialSceneComplete,
      onExit: () => {
        void finalize('aborted');
      },
      timingCalibrationMode: true,
    }),
    [finalize, isEnglishCopy, noopSetCharacterText, onTutorialSceneComplete, script?.ui],
  );

  const handleBluetoothOk = useCallback(() => {
    setBluetoothNoticeOpen(false);
    setPlaybackReady(true);
  }, []);

  const handleBottomCta = useCallback(() => {
    if (entry === 'settings') {
      void finalize('aborted');
      return;
    }
    if (showFinishCta) {
      void finalize('completed');
      return;
    }
    advanceSceneImmediate();
  }, [advanceSceneImmediate, entry, finalize, showFinishCta]);

  useEffect(() => {
    if (gate !== 'ready' || !script || !currentScene) return;
    if (currentScene.type === 'finish') {
      setShowFinishCta(showTutorialFinishCta(script, currentScene));
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
          {isEnglishCopy ? 'Timing adjustment tutorial is not available.' : 'タイミング調整チュートリアルを読み込めませんでした。'}
        </p>
        <button
          type="button"
          onClick={() => onExit()}
          className="rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
        >
          {copy.settingsBack}
        </button>
      </div>
    );
  }

  const bottomCtaLabel = entry === 'quest' ? copy.questAdvance : copy.settingsBack;
  const showBottomCta = !bluetoothNoticeOpen;

  return (
    <div
      className={
        embeddedFullHeight
          ? 'relative h-full min-h-0 w-full overflow-hidden bg-black'
          : 'fixed inset-0 z-50 bg-black'
      }
    >
      <div className="relative h-full min-h-0 w-full overflow-hidden">
        {playbackReady && currentScene.type !== 'finish' ? (
          <EarTrainingTutorialSceneHost
            key={`scene-${sceneIndex}`}
            script={script}
            scene={currentScene as EarTrainingTutorialScene}
            sceneIndex={sceneIndex}
            enemy={enemy}
            bindings={bindings}
            isEnglishCopy={isEnglishCopy}
            onSceneComplete={onTutorialSceneComplete}
          />
        ) : null}

        {currentScene.type === 'finish' && showFinishCta ? (
          <div className="flex h-full w-full items-center justify-center bg-black px-6 text-center text-white">
            <p className="text-lg font-semibold">{copy.title}</p>
          </div>
        ) : null}
      </div>

      {bluetoothNoticeOpen ? (
        <div className="pointer-events-auto absolute inset-0 z-[130] flex items-center justify-center bg-black/70 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="timing-bluetooth-notice-title"
            className="w-full max-w-md rounded-xl border border-white/15 bg-slate-900 p-6 text-white shadow-xl"
          >
            <h2 id="timing-bluetooth-notice-title" className="mb-3 text-lg font-bold">
              {copy.bluetoothNoticeTitle}
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-slate-200">{copy.bluetoothNoticeBody}</p>
            <button
              type="button"
              onClick={handleBluetoothOk}
              className="w-full rounded-lg bg-purple-600 py-3 text-sm font-bold hover:bg-purple-500"
            >
              {copy.bluetoothNoticeOk}
            </button>
          </div>
        </div>
      ) : null}

      {!bluetoothNoticeOpen && showBottomCta ? (
        <button
          type="button"
          onClick={handleBottomCta}
          className="pointer-events-auto absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-[125] rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-500"
        >
          {bottomCtaLabel}
        </button>
      ) : null}
    </div>
  );
};
