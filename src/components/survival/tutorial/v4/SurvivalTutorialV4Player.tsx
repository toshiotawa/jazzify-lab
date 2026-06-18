import React, { useCallback, useEffect, useRef, useState } from 'react';

import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { TutorialAudioController } from '../TutorialAudioController';
import { unlockTutorialAudio } from '../tutorialAudioUnlock';
import { SurvivalTutorialV4DemoView } from './SurvivalTutorialV4DemoView';
import { SurvivalTutorialV4DialogueView } from './SurvivalTutorialV4DialogueView';
import { SurvivalTutorialV4PlayView } from './SurvivalTutorialV4PlayView';
import {
  advanceSurvivalTutorialV4Scene,
  currentSurvivalTutorialV4Scene,
  initialSurvivalTutorialV4Cursor,
  nextSurvivalTutorialV4BgmUrl,
  resolveSurvivalTutorialV4BgmAction,
  type SurvivalTutorialV4SceneCursor,
} from './survivalTutorialV4SceneDriver';
import {
  isSurvivalTutorialV4DemoScene,
  isSurvivalTutorialV4DialogueScene,
  isSurvivalTutorialV4PlayScene,
  type SurvivalTutorialV4Manifest,
} from './survivalTutorialV4Types';

const BGM_VOLUME = 0.35;

export interface SurvivalTutorialV4PlayerProps {
  readonly manifest: SurvivalTutorialV4Manifest;
  readonly isEnglishCopy?: boolean;
  readonly onExit: () => void;
  readonly onCompleted?: () => void | Promise<void>;
}

/**
 * ネイティブ・シームレス V4 ランタイムの単一画面シェル。
 * - シーン列はドライバで管理し、画面を再マウントせずに切り替える。
 * - 共有 BGM は同一 URL かつ非リセット時に再生位置を維持(keep)する。
 */
export const SurvivalTutorialV4Player: React.FC<SurvivalTutorialV4PlayerProps> = ({
  manifest,
  isEnglishCopy = false,
  onExit,
  onCompleted,
}) => {
  const [cursor, setCursor] = useState<SurvivalTutorialV4SceneCursor>(
    initialSurvivalTutorialV4Cursor,
  );
  const [finished, setFinished] = useState(false);

  const audioRef = useRef<TutorialAudioController | null>(null);
  const currentBgmUrlRef = useRef<string | null>(null);
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  useEffect(() => {
    const controller = new TutorialAudioController();
    audioRef.current = controller;
    return () => {
      controller.dispose();
      audioRef.current = null;
      currentBgmUrlRef.current = null;
    };
  }, []);

  useEffect(() => {
    const unlockOnce = (): void => {
      void unlockTutorialAudio().then(() => {
        void FantasySoundManager.preloadCorrectRootBassSoundFont();
      });
    };
    window.addEventListener('pointerdown', unlockOnce, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlockOnce);
  }, []);

  const scene = currentSurvivalTutorialV4Scene(cursor, manifest);

  useEffect(() => {
    const controller = audioRef.current;
    if (!controller || !scene || finished) return;
    const action = resolveSurvivalTutorialV4BgmAction(scene, currentBgmUrlRef.current);
    if (action.kind === 'restart') {
      controller.setTracks({
        main_bgm: { url: action.url, defaultLoop: true, defaultVolume: BGM_VOLUME },
      });
      void controller.ensureBgmSettings().then(() => {
        controller.playAudio('main_bgm', { loop: true, volume: BGM_VOLUME });
      });
    } else if (action.kind === 'stop') {
      controller.stopAudio('main_bgm');
    }
    currentBgmUrlRef.current = nextSurvivalTutorialV4BgmUrl(action, currentBgmUrlRef.current);
  }, [scene, finished]);

  const handleSceneComplete = useCallback(() => {
    setCursor((prev) => {
      const result = advanceSurvivalTutorialV4Scene(prev, manifest);
      if (result.done) {
        setFinished(true);
        void onCompletedRef.current?.();
        return prev;
      }
      return result.cursor;
    });
  }, [manifest]);

  if (finished) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-black text-white">
        <div className="text-lg font-semibold">
          {isEnglishCopy ? 'Tutorial complete' : 'チュートリアル完了'}
        </div>
        <button
          type="button"
          onClick={onExit}
          className="rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold hover:bg-emerald-500"
        >
          {isEnglishCopy ? 'Back' : '戻る'}
        </button>
      </div>
    );
  }

  if (!scene) return null;

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      {isSurvivalTutorialV4DialogueScene(scene) ? (
        <SurvivalTutorialV4DialogueView
          key={scene.id}
          scene={scene}
          isEnglishCopy={isEnglishCopy}
          onComplete={handleSceneComplete}
        />
      ) : null}
      {isSurvivalTutorialV4DemoScene(scene) ? (
        <SurvivalTutorialV4DemoView
          key={scene.id}
          scene={scene}
          isEnglishCopy={isEnglishCopy}
          onComplete={handleSceneComplete}
        />
      ) : null}
      {isSurvivalTutorialV4PlayScene(scene) ? (
        <SurvivalTutorialV4PlayView
          key={scene.id}
          scene={scene}
          isEnglishCopy={isEnglishCopy}
          onComplete={handleSceneComplete}
        />
      ) : null}
    </div>
  );
};
