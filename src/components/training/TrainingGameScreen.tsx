import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { TrainingCanvas, type TrainingCanvasHandle } from '@/components/training/TrainingCanvas';
import { TrainingStaff } from '@/components/training/TrainingStaff';
import DeferredEarTrainingPianoOverlay, {
  type EarTrainingPianoOverlayHandle,
} from '@/components/earTraining/DeferredEarTrainingPianoOverlay';
import {
  evaluateTrainingNoteOn,
  getTrainingKeyboardHintMidis,
  performTrainingDefeat,
  tickTrainingEnemy,
  tickTrainingTimer,
} from '@/game/training/trainingEngine';
import {
  buildTrainingQuestion,
  createInitialTrainingRuntime,
} from '@/game/training/trainingQuestionBuilder';
import type { TrainingQuestion, TrainingRow, TrainingRuntime } from '@/game/training/trainingTypes';
import {
  TRAINING_COUNTDOWN_SEC,
  TRAINING_GAME_DURATION_SEC,
} from '@/game/training/trainingTypes';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { useGameStore } from '@/stores/gameStore';
import { EarTrainingChordVoicingDrumLoop, CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL } from '@/utils/earTrainingChordVoicingDrumLoop';
import { markAudioUserInteraction, playNote, stopNote } from '@/utils/MidiController';
import { cn } from '@/utils/cn';

interface TrainingGameScreenProps {
  readonly training: TrainingRow;
  readonly practiceMode: boolean;
  readonly onFinished: (score: number) => void;
  readonly onExit: () => void;
}

type Phase = 'countdown' | 'playing' | 'finished';

