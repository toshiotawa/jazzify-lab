import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SurvivalGameScreen from '@/components/survival/SurvivalGameScreen';
import type { SurvivalScenarioHandle } from '@/components/survival/scenario/survivalScenarioHandle';
import {
  type SurvivalTutorialDemoStaffSnapshot,
} from '@/components/survival/tutorial/SurvivalTutorialDemoStaff';
import {
  anchoredDelayMs,
  buildDemoPlaySchedule,
  resolveDemoLineSpeaker,
} from '@/components/survival/tutorial/survivalTutorialDemoPlayScheduler';
import type { SurvivalTutorialV3Bindings } from '@/components/survival/tutorial/survivalTutorialV3Bindings';
import { SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS } from '@/components/survival/tutorial/survivalTutorialV3Constants';
import {
  clearSurvivalTutorialV3LinePresentation,
  presentSurvivalTutorialV3Line,
  presentSurvivalTutorialV3ResolvedLine,
} from '@/components/survival/tutorial/survivalTutorialV3DialogueSpeaker';
import {
  mergeSurvivalTutorialV3Baseline,
  survivalTutorialDemoPlayIntroOverrides,
  survivalTutorialDemoPlayRevealOverrides,
} from '@/components/survival/tutorial/survivalTutorialV3Scenario';
import type { SurvivalTutorialScriptPayloadV3 } from '@/components/survival/tutorial/survivalTutorialV3ScriptTypes';
import { survivalTutorialLocalized } from '@/components/survival/tutorial/survivalTutorialV3Locales';
import { TUTORIAL_STAGE_DEFINITION } from '@/components/survival/tutorial/tutorialOnboardingChords';

type DemoScene = Extract<
  SurvivalTutorialScriptPayloadV3['scenes'][number],
  { type: 'demo_play' }
>;

