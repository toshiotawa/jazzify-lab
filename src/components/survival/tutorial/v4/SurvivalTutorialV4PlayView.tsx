import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { SurvivalPhraseStaff } from '@/components/survival/phrases/SurvivalPhraseStaff';
import {
  createInitialPhraseState,
  evaluatePhraseNoteOn,
  type SurvivalPhraseRuntimeState,
} from '@/components/survival/phrases/SurvivalPhraseEngine';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { MIDIController } from '@/utils/MidiController';
import { survivalTutorialLocalized } from '../survivalTutorialV3Locales';
import { beatToSeconds } from '../survivalTutorialDemoPlayScheduler';
import { unlockTutorialAudio } from '../tutorialAudioUnlock';
import { resolveSurvivalTutorialV4KeyboardRange } from './survivalTutorialV4KeyboardLayout';
import { SurvivalTutorialV4Keyboard } from './SurvivalTutorialV4Keyboard';
import { SurvivalTutorialV4SpeechBubble } from './SurvivalTutorialV4SpeechBubble';
import {
  buildSurvivalTutorialV4PlaySteps,
  resolvePlayLineIndexAtBeat,
} from './survivalTutorialV4PlayDialogue';
import { survivalTutorialV4PlaySceneToPhraseDefinition } from './v4RuntimeAdapters';
import type { SurvivalTutorialV4PlayScene } from './survivalTutorialV4Types';

const SCENE_END_AUTO_ADVANCE_MS = 2000;
const DIALOGUE_STEP_MIN_MS = 1500;
const EMPTY_INDEX_SET: ReadonlySet<number> = new Set();

const pitchClassOf = (midi: number): number => ((midi % 12) + 12) % 12;

export interface SurvivalTutorialV4PlayViewProps {
  readonly scene: SurvivalTutorialV4PlayScene;
  readonly isEnglishCopy: boolean;
  readonly onComplete: () => void;
}

/**
 * play シーン: 時間非同期。
 * - note ステップ: 正解(塊完成)で次へ。完成時にベース音源を発音。
 * - dialogue ステップ(セリフ付き休符小節): 自動送り + クリックで次へ。
 * 判定は既存 `evaluatePhraseNoteOn`(純粋)を1塊フレーズで利用する。
 */
