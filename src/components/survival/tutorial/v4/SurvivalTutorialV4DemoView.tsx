import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { survivalTutorialLocalized } from '../survivalTutorialV3Locales';
import {
  SurvivalTutorialDemoStaff,
  type SurvivalTutorialDemoStaffSnapshot,
} from '../SurvivalTutorialDemoStaff';
import {
  anchoredDelayMs,
  buildDemoPlaySchedule,
  resolveDemoLineSpeaker,
} from '../survivalTutorialDemoPlayScheduler';
import { playTutorialChordPreview } from '../tutorialAudioUnlock';
import { resolveSurvivalTutorialV4KeyboardRange } from './survivalTutorialV4KeyboardLayout';
import { SurvivalTutorialV4Keyboard } from './SurvivalTutorialV4Keyboard';
import { SurvivalTutorialV4SpeechBubble } from './SurvivalTutorialV4SpeechBubble';
import { survivalTutorialV4DemoSceneToV3 } from './v4RuntimeAdapters';
import type { SurvivalTutorialV4DemoScene } from './survivalTutorialV4Types';

const SCENE_END_AUTO_ADVANCE_MS = 2000;
const EMPTY_MIDIS: ReadonlySet<number> = new Set();

interface DemoLineState {
  readonly speaker: ReturnType<typeof resolveDemoLineSpeaker>;
  readonly text: string;
}

export interface SurvivalTutorialV4DemoViewProps {
  readonly scene: SurvivalTutorialV4DemoScene;
  readonly isEnglishCopy: boolean;
  readonly onComplete: () => void;
}

/**
 * demo シーン: 時間自動進行。拍同期で和音をアクティブ化し、アプリ音源で
 * voicing(ピアノ) + bass を発音、譜面を更新、セリフを提示する。
 *
 * 1 つの useEffect 内で setTimeout を用いた拍スケジュール(シーン寿命内のみ)。
 * 毎フレーム処理ではない。
 */
export const SurvivalTutorialV4DemoView: React.FC<SurvivalTutorialV4DemoViewProps> = ({
  scene,
  isEnglishCopy,
  onComplete,
}) => {
  const v3 = useMemo(() => survivalTutorialV4DemoSceneToV3(scene), [scene]);

  const [snapshot, setSnapshot] = useState<SurvivalTutorialDemoStaffSnapshot>(() => ({
    chords: v3.chords,
    activeChordIndex: null,
    keyFifths: v3.keyFifths ?? 0,
    windowStartMeasure: v3.chords[0]?.measureNumber ?? 1,
  }));
  const [lineState, setLineState] = useState<DemoLineState | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  const highlightedMidis = useMemo<ReadonlySet<number>>(() => {
    const index = snapshot.activeChordIndex;
    if (index === null) return EMPTY_MIDIS;
    const chord = v3.chords[index];
    if (!chord || chord.voicing.length === 0) return EMPTY_MIDIS;
    const set = new Set<number>(chord.voicing);
    for (const midi of chord.bass ?? []) set.add(midi);
    return set;
  }, [snapshot.activeChordIndex, v3.chords]);

  const keyboardRange = useMemo(() => {
    const midis: number[] = [];
    for (const chord of v3.chords) {
      for (const midi of chord.voicing) midis.push(midi);
      for (const midi of chord.bass ?? []) midis.push(midi);
    }
    return resolveSurvivalTutorialV4KeyboardRange(midis);
  }, [v3.chords]);

  useEffect(() => {
    completedRef.current = false;
    setReachedEnd(false);
    const schedule = buildDemoPlaySchedule(v3);
    const timers: number[] = [];
    let activeChordIndex: number | null = null;
    let activeLineIndex: number | null = null;
    const anchor = performance.now();

    const updateSnapshot = (index: number | null): void => {
      const measure =
        index !== null && v3.chords[index]
          ? v3.chords[index].measureNumber
          : v3.chords[0]?.measureNumber ?? 1;
      setSnapshot({
        chords: v3.chords,
        activeChordIndex: index,
        keyFifths: v3.keyFifths ?? 0,
        windowStartMeasure: measure,
      });
    };

    const playChordAudio = (index: number): void => {
      const chord = v3.chords[index];
      if (!chord || chord.voicing.length === 0) return;
      void playTutorialChordPreview(chord.voicing);
      for (const midi of chord.bass ?? []) {
        FantasySoundManager.playBassMidiNote(midi);
      }
    };

    for (const event of schedule) {
      const delay = anchoredDelayMs(event.atSeconds * 1000, performance.now() - anchor);
      const id = window.setTimeout(() => {
        if (event.kind === 'chord-start' && typeof event.chordIndex === 'number') {
          activeChordIndex = event.chordIndex;
          updateSnapshot(event.chordIndex);
          playChordAudio(event.chordIndex);
          return;
        }
        if (event.kind === 'chord-end' && event.chordIndex === activeChordIndex) {
          activeChordIndex = null;
          updateSnapshot(null);
          return;
        }
        if (event.kind === 'line-start' && typeof event.lineIndex === 'number') {
          const line = v3.lines[event.lineIndex];
          if (line) {
            activeLineIndex = event.lineIndex;
            setLineState({
              speaker: resolveDemoLineSpeaker(line),
              text: survivalTutorialLocalized(line, isEnglishCopy),
            });
          }
          return;
        }
        if (event.kind === 'line-end' && event.lineIndex === activeLineIndex) {
          activeLineIndex = null;
          setLineState(null);
          return;
        }
        if (event.kind === 'demo-end') {
          setReachedEnd(true);
        }
      }, delay);
      timers.push(id);
    }

    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [v3, isEnglishCopy]);

  useEffect(() => {
    if (!reachedEnd) return undefined;
    const id = window.setTimeout(complete, SCENE_END_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [reachedEnd, complete]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 bg-black/40 p-6">
      <div className="flex flex-1 items-center justify-center">
        <SurvivalTutorialDemoStaff snapshot={snapshot} />
      </div>
      <div className="min-h-[5rem] w-full">
        {lineState ? (
          <SurvivalTutorialV4SpeechBubble
            speaker={lineState.speaker}
            text={lineState.text}
            isEnglishCopy={isEnglishCopy}
          />
        ) : null}
      </div>
      <SurvivalTutorialV4Keyboard
        highlightedMidis={highlightedMidis}
        startMidi={keyboardRange.startMidi}
        endMidi={keyboardRange.endMidi}
      />
      {reachedEnd ? (
        <button
          type="button"
          onClick={complete}
          className="rounded-full bg-white/15 px-5 py-2 text-sm text-white hover:bg-white/25"
        >
          {isEnglishCopy ? 'Skip' : 'スキップ'}
        </button>
      ) : null}
    </div>
  );
};