export const TrainingGameScreen: React.FC<TrainingGameScreenProps> = ({
  training,
  practiceMode,
  onFinished,
  onExit,
}) => {
  const runtimeRef = useRef<TrainingRuntime>(createInitialTrainingRuntime());
  const canvasRef = useRef<TrainingCanvasHandle | null>(null);
  const pianoRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const bgmRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const prevQuestionKeyRef = useRef<string | null>(null);
  const pendingNextRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  const displayTimeRef = useRef(TRAINING_GAME_DURATION_SEC);

  const notationInstrumentId = useGameStore((state) => state.settings.notationInstrumentId);
  const notationOctaveShift = useGameStore((state) => state.settings.notationOctaveShift);
  const inputMethod = useGameStore((state) => state.settings.inputMethod);
  const voiceSequential = inputMethod === 'voice';

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdownSec, setCountdownSec] = useState(TRAINING_COUNTDOWN_SEC);
  const [displayTimeSec, setDisplayTimeSec] = useState(TRAINING_GAME_DURATION_SEC);
  const [displayScore, setDisplayScore] = useState(0);
  const [question, setQuestion] = useState<TrainingQuestion | null>(null);
  const [correctIndices, setCorrectIndices] = useState<readonly number[]>([]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const ignoreNotationInstrument = training.clefMode === 'bass_concert' || training.clefMode === 'grand_concert';
  const showHints = practiceMode;

  const spawnQuestion = useCallback((): TrainingQuestion => {
    const built = buildTrainingQuestion({
      training,
      notationInstrumentId,
      notationOctaveShift,
      ignoreNotationInstrument,
      previousQuestionKey: prevQuestionKeyRef.current,
    });
    prevQuestionKeyRef.current = built.questionKey;
    runtimeRef.current.question = built;
    runtimeRef.current.correctTargetIndices = [];
    setQuestion(built);
    setCorrectIndices([]);
    return built;
  }, [training, notationInstrumentId, notationOctaveShift, ignoreNotationInstrument]);

  useEffect(() => {
    runtimeRef.current.durationSec = TRAINING_GAME_DURATION_SEC;
    spawnQuestion();
  }, [spawnQuestion]);

  useEffect(() => {
    if (phase !== 'countdown') return undefined;
    if (countdownSec <= 0) {
      setPhase('playing');
      runtimeRef.current.elapsedSec = 0;
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setCountdownSec((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [phase, countdownSec]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;
    const loop = new EarTrainingChordVoicingDrumLoop();
    bgmRef.current = loop;
    void (async () => {
      const ctx = new AudioContext();
      await loop.prepare(training.bgmUrl || CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, ctx);
      loop.setVolume(0.45);
      loop.start();
    })();
    return () => {
      loop.stop();
      bgmRef.current = null;
    };
  }, [phase, training.bgmUrl]);

  const hintMidis = useMemo(
    () => (question ? getTrainingKeyboardHintMidis(question, correctIndices, showHints) : []),
    [question, correctIndices, showHints],
  );

  const keyboardRange = useResolvedWebKeyboardRange(hintMidis);

  useEffect(() => {
    pianoRef.current?.setVoicingHints(hintMidis, []);
  }, [hintMidis]);

  const handleNoteOn = useCallback((midiNote: number) => {
    if (phase !== 'playing' || runtimeRef.current.result !== 'playing') return;
    const current = runtimeRef.current.question;
    if (!current || pendingNextRef.current) return;

    const result = evaluateTrainingNoteOn(
      current,
      runtimeRef.current.correctTargetIndices,
      midiNote,
      voiceSequential,
    );
    if (!result.accepted) return;

    runtimeRef.current.correctTargetIndices = result.newCorrectIndices;
    setCorrectIndices(result.newCorrectIndices);

    if (training.playRootOnCorrect && current.rootMidi != null) {
      playNote(current.rootMidi, 0.35);
    }

    if (!result.completed) return;

    pendingNextRef.current = true;
    performTrainingDefeat(runtimeRef.current, runtimeRef.current.elapsedSec);
    runtimeRef.current.score += 1;
    setDisplayScore(runtimeRef.current.score);
  }, [phase, training.playRootOnCorrect, voiceSequential]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteOn(midiNote);
  }, [handleNoteOn]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  useStandaloneNoteInput({
    onNoteOn: (note) => handleNoteOn(note),
    onKeyHighlight: (note, active) => {
      pianoRef.current?.highlightKey(note, active);
    },
  });

  useEffect(() => {
    if (phase !== 'playing' && phase !== 'countdown') return undefined;

    const tick = (now: number): void => {
      const last = lastFrameRef.current ?? now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;

      if (phase === 'playing') {
        const finished = tickTrainingTimer(runtimeRef.current, dt);
        const remaining = Math.max(0, Math.ceil(runtimeRef.current.durationSec - runtimeRef.current.elapsedSec));
        if (remaining !== displayTimeRef.current) {
          displayTimeRef.current = remaining;
          setDisplayTimeSec(remaining);
        }

        const enemyReady = tickTrainingEnemy(runtimeRef.current, runtimeRef.current.elapsedSec, dt);
        if (enemyReady) {
          pendingNextRef.current = false;
          spawnQuestion();
        }

        canvasRef.current?.draw(runtimeRef.current);

        if (finished) {
          runtimeRef.current.result = 'finished';
          setPhase('finished');
          bgmRef.current?.stop();
          onFinishedRef.current(runtimeRef.current.score);
        }
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastFrameRef.current = null;
    };
  }, [phase, spawnQuestion]);

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-950 landscape:flex-row">
      <button
        type="button"
        className="absolute left-3 top-3 z-50 rounded-lg bg-slate-800/80 px-3 py-1 text-sm text-white"
        onClick={() => {
          markAudioUserInteraction();
          onExit();
        }}
      >
        終了
      </button>

      <div
        className="pointer-events-none absolute left-4 top-4 z-30 font-bold text-white"
        style={{ font: 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {phase === 'countdown' ? countdownSec : `${displayTimeSec}s`}
      </div>
      <div
        className="pointer-events-none absolute right-4 top-4 z-30 font-bold text-amber-300"
        style={{ font: 'bold 26px system-ui, -apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {displayScore}
      </div>

      <div className="relative min-h-0 flex-1">
        <TrainingCanvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        {question && phase !== 'countdown' && (
          <div className="absolute left-1/2 top-[42%] z-20 w-[min(720px,82vw)] -translate-x-1/2">
            {question.promptLabel !== '' && (
              <p className="mb-1 text-center text-lg font-semibold text-white">{question.promptLabel}</p>
            )}
            <TrainingStaff
              question={question}
              correctIndices={correctIndices}
              showHints={showHints}
              clefMode={training.clefMode}
            />
          </div>
        )}
        {phase === 'countdown' && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <span className="text-6xl font-bold text-white">{countdownSec}</span>
          </div>
        )}
      </div>

      <div className={cn('relative z-30 shrink-0', !showHints && 'opacity-40')}>
        <DeferredEarTrainingPianoOverlay
          ref={pianoRef}
          minMidi={keyboardRange.minMidi}
          maxMidi={keyboardRange.maxMidi}
          onPianoKeyDown={handlePianoKeyDown}
          onPianoKeyUp={handlePianoKeyUp}
        />
      </div>
    </div>
  );
};
