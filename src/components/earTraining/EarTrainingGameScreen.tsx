import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PIXINotesRenderer, PIXINotesRendererInstance } from '@/components/game/PIXINotesRenderer';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import type {
  ClearConditions,
  EarTrainingGameState,
  EarTrainingPhrase,
  EarTrainingPhraseAttempt,
  EarTrainingPhraseChord,
  EarTrainingRank,
  EarTrainingStage,
} from '@/types';
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import {
  MIDIController,
  initializeAudioSystem,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import {
  calculateEarTrainingRank,
  createPhraseAttempt,
  getCompletionDamage,
  getNextMeasureDelaySec,
  handleEarTrainingNoteInput,
  mapEarTrainingRankToLessonRank,
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';
import { DEFAULT_AVATAR_URL } from '@/utils/constants';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingGameScreenProps {
  stage: EarTrainingStage;
  enemy: SurvivalCharacterRow | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
}

interface ElementSize {
  width: number;
  height: number;
}

const DEFAULT_PIANO_HEIGHT = 132;
const INPUT_COOLDOWN_MS = 20;
const AUDIO_END_EPSILON_SEC = 0.03;
const NO_DAMAGE_CONFIG = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};

const useElementSize = <T extends HTMLElement>(): [React.RefObject<T>, ElementSize] => {
  const ref = useRef<T>(null);
  const [size, setSize] = useState<ElementSize>({ width: 800, height: DEFAULT_PIANO_HEIGHT });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return undefined;
    }

    const update = () => {
      setSize({
        width: Math.max(320, element.clientWidth),
        height: Math.max(96, element.clientHeight || DEFAULT_PIANO_HEIGHT),
      });
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
};

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const getActiveChord = (phrase: EarTrainingPhrase | undefined, timeSec: number): EarTrainingPhraseChord | null => {
  if (!phrase?.chords || phrase.chords.length === 0) {
    return null;
  }

  const explicit = phrase.chords.find(chord => {
    if (chord.start_time_sec === null || chord.start_time_sec === undefined) {
      return false;
    }
    const end = chord.end_time_sec ?? Number.POSITIVE_INFINITY;
    return timeSec >= chord.start_time_sec && timeSec < end;
  });
  if (explicit) {
    return explicit;
  }

  return phrase.chords[0] ?? null;
};

const EarTrainingGameScreen: React.FC<EarTrainingGameScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
}) => {
  const { settings, updateSettings } = useGameStore();
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const phrases = useMemo(
    () => (stage.phrases ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [stage.phrases],
  );
  const damageConfig = useMemo(
    () => ({
      perCorrectNote: stage.per_correct_note_damage,
      good: stage.good_completion_damage,
      great: stage.great_completion_damage,
      perfect: stage.perfect_completion_damage,
      miss: stage.miss_damage,
      fail: stage.fail_damage,
    }),
    [stage],
  );
  const activeDamageConfig = useMemo(
    () => (practiceMode ? NO_DAMAGE_CONFIG : damageConfig),
    [damageConfig, practiceMode],
  );
  const rankRule = useMemo(
    () => ({
      perfectMaxMisses: stage.perfect_max_misses,
      greatMaxMisses: stage.great_max_misses,
    }),
    [stage.great_max_misses, stage.perfect_max_misses],
  );

  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [attempt, setAttempt] = useState<EarTrainingPhraseAttempt | null>(null);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [timeRemaining, setTimeRemaining] = useState(stage.time_limit_sec);
  const [countInValue, setCountInValue] = useState(stage.count_in_beats);
  const [statusText, setStatusText] = useState('準備ができたら開始してください');
  const [activeLoop, setActiveLoop] = useState(1);
  const [activeChord, setActiveChord] = useState<EarTrainingPhraseChord | null>(null);
  const [lastRank, setLastRank] = useState<EarTrainingRank | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const [pianoContainerRef, pianoSize] = useElementSize<HTMLDivElement>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const startPhraseRef = useRef<(nextPhraseIndex: number) => void>(() => undefined);
  const attemptRef = useRef<EarTrainingPhraseAttempt | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const phraseIndexRef = useRef(0);
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const timeRemainingRef = useRef(stage.time_limit_sec);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const chordScrollerRef = useRef<HTMLDivElement | null>(null);
  const chordElementRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  const currentPhrase = phrases[phraseIndex];

  useEffect(() => {
    chordScrollerRef.current?.scrollTo({ left: 0, behavior: 'auto' });
  }, [currentPhrase?.id]);

  useEffect(() => {
    if (!activeChord?.id) {
      return;
    }

    const scroller = chordScrollerRef.current;
    const activeElement = chordElementRefs.current.get(activeChord.id);
    if (!scroller || !activeElement) {
      return;
    }

    const centeredLeft = activeElement.offsetLeft - ((scroller.clientWidth - activeElement.clientWidth) / 2);
    scroller.scrollTo({ left: Math.max(0, centeredLeft), behavior: 'auto' });
  }, [activeChord?.id]);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    phraseIndexRef.current = phraseIndex;
  }, [phraseIndex]);

  useEffect(() => {
    enemyHpRef.current = enemyHp;
  }, [enemyHp]);

  useEffect(() => {
    playerHpRef.current = playerHp;
  }, [playerHp]);

  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.midiVolume]);

  const clearFailTimer = useCallback(() => {
    if (failTimerRef.current) {
      clearTimeout(failTimerRef.current);
      failTimerRef.current = null;
    }
  }, []);

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
  }, []);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const clearTimeLimitTimer = useCallback(() => {
    if (timeLimitTimerRef.current) {
      clearInterval(timeLimitTimerRef.current);
      timeLimitTimerRef.current = null;
    }
  }, []);

  const stopPhraseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const triggerFeedback = useCallback((value: 'correct' | 'miss' | 'clear') => {
    setFeedback(value);
    setTimeout(() => setFeedback(null), 220);
  }, []);

  const finishStageClear = useCallback(async (rank: EarTrainingRank) => {
    clearFailTimer();
    clearTransitionTimer();
    clearTimeLimitTimer();
    gameStateRef.current = 'stageClear';
    stopPhraseAudio();
    setLastRank(rank);
    setGameState('stageClear');
    setStatusText('Stage Clear!');
    triggerFeedback('clear');

    if (practiceMode || !lessonContext || progressSaveStartedRef.current) {
      return;
    }

    progressSaveStartedRef.current = true;
    const lessonRank = mapEarTrainingRankToLessonRank(rank);
    await onLessonStageClear(lessonRank);
    setProgressSaved(true);
  }, [
    clearFailTimer,
    clearTimeLimitTimer,
    clearTransitionTimer,
    lessonContext,
    onLessonStageClear,
    practiceMode,
    stopPhraseAudio,
    triggerFeedback,
  ]);

  const finishGameOver = useCallback((message: string) => {
    clearFailTimer();
    clearTransitionTimer();
    clearTimeLimitTimer();
    gameStateRef.current = 'gameOver';
    stopPhraseAudio();
    setGameState('gameOver');
    setStatusText(message);
  }, [clearFailTimer, clearTimeLimitTimer, clearTransitionTimer, stopPhraseAudio]);

  const failCurrentPhrase = useCallback(() => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || currentAttempt.completed || gameStateRef.current !== 'playingPhrase') {
      return;
    }

    gameStateRef.current = 'phraseFail';
    const nextPlayerHp = Math.max(0, playerHpRef.current - activeDamageConfig.fail);
    setPlayerHp(nextPlayerHp);
    playerHpRef.current = nextPlayerHp;
    setAttempt({ ...currentAttempt, failed: true });
    setLastRank('Fail');

    const outcome = resolveEarTrainingOutcome({
      enemyHp: enemyHpRef.current,
      playerHp: nextPlayerHp,
      timeRemainingSec: timeRemainingRef.current,
      phraseCompleted: false,
      phraseFailed: true,
    });

    if (outcome === 'gameOver') {
      finishGameOver('Game Over');
      return;
    }

    setGameState('phraseFail');
    setStatusText('Fail: 次のフレーズへ進みます');
    triggerFeedback('miss');
    transitionTimerRef.current = setTimeout(() => {
      const wrappedIndex = (phraseIndexRef.current + 1) % phrases.length;
      startPhraseRef.current(wrappedIndex);
    }, 900);
  }, [activeDamageConfig.fail, finishGameOver, phrases.length, triggerFeedback]);

  const startPhrase = useCallback((nextPhraseIndex: number) => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver('フレーズが登録されていません');
      return;
    }

    clearFailTimer();
    clearTransitionTimer();
    setPhraseIndex(nextPhraseIndex);
    phraseIndexRef.current = nextPhraseIndex;
    const nextAttempt = createPhraseAttempt(phrase);
    setAttempt(nextAttempt);
    setLastRank(null);
    setActiveLoop(1);
    setActiveChord(getActiveChord(phrase, 0));
    setStatusText(`Phrase ${nextPhraseIndex + 1}`);
    gameStateRef.current = 'playingPhrase';
    setGameState('playingPhrase');

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = phrase.audio_url;
      audio.currentTime = 0;
      audio.volume = settings.musicVolume * settings.masterVolume;
      void audio.play().catch(() => {
        setStatusText('音源を再生できませんでした。もう一度開始してください。');
      });
    }
  }, [
    clearFailTimer,
    clearTransitionTimer,
    finishGameOver,
    phrases,
    settings.masterVolume,
    settings.musicVolume,
  ]);

  useEffect(() => {
    startPhraseRef.current = startPhrase;
  }, [startPhrase]);

  const startTimeLimit = useCallback(() => {
    clearTimeLimitTimer();
    if (practiceMode) {
      return;
    }
    timeLimitTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          finishGameOver('Time Up');
        }
        return next;
      });
    }, 1000);
  }, [clearTimeLimitTimer, finishGameOver, practiceMode]);

  const startCountIn = useCallback(() => {
    if (phrases.length === 0) {
      finishGameOver('フレーズが登録されていません');
      return;
    }

    void initializeAudioSystem().catch(() => undefined);
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    setTimeRemaining(stage.time_limit_sec);
    setPhraseIndex(0);
    setCountInValue(stage.count_in_beats);
    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText('Count In');
    clearCountdownTimer();
    clearFailTimer();
    clearTransitionTimer();
    clearTimeLimitTimer();
    stopPhraseAudio();

    let remaining = stage.count_in_beats;
    countdownTimerRef.current = setInterval(() => {
      remaining -= 1;
      setCountInValue(Math.max(remaining, 0));
      if (remaining <= 0) {
        clearCountdownTimer();
        startTimeLimit();
        startPhrase(0);
      }
    }, Math.max(100, (60 / stage.bpm) * 1000));
  }, [
    clearCountdownTimer,
    clearFailTimer,
    clearTimeLimitTimer,
    clearTransitionTimer,
    finishGameOver,
    phrases.length,
    stage.bpm,
    stage.count_in_beats,
    stage.enemy_hp,
    stage.player_hp,
    stage.time_limit_sec,
    startPhrase,
    startTimeLimit,
    stopPhraseAudio,
  ]);

  const transitionToNextPhrase = useCallback((rank: EarTrainingRank, phrase: EarTrainingPhrase) => {
    const delaySec = getNextMeasureDelaySec(
      audioRef.current?.currentTime ?? 0,
      Number(phrase.loop_duration_sec),
      stage.loop_measures,
    );
    gameStateRef.current = 'phraseComplete';
    setGameState('phraseComplete');
    setLastRank(rank);
    setStatusText(`${rank}: 次の小節頭で次へ`);

    transitionTimerRef.current = setTimeout(() => {
      stopPhraseAudio();
      setGameState('transitionToNextPhrase');
      transitionTimerRef.current = setTimeout(() => {
        const nextIndex = (phraseIndex + 1) % phrases.length;
        startPhrase(nextIndex);
      }, 420);
    }, delaySec * 1000);
  }, [phraseIndex, phrases.length, stage.loop_measures, startPhrase, stopPhraseAudio]);

  const handleNoteInput = useCallback((note: number) => {
    const now = performance.now();
    if (now - lastInputAtRef.current < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtRef.current = now;

    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }

    const phrase = phrases[phraseIndex];
    const currentAttempt = attemptRef.current;
    if (!phrase || !currentAttempt) {
      return;
    }

    const result = handleEarTrainingNoteInput(phrase, currentAttempt, note, activeDamageConfig);
    setAttempt(result.attempt);

    if (result.correct) {
      const nextEnemyHp = Math.max(0, enemyHpRef.current - result.enemyDamage);
      setEnemyHp(nextEnemyHp);
      enemyHpRef.current = nextEnemyHp;
      setStatusText(result.revealedNote ? `正解: ${result.revealedNote}` : '正解');
      triggerFeedback('correct');

      const outcome = resolveEarTrainingOutcome({
        enemyHp: nextEnemyHp,
        playerHp: playerHpRef.current,
        timeRemainingSec: timeRemainingRef.current,
        phraseCompleted: result.completed,
        phraseFailed: false,
      });

      if (outcome === 'stageClear') {
        const rank = calculateEarTrainingRank(result.attempt.missedNoteIndexes, rankRule);
        void finishStageClear(rank);
        return;
      }

      if (outcome === 'phraseComplete') {
        clearFailTimer();
        const rank = calculateEarTrainingRank(result.attempt.missedNoteIndexes, rankRule);
        const completionDamage = getCompletionDamage(rank, activeDamageConfig);
        const enemyHpAfterCompletion = Math.max(0, nextEnemyHp - completionDamage);
        setEnemyHp(enemyHpAfterCompletion);
        enemyHpRef.current = enemyHpAfterCompletion;

        if (enemyHpAfterCompletion <= 0) {
          void finishStageClear(rank);
          return;
        }

        transitionToNextPhrase(rank, phrase);
      }
      return;
    }

    if (result.playerDamage > 0) {
      const nextPlayerHp = Math.max(0, playerHpRef.current - result.playerDamage);
      setPlayerHp(nextPlayerHp);
      playerHpRef.current = nextPlayerHp;
      triggerFeedback('miss');
      setStatusText('ミス: 敵の攻撃');

      const outcome = resolveEarTrainingOutcome({
        enemyHp: enemyHpRef.current,
        playerHp: nextPlayerHp,
        timeRemainingSec: timeRemainingRef.current,
        phraseCompleted: false,
        phraseFailed: false,
      });
      if (outcome === 'gameOver') {
        finishGameOver('Game Over');
      }
      return;
    }

    setStatusText('もう一度');
    triggerFeedback('miss');
  }, [
    clearFailTimer,
    activeDamageConfig,
    finishGameOver,
    finishStageClear,
    phraseIndex,
    phrases,
    rankRule,
    transitionToNextPhrase,
    triggerFeedback,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  const handleRendererReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    pixiRendererRef.current = renderer;
    if (!renderer) {
      return;
    }
    renderer.updateSettings({
      hitLineY: 0,
      pianoHeight: pianoSize.height,
      viewportHeight: pianoSize.height,
      showHitLine: false,
      noteNameStyle: settings.noteNameStyle,
      simpleDisplayMode: settings.simpleDisplayMode,
      transpose: 0,
      timingAdjustment: 0,
    });
    renderer.setKeyCallbacks(
      (midiNote) => {
        void playNote(midiNote);
        handleNoteInputRef.current(midiNote);
      },
      (midiNote) => {
        void stopNote(midiNote);
      },
    );
  }, [pianoSize.height, settings.noteNameStyle, settings.simpleDisplayMode]);

  useEffect(() => {
    pixiRendererRef.current?.updateSettings({
      pianoHeight: pianoSize.height,
      viewportHeight: pianoSize.height,
      noteNameStyle: settings.noteNameStyle,
      simpleDisplayMode: settings.simpleDisplayMode,
    });
  }, [pianoSize.height, settings.noteNameStyle, settings.simpleDisplayMode]);

  useEffect(() => {
    if (!midiControllerRef.current) {
      midiControllerRef.current = new MIDIController({
        onNoteOn: (note) => handleNoteInputRef.current(note),
        onNoteOff: () => undefined,
        onConnectionChange: connected => setIsMidiConnected(connected),
        playMidiSound: true,
      });
    }

    const controller = midiControllerRef.current;
    controller.setKeyHighlightCallback((note, active) => {
      pixiRendererRef.current?.highlightKey(note, active);
    });
    void controller.initialize().then(async () => {
      if (settings.selectedMidiDevice) {
        const connected = await controller.connectDevice(settings.selectedMidiDevice);
        setIsMidiConnected(connected);
      }
    }).catch(() => setIsMidiConnected(false));

    return () => {
      void controller.destroy();
      midiControllerRef.current = null;
    };
  }, [settings.selectedMidiDevice]);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
    if (!deviceId) {
      midiControllerRef.current?.disconnect();
      setIsMidiConnected(false);
      return;
    }
    void midiControllerRef.current?.connectDevice(deviceId).then(connected => {
      setIsMidiConnected(Boolean(connected));
    });
  }, [updateSettings]);

  const handleAudioTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    const phrase = phrases[phraseIndex];
    if (!audio || !phrase) {
      return;
    }
    const loop = Math.floor(audio.currentTime / Number(phrase.loop_duration_sec)) + 1;
    setActiveLoop(Math.max(1, Math.min(stage.max_loops_per_phrase, loop)));
    const loopTime = audio.currentTime % Number(phrase.loop_duration_sec);
    setActiveChord(getActiveChord(phrase, loopTime));

    const audioDurationSec = Number(phrase.audio_duration_sec);
    if (audio.ended || (Number.isFinite(audioDurationSec) && audio.currentTime >= audioDurationSec - AUDIO_END_EPSILON_SEC)) {
      failCurrentPhrase();
    }
  }, [failCurrentPhrase, phraseIndex, phrases, stage.max_loops_per_phrase]);

  const handleAudioEnded = useCallback(() => {
    failCurrentPhrase();
  }, [failCurrentPhrase]);

  useEffect(() => {
    return () => {
      clearCountdownTimer();
      clearFailTimer();
      clearTimeLimitTimer();
      clearTransitionTimer();
      stopPhraseAudio();
    };
  }, [clearCountdownTimer, clearFailTimer, clearTimeLimitTimer, clearTransitionTimer, stopPhraseAudio]);

  const revealedNotes = attempt?.revealedNotes ?? [];
  const currentNotes = currentPhrase?.notes ?? [];
  const displayedNotes = currentNotes.map((note, index) => (
    <span
      key={note.id}
      className={cn(
        'inline-flex min-w-8 justify-center rounded-lg px-2 py-1 text-lg font-bold',
        index < revealedNotes.length ? 'bg-emerald-400/20 text-emerald-100' : 'bg-slate-900/60 text-slate-400',
      )}
    >
      {index < revealedNotes.length ? revealedNotes[index] : '_'}
    </span>
  ));
  const demoLoopActive = Boolean(currentPhrase?.demo_loops?.some(loop => loop.loop_number === activeLoop));
  const enemyName = enemy?.name ?? 'Random Rival';
  const enemyAvatar = enemy?.avatarUrl ?? DEFAULT_AVATAR_URL;
  const enemyHpPercent = Math.max(0, Math.min(100, (enemyHp / stage.enemy_hp) * 100));
  const playerHpPercent = Math.max(0, Math.min(100, (playerHp / stage.player_hp) * 100));
  const timeLabel = practiceMode ? '∞' : formatTime(timeRemaining);
  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';

  return (
    <div className={cn(
      'flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white',
      feedback === 'miss' && 'bg-red-950',
      feedback === 'clear' && 'bg-white text-slate-950',
    )}>
      <audio ref={audioRef} onEnded={handleAudioEnded} onTimeUpdate={handleAudioTimeUpdate} preload="auto" />

      <header className="grid grid-cols-3 gap-2 border-b border-white/10 bg-black/30 px-3 py-2 text-xs sm:text-sm">
        <div>
          <div className="mb-1 font-semibold">Player HP</div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div className="h-full bg-emerald-400" style={{ width: `${playerHpPercent}%` }} />
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg font-black tabular-nums sm:text-2xl">{timeLabel}</span>
            {practiceMode && (
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-100">
                練習
              </span>
            )}
          </div>
          <div className="text-slate-300">{gameState === 'countIn' ? `Count ${countInValue}` : statusText}</div>
        </div>
        <div>
          <div className="mb-1 text-right font-semibold">Enemy HP</div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-700">
            <div className="ml-auto h-full bg-rose-400" style={{ width: `${enemyHpPercent}%` }} />
          </div>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-rows-[auto_1fr_auto] gap-2 p-2 sm:p-3 lg:grid-cols-[minmax(260px,1fr)_minmax(360px,1.2fr)] lg:grid-rows-[auto_1fr]">
        <section className="rounded-2xl border border-white/10 bg-black/25 p-2 sm:p-3 lg:col-span-2">
          <div ref={chordScrollerRef} className="overflow-x-auto">
            <div className="flex w-max min-w-full items-center justify-center gap-2 whitespace-nowrap">
              {(currentPhrase?.chords ?? []).map(chord => (
                <span
                  key={chord.id}
                  ref={element => {
                    if (element) {
                      chordElementRefs.current.set(chord.id, element);
                      return;
                    }
                    chordElementRefs.current.delete(chord.id);
                  }}
                  className={cn(
                    'shrink-0 rounded-xl border px-3 py-1 text-sm font-bold sm:text-base',
                    activeChord?.id === chord.id
                      ? 'border-amber-300 bg-amber-300 text-slate-950'
                      : 'border-white/10 bg-slate-900/70 text-slate-200',
                  )}
                >
                  {chord.chord_name}
                </span>
              ))}
              {(!currentPhrase?.chords || currentPhrase.chords.length === 0) && (
                <span className="text-sm text-slate-400">コード未設定</span>
              )}
            </div>
          </div>
        </section>

        <section className="relative min-h-0 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-indigo-950/70 p-3">
          <div className="absolute left-3 top-3 rounded-full bg-black/30 px-3 py-1 text-xs text-slate-200">
            Loop {activeLoop}/{stage.max_loops_per_phrase}
          </div>
          {demoLoopActive && (
            <div className="absolute right-4 top-4 animate-pulse rounded-full bg-indigo-400/20 px-4 py-2 text-3xl">
              ♪
            </div>
          )}
          <div className="flex h-full items-center justify-around gap-4 pt-8">
            <div className={cn('flex flex-col items-center gap-2 transition-transform', feedback === 'miss' && 'scale-95')}>
              <img src={DEFAULT_AVATAR_URL} alt="default_avatar" className="h-24 w-24 rounded-full object-contain sm:h-32 sm:w-32" />
              <div className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-bold">default_avatar</div>
            </div>
            <div className="text-center">
              <div className={cn('text-4xl font-black transition-transform', feedback === 'correct' && 'scale-125 text-amber-300')}>
                VS
              </div>
              {lastRank && <div className="mt-2 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">{lastRank}</div>}
            </div>
            <div className={cn('flex flex-col items-center gap-2 transition-transform', feedback === 'correct' && 'scale-95')}>
              <img
                src={enemyAvatar}
                alt={enemyName}
                className="h-24 w-24 rounded-full object-cover sm:h-32 sm:w-32"
                onError={event => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
              />
              <div className="rounded-full bg-rose-500/20 px-3 py-1 text-sm font-bold">{enemyName}</div>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-2xl border border-white/10 bg-black/25 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-400">Phrase</div>
              <div className="font-bold">{phraseIndex + 1} / {Math.max(phrases.length, 1)}</div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setIsSettingsOpen(true)} className="btn btn-sm btn-outline">
                設定
              </button>
              <button type="button" onClick={onBack} className="btn btn-sm btn-ghost">
                戻る
              </button>
            </div>
          </div>
          <div className="grid flex-1 place-items-center">
            <div className="flex max-w-full flex-wrap justify-center gap-2">
              {displayedNotes.length > 0 ? displayedNotes : <span className="text-slate-400">ノート未設定</span>}
            </div>
          </div>
          {(gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver') && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <div className="flex w-full justify-center">
                <div
                  role="group"
                  aria-label="耳コピバトルのプレイモード"
                  className="inline-flex rounded-full border border-white/10 bg-slate-950/70 p-1"
                >
                  <button
                    type="button"
                    onClick={() => setPracticeMode(false)}
                    disabled={!canChangePracticeMode}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-bold transition',
                      !practiceMode ? 'bg-blue-500 text-white' : 'text-slate-300 hover:bg-white/10',
                    )}
                    aria-pressed={!practiceMode}
                  >
                    バトル
                  </button>
                  <button
                    type="button"
                    onClick={() => setPracticeMode(true)}
                    disabled={!canChangePracticeMode}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-bold transition',
                      practiceMode ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/10',
                    )}
                    aria-pressed={practiceMode}
                  >
                    練習
                  </button>
                </div>
              </div>
              {practiceMode && (
                <div className="w-full text-center text-xs text-cyan-100">
                  練習モード中はHPと制限時間が減らず、レッスン進捗は保存されません。
                </div>
              )}
              <button type="button" onClick={startCountIn} className="btn btn-primary">
                {gameState === 'idle' ? '開始' : 'もう一度'}
              </button>
              {lessonContext && gameState === 'stageClear' && (
                <div className="rounded-lg bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
                  {progressSaved ? 'レッスン進捗を保存しました' : 'レッスン進捗を保存中...'}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <div ref={pianoContainerRef} className="h-[118px] shrink-0 border-t border-white/10 bg-slate-950 sm:h-[132px] md:h-[150px]">
        <PIXINotesRenderer
          width={pianoSize.width}
          height={pianoSize.height}
          onReady={handleRendererReady}
          className="h-full w-full"
        />
      </div>

      <EarTrainingSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        midiDeviceId={settings.selectedMidiDevice}
        onMidiDeviceChange={handleMidiDeviceChange}
        isMidiConnected={isMidiConnected}
      />
    </div>
  );
};

export default EarTrainingGameScreen;
