import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import { TUTORIAL_BOOTSTRAP_OVERRIDES } from '@/components/survival/scenario/survivalScenarioTypes';
import type { TutorialAudioTracksMap } from '@/components/survival/tutorial/TutorialAudioController';
import { TutorialAudioController } from '@/components/survival/tutorial/TutorialAudioController';
import { TUTORIAL_DRUM_LOOP_AUDIO_TRACKS } from '@/components/survival/tutorial/tutorialDrumLoopBgm';
import { TutorialTapAdvanceCue } from '@/components/survival/tutorial/TutorialTapAdvanceCue';
import { unlockTutorialAudio } from '@/components/survival/tutorial/tutorialAudioUnlock';
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
  readonly onBlinkAdvanceToggle: (value: boolean) => void;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialDialogueScene: React.FC<SurvivalTutorialDialogueSceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onBlinkAdvanceToggle,
  onSceneComplete,
}) => {
  const linesRef = useRef(scene.lines ?? []);
  linesRef.current = scene.lines ?? [];
  const lines = scene.lines ?? [];
  const intervalSec = scene.lineIntervalSeconds ?? 4;

  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;
  const englishRef = useRef(bindings.isEnglishCopy);
  englishRef.current = bindings.isEnglishCopy;

  const [lineIndex, setLineIndex] = useState(0);
  const completedRef = useRef(false);
  const audioRef = useRef<TutorialAudioController | null>(null);
  const lineTimerRef = useRef<number | null>(null);

  const scheduleAfterDisplayedIdx = useRef<(displayIdx: number) => void>(() => undefined);

  const finalizeRef = useRef<() => void>(() => undefined);

  const finalize = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (lineTimerRef.current !== null) {
      window.clearTimeout(lineTimerRef.current);
      lineTimerRef.current = null;
    }
    onBlinkAdvanceToggle(false);
    audioRef.current?.stopAudio('main_bgm');
    bindingsRef.current.setCharacterLine('');
    onSceneComplete();
  }, [onBlinkAdvanceToggle, onSceneComplete]);

  finalizeRef.current = finalize;

  useEffect(() => {
    completedRef.current = false;
    setLineIndex(0);
  }, [scene]);

  useEffect(() => {
    const base = script.audioTracks?.drum_loop;
    const tracks: TutorialAudioTracksMap =
      script.audioTracks && base?.url?.trim()
        ? {
            main_bgm: {
              url: base.url.trim(),
              defaultLoop: true,
              defaultVolume: base.volume ?? 0.35,
            },
            drum_loop: {
              url: base.url.trim(),
              defaultLoop: true,
              defaultVolume: base.volume ?? 0.35,
            },
          }
        : TUTORIAL_DRUM_LOOP_AUDIO_TRACKS;

    unlockTutorialAudio();
    const ctl = audioRef.current ?? new TutorialAudioController();
    audioRef.current = ctl;
    ctl.setTracks(tracks);
    void ctl.ensureBgmSettings().finally(() => {
      ctl.playAudio('main_bgm', { loop: true, volume: base?.volume ?? 0.35 });
    });

    return () => {
      ctl.stopAudio('main_bgm');
      ctl.dispose();
      audioRef.current = null;
    };
  }, [script.audioTracks]);

  const chainTimerFrom = useCallback(
    (displayIdx: number) => {
      if (lineTimerRef.current !== null) {
        window.clearTimeout(lineTimerRef.current);
        lineTimerRef.current = null;
      }
      const ln = linesRef.current;
      if (ln.length === 0) {
        finalizeRef.current();
        return;
      }

      lineTimerRef.current = window.setTimeout(() => {
        lineTimerRef.current = null;
        if (completedRef.current) return;

        if (displayIdx >= ln.length - 1) {
          finalizeRef.current();
          return;
        }

        const ni = displayIdx + 1;
        setLineIndex(ni);
        const lineAt = ln[ni];
        if (lineAt) {
          bindingsRef.current.setCharacterLine(survivalTutorialLocalized(lineAt, englishRef.current));
        }
        scheduleAfterDisplayedIdx.current(ni);
      }, intervalSec * 1000);
    },
    [intervalSec],
  );

  scheduleAfterDisplayedIdx.current = chainTimerFrom;

  useEffect(() => {
    const ln = linesRef.current;
    if (ln.length === 0) {
      finalizeRef.current();
      return undefined;
    }
    const first = ln[0];
    if (first) {
      bindingsRef.current.setCharacterLine(survivalTutorialLocalized(first, englishRef.current));
    }
    onBlinkAdvanceToggle(true);

    chainTimerFrom(0);

    return () => {
      if (lineTimerRef.current !== null) {
        window.clearTimeout(lineTimerRef.current);
        lineTimerRef.current = null;
      }
    };
  }, [chainTimerFrom, onBlinkAdvanceToggle, scene]);

  const advanceTap = useCallback(() => {
    if (completedRef.current) return;

    const ln = linesRef.current;
    if (ln.length === 0) return;

    if (lineTimerRef.current !== null) {
      window.clearTimeout(lineTimerRef.current);
      lineTimerRef.current = null;
    }

    if (lineIndex < ln.length - 1) {
      const ni = lineIndex + 1;
      setLineIndex(ni);
      const l = ln[ni];
      if (l) bindingsRef.current.setCharacterLine(survivalTutorialLocalized(l, englishRef.current));
      chainTimerFrom(ni);
      onBlinkAdvanceToggle(true);
      return;
    }
    finalizeRef.current();
  }, [chainTimerFrom, lineIndex, onBlinkAdvanceToggle]);

  const screenKey = useMemo(
    () => `tutorial-v3-dialog:${lines[0]?.ja ?? ''}:${lines.length}`,
    [lines],
  );

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
        initialScenarioOverrides={TUTORIAL_BOOTSTRAP_OVERRIDES}
        onBackToSelect={() => bindingsRef.current.onExit()}
        onBackToMenu={() => bindingsRef.current.onExit()}
      />

      <button
        type="button"
        className="absolute inset-0 z-40 cursor-pointer bg-transparent"
        aria-label={englishRef.current ? 'Next line' : '次へ'}
        onClick={advanceTap}
      />

      <TutorialTapAdvanceCue visible />
    </div>
  );
};
