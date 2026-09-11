import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import EarTrainingSettingsModal from '@/components/earTraining/EarTrainingSettingsModal';
import { TrainingCanvas, type TrainingCanvasHandle } from '@/components/training/TrainingCanvas';
import { TrainingStaff } from '@/components/training/TrainingStaff';
import DeferredEarTrainingPianoOverlay, {
  type EarTrainingPianoOverlayHandle,
} from '@/components/earTraining/DeferredEarTrainingPianoOverlay';
import { PIANO_OVERLAY_HEIGHT } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import {
  evaluateTrainingNoteOn,
  getTrainingKeyboardHintMidis,
  performTrainingDefeat,
  tickTrainingEnemy,
  tickTrainingTimer,
} from '@/game/training/trainingEngine';
import { computeTrainingStageMidis } from '@/game/training/trainingKeyboardRange';
import type { MutableTrainingSceneHud } from '@/game/training/trainingSceneHud';
import {
  buildTrainingQuestion,
  createInitialTrainingRuntime,
} from '@/game/training/trainingQuestionBuilder';
import type { TrainingQuestion, TrainingRow, TrainingRuntime } from '@/game/training/trainingTypes';
import {
  TRAINING_COUNTDOWN_SEC,
  TRAINING_GAME_DURATION_SEC,
  TRAINING_GUARD_POSE_SEC,
} from '@/game/training/trainingTypes';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { EarTrainingChordVoicingDrumLoop, CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL } from '@/utils/earTrainingChordVoicingDrumLoop';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { markAudioUserInteraction, playNote, stopNote } from '@/utils/MidiController';

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
  const onFinishedRef = useRef(onFinished);
  const isSettingsOpenRef = useRef(false);
  const hudRef = useRef<MutableTrainingSceneHud>({
    phase: 'countdown',
    countdownSec: TRAINING_COUNTDOWN_SEC,
    remainSec: TRAINING_GAME_DURATION_SEC,
    score: 0,
    enemyHp: 1,
    enemyMaxHp: 1,
  });

  const profile = useAuthStore((state) => state.profile);
  const geoCountry = useGeoStore((state) => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const notationInstrumentId = settings.notationInstrumentId;
  const notationOctaveShift = settings.notationOctaveShift;
  const voiceSequential = settings.inputMethod === 'voice';

  const [phase, setPhase] = useState<Phase>('countdown');
  const [countdownSec, setCountdownSec] = useState(TRAINING_COUNTDOWN_SEC);
  const [question, setQuestion] = useState<TrainingQuestion | null>(null);
  const [correctIndices, setCorrectIndices] = useState<readonly number[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  isSettingsOpenRef.current = isSettingsOpen;

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
    runtimeRef.current.enemy.fadeAlpha = 1;
    setQuestion(built);
    setCorrectIndices([]);
    return built;
  }, [training, notationInstrumentId, notationOctaveShift, ignoreNotationInstrument]);

  useEffect(() => {
    runtimeRef.current.durationSec = TRAINING_GAME_DURATION_SEC;
    spawnQuestion();
  }, [spawnQuestion]);

  useEffect(() => {
    if (isSettingsOpen) return undefined;
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
  }, [phase, countdownSec, isSettingsOpen]);

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

  const stageKeyboardMidis = useMemo(
    () => computeTrainingStageMidis(training, {
      notationInstrumentId,
      notationOctaveShift,
      ignoreNotationInstrument,
    }),
    [training, notationInstrumentId, notationOctaveShift, ignoreNotationInstrument],
  );
  const keyboardRange = useResolvedWebKeyboardRange(stageKeyboardMidis);

  useEffect(() => {
    pianoRef.current?.setVoicingHints(hintMidis, []);
  }, [hintMidis]);

  const handleNoteOn = useCallback((midiNote: number) => {
    if (isSettingsOpenRef.current) return;
    if (phase !== 'playing' || runtimeRef.current.result !== 'playing') return;
    const current = runtimeRef.current.question;
    if (!current) return;

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

    performTrainingDefeat(runtimeRef.current, runtimeRef.current.elapsedSec, TRAINING_GUARD_POSE_SEC);
    runtimeRef.current.score += 1;
    spawnQuestion();
  }, [phase, spawnQuestion, training.playRootOnCorrect, voiceSequential]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteOn(midiNote);
  }, [handleNoteOn]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
  }, [updateSettings]);

  const { isConnected: isMidiConnected } = useStandaloneNoteInput({
    onNoteOn: (note) => handleNoteOn(note),
    onKeyHighlight: (note, active) => {
      pianoRef.current?.highlightKey(note, active);
    },
  });

  useEffect(() => {
    if (isSettingsOpen) return undefined;
    if (phase !== 'playing' && phase !== 'countdown') return undefined;
    lastFrameRef.current = null;

    const tick = (now: number): void => {
      const last = lastFrameRef.current ?? now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;

      const runtime = runtimeRef.current;
      const hud = hudRef.current;

      if (phase === 'countdown') {
        hud.phase = 'countdown';
        hud.countdownSec = countdownSec;
        hud.remainSec = TRAINING_GAME_DURATION_SEC;
        hud.score = runtime.score;
        hud.enemyHp = 1;
        hud.enemyMaxHp = 1;
      } else {
        const finished = tickTrainingTimer(runtime, dt);
        tickTrainingEnemy(runtime, runtime.elapsedSec, dt);

        hud.phase = 'playing';
        hud.countdownSec = 0;
        hud.remainSec = Math.max(0, Math.ceil(runtime.durationSec - runtime.elapsedSec));
        hud.score = runtime.score;
        hud.enemyHp = runtime.enemy.fadeAlpha >= 0.99 ? 1 : 0;
        hud.enemyMaxHp = 1;

        if (finished) {
          runtime.result = 'finished';
          setPhase('finished');
          bgmRef.current?.stop();
          onFinishedRef.current(runtime.score);
          return;
        }
      }

      canvasRef.current?.draw(runtime, hudRef.current);
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastFrameRef.current = null;
    };
  }, [phase, countdownSec, isSettingsOpen]);

  return (
    <div className="fixed inset-0 z-40 overflow-hidden bg-slate-950">
      <TrainingCanvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {question && phase !== 'countdown' && (
        <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2">
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
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <span className="text-6xl font-bold text-white">{countdownSec}</span>
        </div>
      )}

      <div className="absolute right-3 top-[56px] z-40 flex gap-2">
        <button
          type="button"
          className="rounded border border-white/15 bg-slate-950/75 px-3 py-2 text-sm font-black text-slate-100"
          onClick={() => setIsSettingsOpen(true)}
        >
          {isEnglishCopy ? 'Settings' : '設定'}
        </button>
        <button
          type="button"
          className="rounded border border-white/15 bg-slate-950/75 px-3 py-2 text-sm font-black text-slate-100"
          onClick={() => {
            markAudioUserInteraction();
            onExit();
          }}
        >
          {isEnglishCopy ? 'Exit' : '終了'}
        </button>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 z-30"
        style={{ height: PIANO_OVERLAY_HEIGHT }}
      >
        <DeferredEarTrainingPianoOverlay
          ref={pianoRef}
          minMidi={keyboardRange.minMidi}
          maxMidi={keyboardRange.maxMidi}
          onPianoKeyDown={handlePianoKeyDown}
          onPianoKeyUp={handlePianoKeyUp}
        />
      </div>

      <EarTrainingSettingsModal
        isOpen={isSettingsOpen}
        isEnglishCopy={isEnglishCopy}
        onClose={() => setIsSettingsOpen(false)}
        midiDeviceId={settings.selectedMidiDevice}
        onMidiDeviceChange={handleMidiDeviceChange}
        isMidiConnected={isMidiConnected}
      />
    </div>
  );
};