const DUMMY_SURVIVAL_CONFIG = {
  difficulty: 'easy' as const,
  displayName: 'Tutorial Demo',
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

const dialogueSpeakerOf = (
  line: { readonly speaker?: string },
): 'fai' | 'jajii' | 'narration' => {
  if (line.speaker === 'fai' || line.speaker === 'jajii' || line.speaker === 'narration') {
    return line.speaker;
  }
  return 'fai';
};

export interface SurvivalTutorialDemoPlaySceneProps {
  readonly script: SurvivalTutorialScriptPayloadV3;
  readonly scene: DemoScene;
  readonly bindings: SurvivalTutorialV3Bindings;
  readonly embeddedFullHeight: boolean;
  readonly onSceneComplete: () => void;
}

export const SurvivalTutorialDemoPlayScene: React.FC<SurvivalTutorialDemoPlaySceneProps> = ({
  script,
  scene,
  bindings,
  embeddedFullHeight,
  onSceneComplete,
}) => {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  const tutorialJajiiSpeechTextRef = useRef('');
  const tutorialFaiSpeechTextRef = useRef('');
  const demoStaffSnapshotRef = useRef<SurvivalTutorialDemoStaffSnapshot | null>(null);
  const windowMeasureRef = useRef<number | null>(null);
  const [scenarioHandle, setScenarioHandle] = useState<SurvivalScenarioHandle | null>(null);

  const introHasJajii = useMemo(
    () => (scene.introLines ?? []).some((l) => dialogueSpeakerOf(l) === 'jajii'),
    [scene.introLines],
  );

  const baseline = useMemo(() => mergeSurvivalTutorialV3Baseline(script), [script]);
  const keyFifths = scene.keyFifths ?? 0;
  const introLineSeconds = SURVIVAL_TUTORIAL_V3_DIALOGUE_LINE_SECONDS;

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

  const updateStaffSnapshot = useCallback(
    (activeChordIndex: number | null) => {
      if (activeChordIndex !== null && scene.chords[activeChordIndex]) {
        windowMeasureRef.current = scene.chords[activeChordIndex].measureNumber;
      } else if (windowMeasureRef.current === null) {
        windowMeasureRef.current = scene.chords[0]?.measureNumber ?? 1;
      }
      demoStaffSnapshotRef.current = {
        chords: scene.chords,
        activeChordIndex,
        keyFifths,
        windowStartMeasure: windowMeasureRef.current ?? scene.chords[0]?.measureNumber ?? 1,
      };
    },
    [keyFifths, scene.chords],
  );

  useEffect(() => {
    const h = scenarioHandle;
    if (!h || scene.chords.length === 0) {
      return undefined;
    }

    const ac = new AbortController();
    const timers: number[] = [];
    let activeChordIndex: number | null = null;
    let activeLineIndex: number | null = null;

    const scheduleTimeout = (delayMs: number, fn: () => void): void => {
      if (ac.signal.aborted) return;
      const id = window.setTimeout(() => {
        if (ac.signal.aborted) return;
        fn();
      }, Math.max(0, delayMs));
      timers.push(id);
    };

    const clearLine = (): void => {
      activeLineIndex = null;
      tutorialFaiSpeechTextRef.current = '';
      clearSurvivalTutorialV3LinePresentation(linePresentationSink);
    };

    const setActiveChord = (index: number | null): void => {
      activeChordIndex = index;
      updateStaffSnapshot(index);
      const chord = index !== null ? scene.chords[index] : null;
      h.setDemoKeyboardHints(chord?.voicing ?? []);
      if (chord && scene.livePlayback && chord.voicing.length > 0) {
        bindingsRef.current.playDemoChordAudio?.([
          ...chord.voicing,
          ...(chord.bass ?? []),
        ]);
      }
    };

    const presentDemoLine = (lineIndex: number): void => {
      const line = scene.lines[lineIndex];
      if (!line) return;
      activeLineIndex = lineIndex;
      const speaker = resolveDemoLineSpeaker(line);
      const resolved = survivalTutorialLocalized(line, bindingsRef.current.isEnglishCopy);
      presentSurvivalTutorialV3ResolvedLine(
        line,
        resolved,
        speaker === 'fai' ? 'dialogue_only' : 'battle',
        linePresentationSink,
      );
    };

    const runIntro = async (): Promise<boolean> => {
      bindingsRef.current.stopDemoBgm?.();

      const introLines = scene.introLines ?? [];
      if (introLines.length === 0) {
        return true;
      }

      h.setOverrides(survivalTutorialDemoPlayIntroOverrides(baseline));
      updateStaffSnapshot(null);
      h.setDemoKeyboardHints([]);

      for (let i = 0; i < introLines.length; i += 1) {
        if (ac.signal.aborted) return false;
        const line = introLines[i];
        if (!line) continue;
        presentSurvivalTutorialV3Line(
          line,
          bindingsRef.current.isEnglishCopy,
          'dialogue_only',
          linePresentationSink,
        );
        await bindingsRef.current.waitForTapOrTimeout(introLineSeconds, ac.signal);
        if (ac.signal.aborted) return false;
      }

      clearLine();
      return !ac.signal.aborted;
    };

    const runDemo = (anchorTimeMs: number): void => {
      h.setOverrides(survivalTutorialDemoPlayRevealOverrides(baseline));
      updateStaffSnapshot(null);
      h.setDemoKeyboardHints([]);

      const schedule = buildDemoPlaySchedule(scene);

      for (const event of schedule) {
        const atSecondsMs = event.atSeconds * 1000;
        scheduleTimeout(anchoredDelayMs(atSecondsMs, performance.now() - anchorTimeMs), () => {
          if (event.kind === 'chord-start' && typeof event.chordIndex === 'number') {
            setActiveChord(event.chordIndex);
            return;
          }
          if (event.kind === 'chord-end' && event.chordIndex === activeChordIndex) {
            setActiveChord(null);
            return;
          }
          if (event.kind === 'line-start' && typeof event.lineIndex === 'number') {
            presentDemoLine(event.lineIndex);
            return;
          }
          if (event.kind === 'line-end' && event.lineIndex === activeLineIndex) {
            clearLine();
            return;
          }
          if (event.kind === 'demo-end') {
            clearLine();
            setActiveChord(null);
            h.setDemoKeyboardHints([]);
            onSceneComplete();
          }
        });
      }
    };

    const run = async (): Promise<void> => {
      const introOk = await runIntro();
      if (!introOk || ac.signal.aborted) return;
      await bindingsRef.current.startDemoBgmFromStart?.(scene);
      if (ac.signal.aborted) return;
      runDemo(performance.now());
    };

    void run();

    return () => {
      ac.abort();
      for (const id of timers) {
        window.clearTimeout(id);
      }
      clearLine();
      h.setDemoKeyboardHints([]);
      bindingsRef.current.setTapAdvanceCueVisible(false);
      bindingsRef.current.stopDemoBgm?.();
    };
  }, [
    baseline,
    introLineSeconds,
    linePresentationSink,
    onSceneComplete,
    scenarioHandle,
    scene,
    updateStaffSnapshot,
  ]);

  return (
    <div className="relative h-full min-h-0 w-full bg-black">
      <SurvivalGameScreen
        key={`tutorial-v3-demo:${scene.bpm}:${scene.chords.length}`}
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
        initialScenarioOverrides={survivalTutorialDemoPlayIntroOverrides(baseline)}
        tutorialDialogueJajii={introHasJajii}
        tutorialJajiiSpeechTextRef={tutorialJajiiSpeechTextRef}
        tutorialFaiSpeechTextRef={tutorialFaiSpeechTextRef}
        tutorialDemoStaffSnapshotRef={demoStaffSnapshotRef}
        onScenarioHandleReady={(x) => {
          setScenarioHandle(x);
        }}
        onBackToSelect={() => bindingsRef.current.onExit()}
        onBackToMenu={() => bindingsRef.current.onExit()}
      />
    </div>
  );
};