export const SurvivalTutorialV4PlayView: React.FC<SurvivalTutorialV4PlayViewProps> = ({
  scene,
  isEnglishCopy,
  onComplete,
}) => {
  const fullPhrase = useMemo(
    () => survivalTutorialV4PlaySceneToPhraseDefinition(scene),
    [scene],
  );
  const steps = useMemo(() => buildSurvivalTutorialV4PlaySteps(scene), [scene]);

  const keyboardRange = useMemo(() => {
    const midis: number[] = [];
    for (const question of scene.questions) {
      for (const midi of question.notes) midis.push(midi);
      for (const midi of question.bass) midis.push(midi);
    }
    return resolveSurvivalTutorialV4KeyboardRange(midis);
  }, [scene.questions]);

  const [stepIndex, setStepIndex] = useState(0);
  const stepIndexRef = useRef(stepIndex);
  stepIndexRef.current = stepIndex;

  const [phraseState, setPhraseState] = useState<SurvivalPhraseRuntimeState | null>(null);
  const stateRef = useRef(phraseState);
  stateRef.current = phraseState;

  const [reachedEnd, setReachedEnd] = useState(false);
  const [highlightedMidis, setHighlightedMidis] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current();
  }, []);

  const goToNextStep = useCallback(() => {
    setStepIndex((prev) => {
      const next = prev + 1;
      if (next >= steps.length) {
        setReachedEnd(true);
        return prev;
      }
      return next;
    });
  }, [steps.length]);
  const goToNextStepRef = useRef(goToNextStep);
  goToNextStepRef.current = goToNextStep;

  const handleNoteOn = useCallback(
    (note: number) => {
      const step = steps[stepIndexRef.current];
      if (!step || step.kind !== 'note') return;
      const prev = stateRef.current;
      if (!prev) return;
      const evaluation = evaluatePhraseNoteOn(prev, pitchClassOf(note));
      stateRef.current = evaluation.nextState;
      setPhraseState(evaluation.nextState);
      if (evaluation.result === 'measure-complete') {
        const question = scene.questions[step.chunkIndex];
        for (const midi of question?.bass ?? []) {
          FantasySoundManager.playBassMidiNote(midi);
        }
        goToNextStepRef.current();
      }
    },
    [scene.questions, steps],
  );
  const handleNoteOnRef = useRef(handleNoteOn);
  handleNoteOnRef.current = handleNoteOn;

  useEffect(() => {
    completedRef.current = false;
    setReachedEnd(false);
    setStepIndex(0);
    if (steps.length === 0) {
      complete();
    }
  }, [steps, complete]);

  useEffect(() => {
    const step = steps[stepIndex];
    if (!step) return undefined;
    if (step.kind === 'note') {
      const chord = fullPhrase.chords[step.judgeIndex];
      if (!chord) {
        goToNextStepRef.current();
        return undefined;
      }
      const singleChordPhrase = { ...fullPhrase, chords: [chord] };
      const initial = createInitialPhraseState(singleChordPhrase);
      stateRef.current = initial;
      setPhraseState(initial);
      return undefined;
    }
    stateRef.current = null;
    setPhraseState(null);
    const ms = Math.max(
      beatToSeconds(step.durationBeats, scene.bpm) * 1000,
      DIALOGUE_STEP_MIN_MS,
    );
    const id = window.setTimeout(() => goToNextStepRef.current(), ms);
    return () => window.clearTimeout(id);
  }, [stepIndex, steps, fullPhrase, scene.bpm]);

  useEffect(() => {
    if (!reachedEnd) return undefined;
    const id = window.setTimeout(complete, SCENE_END_AUTO_ADVANCE_MS);
    return () => window.clearTimeout(id);
  }, [reachedEnd, complete]);

  useEffect(() => {
    let disposed = false;
    let controller: MIDIController | null = null;
    void (async () => {
      await unlockTutorialAudio();
      const ctrl = new MIDIController({
        onNoteOn: (note) => handleNoteOnRef.current(note),
        onNoteOff: () => undefined,
      });
      ctrl.setKeyHighlightCallback((note, active) => {
        setHighlightedMidis((prev) => {
          const next = new Set(prev);
          if (active) next.add(note);
          else next.delete(note);
          return next;
        });
      });
      controller = ctrl;
      await ctrl.initialize();
      if (disposed) {
        void ctrl.destroy();
        return;
      }
      const first = ctrl.getDeviceList()[0];
      if (first) {
        await ctrl.connectDevice(first.id);
      }
    })();
    return () => {
      disposed = true;
      void controller?.destroy();
    };
  }, []);

  const currentStep = steps[stepIndex] ?? null;
  const currentChord =
    currentStep?.kind === 'note' && phraseState
      ? phraseState.phrase.chords[phraseState.chordIndex] ?? null
      : null;

  const dialogueBeat = currentStep?.startBeat ?? 0;
  const dialogueIndex = resolvePlayLineIndexAtBeat(scene.lines, dialogueBeat);
  const dialogueLine = dialogueIndex !== null ? scene.lines[dialogueIndex] : null;

  const dialogueBubble = dialogueLine ? (
    <SurvivalTutorialV4SpeechBubble
      speaker={dialogueLine.speaker ?? 'fai'}
      text={survivalTutorialLocalized(dialogueLine, isEnglishCopy)}
      isEnglishCopy={isEnglishCopy}
    />
  ) : null;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between gap-4 bg-black/40 p-6">
      {currentStep?.kind === 'dialogue' ? (
        <button
          type="button"
          onClick={goToNextStep}
          className="min-h-[5rem] w-full text-left"
          aria-label={isEnglishCopy ? 'Next' : '次へ'}
        >
          {dialogueBubble}
        </button>
      ) : (
        <div className="min-h-[5rem] w-full">{dialogueBubble}</div>
      )}
      <div className="flex flex-1 items-center justify-center">
        <SurvivalPhraseStaff
          currentChord={currentChord}
          nextChord={null}
          keyFifths={fullPhrase.keyFifths}
          correctNoteIndices={phraseState?.correctNoteIndices ?? EMPTY_INDEX_SET}
          revealedNoteIndices={phraseState?.revealedNoteIndices ?? EMPTY_INDEX_SET}
          targetNoteIndex={phraseState?.targetNoteIndex ?? 0}
          hintMode
          unpressedNoteOpacity={0.4}
        />
      </div>
      <SurvivalTutorialV4Keyboard
        highlightedMidis={highlightedMidis}
        startMidi={keyboardRange.startMidi}
        endMidi={keyboardRange.endMidi}
      />
      <button
        type="button"
        onClick={complete}
        className="rounded-full bg-white/15 px-5 py-2 text-sm text-white hover:bg-white/25"
      >
        {reachedEnd
          ? isEnglishCopy
            ? 'Next'
            : '次へ'
          : isEnglishCopy
            ? 'Skip'
            : 'スキップ'}
      </button>
    </div>
  );
};
