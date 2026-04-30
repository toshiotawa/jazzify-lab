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
import { DEFAULT_AVATAR_URL, EAR_TRAINING_PLAYER_AVATAR_URL } from '@/utils/constants';

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

type BattleEffectKind = 'correct' | 'miss' | 'complete' | 'fail';

interface BattleEffect {
  id: number;
  kind: BattleEffectKind;
  active: boolean;
  label?: string;
  damage?: number;
}

const DEFAULT_PIANO_HEIGHT = 132;
const INPUT_COOLDOWN_MS = 20;
const AUDIO_END_EPSILON_SEC = 0.03;
const BATTLE_EFFECT_DURATION_MS = 720;
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

const getPlayerHpBarClassName = (percent: number): string => {
  if (percent > 50) {
    return 'bg-gradient-to-r from-emerald-500 to-lime-300';
  }
  if (percent > 25) {
    return 'bg-gradient-to-r from-amber-500 to-yellow-300';
  }
  return 'bg-gradient-to-r from-red-600 to-orange-400';
};

const getEnemyHpBarClassName = (percent: number): string => {
  if (percent > 50) {
    return 'bg-gradient-to-l from-rose-500 to-orange-300';
  }
  if (percent > 25) {
    return 'bg-gradient-to-l from-amber-500 to-red-400';
  }
  return 'bg-gradient-to-l from-red-700 to-fuchsia-500';
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
  const [battleEffect, setBattleEffect] = useState<BattleEffect | null>(null);
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
  const battleEffectActivateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const clearBattleEffectTimers = useCallback(() => {
    if (battleEffectActivateTimerRef.current) {
      clearTimeout(battleEffectActivateTimerRef.current);
      battleEffectActivateTimerRef.current = null;
    }
    if (battleEffectClearTimerRef.current) {
      clearTimeout(battleEffectClearTimerRef.current);
      battleEffectClearTimerRef.current = null;
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

  const triggerBattleEffect = useCallback((kind: BattleEffectKind, label?: string, damage?: number) => {
    clearBattleEffectTimers();
    const effectId = Date.now();
    const nextEffect: BattleEffect = { id: effectId, kind, active: false, label, damage };
    setBattleEffect(nextEffect);
    battleEffectActivateTimerRef.current = setTimeout(() => {
      setBattleEffect(current => (current?.id === effectId ? { ...current, active: true } : current));
    }, 16);
    battleEffectClearTimerRef.current = setTimeout(() => {
      setBattleEffect(current => (current?.id === effectId ? null : current));
    }, BATTLE_EFFECT_DURATION_MS);
  }, [clearBattleEffectTimers]);

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
    triggerFeedback('miss');
    triggerBattleEffect('fail', 'FAIL', activeDamageConfig.fail);

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
    transitionTimerRef.current = setTimeout(() => {
      const wrappedIndex = (phraseIndexRef.current + 1) % phrases.length;
      startPhraseRef.current(wrappedIndex);
    }, 900);
  }, [activeDamageConfig.fail, finishGameOver, phrases.length, triggerBattleEffect, triggerFeedback]);

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
    setBattleEffect(null);
    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText('Count In');
    clearCountdownTimer();
    clearBattleEffectTimers();
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
    clearBattleEffectTimers,
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
      triggerBattleEffect('correct', result.revealedNote, result.enemyDamage);

      const outcome = resolveEarTrainingOutcome({
        enemyHp: nextEnemyHp,
        playerHp: playerHpRef.current,
        timeRemainingSec: timeRemainingRef.current,
        phraseCompleted: result.completed,
        phraseFailed: false,
      });

      if (outcome === 'stageClear') {
        const rank = calculateEarTrainingRank(result.attempt.missedNoteIndexes, rankRule);
        if (result.completed) {
          triggerBattleEffect('complete', rank, getCompletionDamage(rank, activeDamageConfig));
        }
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
        triggerBattleEffect('complete', rank, completionDamage);

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
      triggerBattleEffect('miss', 'MISS', result.playerDamage);
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
    triggerBattleEffect('miss', 'MISS');
  }, [
    clearFailTimer,
    activeDamageConfig,
    finishGameOver,
    finishStageClear,
    phraseIndex,
    phrases,
    rankRule,
    transitionToNextPhrase,
    triggerBattleEffect,
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
      clearBattleEffectTimers();
      clearCountdownTimer();
      clearFailTimer();
      clearTimeLimitTimer();
      clearTransitionTimer();
      stopPhraseAudio();
    };
  }, [
    clearBattleEffectTimers,
    clearCountdownTimer,
    clearFailTimer,
    clearTimeLimitTimer,
    clearTransitionTimer,
    stopPhraseAudio,
  ]);

  const revealedNotes = attempt?.revealedNotes ?? [];
  const currentNotes = currentPhrase?.notes ?? [];
  const currentNoteIndex = attempt?.currentNoteIndex ?? 0;
  const displayedNotes = currentNotes.map((note, index) => (
    <span
      key={note.id}
      className={cn(
        'inline-flex h-12 min-w-12 items-center justify-center rounded-2xl border px-3 text-2xl font-black shadow-lg transition sm:h-14 sm:min-w-14 sm:text-3xl',
        index < revealedNotes.length && 'border-emerald-200/60 bg-emerald-400/25 text-emerald-50 shadow-emerald-400/20',
        index >= revealedNotes.length && 'border-white/10 bg-slate-950/80 text-slate-500 shadow-black/30',
        index === currentNoteIndex && gameState === 'playingPhrase' && 'border-cyan-200 bg-cyan-300/20 text-cyan-50 shadow-cyan-300/50 ring-2 ring-cyan-200/70',
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
  const showLobbyControls = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';
  const statusLabel = gameState === 'countIn' ? `Count ${countInValue}` : statusText;
  const playerIsHit = battleEffect?.kind === 'miss' || battleEffect?.kind === 'fail';
  const enemyIsHit = battleEffect?.kind === 'correct' || battleEffect?.kind === 'complete';

  return (
    <div className={cn(
      'flex h-[100dvh] w-full flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white',
      feedback === 'miss' && 'bg-red-950',
      feedback === 'clear' && 'bg-white text-slate-950',
    )}>
      <audio ref={audioRef} onEnded={handleAudioEnded} onTimeUpdate={handleAudioTimeUpdate} preload="auto" />

      <header className="relative z-20 border-b border-white/10 bg-gradient-to-b from-black/70 to-black/25 px-3 py-2 text-xs sm:px-4 sm:text-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <div className="mb-1 flex items-center justify-between gap-2 font-black uppercase tracking-wide text-emerald-100">
              <span>Player</span>
              <span className="tabular-nums">{playerHp}/{stage.player_hp}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-emerald-300/20 bg-slate-950/80 shadow-inner">
              <div
                className={cn('h-full rounded-full transition-all duration-300', getPlayerHpBarClassName(playerHpPercent))}
                style={{ width: `${playerHpPercent}%` }}
              />
            </div>
          </div>

          <div className="min-w-24 text-center sm:min-w-36">
            <div className="flex items-center justify-center gap-2">
              <span className={cn(
                'text-2xl font-black tabular-nums sm:text-3xl',
                !practiceMode && timeRemaining <= 30 && 'text-red-300',
              )}>
                {timeLabel}
              </span>
              {practiceMode && (
                <span className="rounded-full border border-cyan-200/30 bg-cyan-300/20 px-2 py-0.5 text-[10px] font-black text-cyan-100">
                  練習
                </span>
              )}
            </div>
            <div className="truncate text-[11px] font-bold text-slate-300 sm:text-xs">{statusLabel}</div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2 font-black uppercase tracking-wide text-rose-100">
              <span className="tabular-nums">{enemyHp}/{stage.enemy_hp}</span>
              <span>Enemy</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full border border-rose-300/20 bg-slate-950/80 shadow-inner">
              <div
                className={cn('ml-auto h-full rounded-full transition-all duration-300', getEnemyHpBarClassName(enemyHpPercent))}
                style={{ width: `${enemyHpPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden p-2 sm:p-3">
        <div className="absolute right-4 top-4 z-40 flex gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-100 shadow-lg transition hover:bg-white/10"
            aria-label="耳コピバトル設定を開く"
          >
            設定
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-bold text-slate-100 shadow-lg transition hover:bg-white/10"
            aria-label="耳コピステージ選択へ戻る"
          >
            戻る
          </button>
        </div>

        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-cyan-200/10 bg-[radial-gradient(circle_at_50%_20%,rgba(56,189,248,0.22),transparent_32%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,27,75,0.9),rgba(76,29,149,0.76))] shadow-2xl shadow-indigo-950/50">
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] opacity-25" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />

          <div className="relative z-10 border-b border-white/10 bg-black/20 px-3 py-2 sm:px-4">
            <div ref={chordScrollerRef} className="custom-game-scrollbar overflow-x-auto">
              <div className="flex w-max min-w-full items-center justify-center gap-2 whitespace-nowrap pr-24">
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
                      'shrink-0 rounded-xl border px-3 py-1 text-sm font-black shadow-lg transition sm:px-4 sm:text-base',
                      activeChord?.id === chord.id
                        ? 'border-amber-200 bg-amber-300 text-slate-950 shadow-amber-300/30'
                        : 'border-white/10 bg-slate-950/70 text-slate-200',
                    )}
                  >
                    {chord.chord_name}
                  </span>
                ))}
                {(!currentPhrase?.chords || currentPhrase.chords.length === 0) && (
                  <span className="text-sm font-bold text-slate-400">コード未設定</span>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 min-h-0 flex-1">
            <div className="absolute left-3 top-3 z-20 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs font-bold text-slate-200">
              Phrase {phraseIndex + 1}/{Math.max(phrases.length, 1)} ・ Loop {activeLoop}/{stage.max_loops_per_phrase}
            </div>

            {demoLoopActive && (
              <div className="absolute right-5 top-14 z-20 animate-pulse rounded-full border border-indigo-200/30 bg-indigo-400/20 px-4 py-2 text-3xl shadow-lg shadow-indigo-400/20">
                ♪
              </div>
            )}

            <div className="pointer-events-none absolute left-1/2 top-[38%] z-10 h-24 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-200/40 to-transparent" />
            <div className="pointer-events-none absolute left-1/2 top-[42%] z-10 -translate-x-1/2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-4 py-1 text-xs font-black uppercase tracking-[0.35em] text-cyan-100/80">
              Listen ・ Strike
            </div>

            <div className="absolute inset-x-0 bottom-[27%] top-12 z-10 flex items-center justify-between px-4 sm:px-8 lg:px-16">
              <div className={cn(
                'flex w-[42%] max-w-xs flex-col items-center gap-2 transition-all duration-200 ease-out',
                playerIsHit && battleEffect?.active && '-translate-x-4 scale-95',
              )}>
                <div className={cn(
                  'rounded-full border border-emerald-200/30 bg-emerald-300/10 p-2 shadow-2xl shadow-emerald-500/15 transition',
                  playerIsHit && battleEffect?.active && 'bg-red-500/40 shadow-red-500/40',
                )}>
                  <img
                    src={EAR_TRAINING_PLAYER_AVATAR_URL}
                    alt="あなた"
                    className="h-28 w-28 rounded-full object-contain sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52"
                  />
                </div>
                <div className="rounded-full border border-emerald-200/20 bg-black/45 px-3 py-1 text-xs font-black text-emerald-50 sm:text-sm">
                  あなた
                </div>
              </div>

              <div className={cn(
                'flex w-[42%] max-w-xs flex-col items-center gap-2 transition-all duration-200 ease-out',
                enemyIsHit && battleEffect?.active && 'translate-x-5 scale-95',
                (battleEffect?.kind === 'miss' || battleEffect?.kind === 'fail') && battleEffect.active && '-translate-x-8 scale-105',
              )}>
                <div className={cn(
                  'rounded-full border border-rose-200/30 bg-rose-300/10 p-2 shadow-2xl shadow-rose-500/15 transition',
                  enemyIsHit && battleEffect?.active && 'bg-amber-300/35 shadow-amber-300/40',
                )}>
                  <img
                    src={enemyAvatar}
                    alt={enemyName}
                    className="h-28 w-28 rounded-full object-cover sm:h-36 sm:w-36 md:h-44 md:w-44 lg:h-52 lg:w-52"
                    onError={event => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = DEFAULT_AVATAR_URL;
                    }}
                  />
                </div>
                <div className="max-w-full truncate rounded-full border border-rose-200/20 bg-black/45 px-3 py-1 text-xs font-black text-rose-50 sm:text-sm">
                  {enemyName}
                </div>
              </div>
            </div>

            {battleEffect?.kind === 'correct' && (
              <div
                key={`${battleEffect.id}-correct`}
                className={cn(
                  'absolute left-[45%] top-[56%] z-30 grid h-9 min-w-9 place-items-center rounded-full bg-cyan-200 px-2 text-sm font-black text-slate-950 shadow-[0_0_22px_rgba(103,232,249,0.9)] transition-all duration-500 ease-out',
                  battleEffect.active ? 'translate-x-[30vw] -translate-y-16 scale-50 opacity-0' : 'translate-x-0 translate-y-0 scale-100 opacity-100',
                )}
              >
                {battleEffect.label ?? '♪'}
              </div>
            )}

            {battleEffect?.kind === 'complete' && (
              <div
                key={`${battleEffect.id}-complete`}
                className={cn(
                  'absolute left-[24%] top-[45%] z-30 h-5 w-24 rounded-full bg-gradient-to-r from-emerald-200 via-cyan-200 to-white shadow-[0_0_32px_rgba(110,231,183,0.9)] transition-all duration-700 ease-out',
                  battleEffect.active ? 'translate-x-[52vw] scale-x-150 opacity-0' : 'translate-x-0 scale-x-100 opacity-100',
                )}
              />
            )}

            {(battleEffect?.kind === 'miss' || battleEffect?.kind === 'fail') && (
              <div
                key={`${battleEffect.id}-enemy-attack`}
                className={cn(
                  'absolute right-[24%] top-[46%] z-30 rounded-full bg-gradient-to-l from-red-300 via-fuchsia-300 to-white text-slate-950 shadow-[0_0_30px_rgba(248,113,113,0.9)] transition-all ease-out',
                  battleEffect.kind === 'fail' ? 'h-8 w-28 duration-700' : 'h-5 w-16 duration-500',
                  battleEffect.active ? '-translate-x-[52vw] scale-x-150 opacity-0' : 'translate-x-0 scale-x-100 opacity-100',
                )}
              />
            )}

            {battleEffect && battleEffect.damage !== undefined && battleEffect.damage > 0 && (
              <div
                key={`${battleEffect.id}-damage`}
                className={cn(
                  'absolute z-40 rounded-full border bg-black/60 px-3 py-1 text-lg font-black tabular-nums transition-all duration-700',
                  enemyIsHit ? 'right-[18%] top-[30%] border-amber-200/40 text-amber-100' : 'left-[18%] top-[30%] border-red-200/40 text-red-100',
                  battleEffect.active ? '-translate-y-10 opacity-0' : 'translate-y-0 opacity-100',
                )}
              >
                -{battleEffect.damage}
              </div>
            )}

            {lastRank && !showLobbyControls && (
              <div className="absolute left-1/2 top-20 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/45 px-4 py-1 text-sm font-black text-amber-100 shadow-lg">
                {lastRank}
              </div>
            )}

            <div className="absolute inset-x-3 bottom-3 z-20 rounded-3xl border border-white/10 bg-slate-950/65 p-3 shadow-2xl backdrop-blur sm:inset-x-8 sm:p-4">
              <div className="mb-2 text-center text-[11px] font-black uppercase tracking-[0.28em] text-cyan-100/80">
                Phrase Slots
              </div>
              <div className="flex max-h-24 max-w-full flex-wrap justify-center gap-2 overflow-y-auto">
                {displayedNotes.length > 0 ? displayedNotes : <span className="text-sm font-bold text-slate-400">ノート未設定</span>}
              </div>
            </div>

            {gameState === 'countIn' && (
              <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-black/20">
                <div className="rounded-full border border-cyan-200/40 bg-cyan-300/20 px-10 py-6 text-6xl font-black text-cyan-50 shadow-2xl shadow-cyan-300/30">
                  {countInValue}
                </div>
              </div>
            )}

            {showLobbyControls && (
              <div className="absolute inset-0 z-30 grid place-items-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-center shadow-2xl shadow-black/40">
                  <div className="text-xs font-black uppercase tracking-[0.35em] text-cyan-100/70">
                    Ear Copy Battle
                  </div>
                  <div className="mt-2 text-xl font-black text-white sm:text-2xl">{statusText}</div>
                  {lastRank && (
                    <div className="mt-3 inline-flex rounded-full border border-amber-200/40 bg-amber-300/15 px-4 py-1 text-sm font-black text-amber-100">
                      Rank {lastRank}
                    </div>
                  )}

                  <div className="mt-5 flex justify-center">
                    <div
                      role="group"
                      aria-label="耳コピバトルのプレイモード"
                      className="inline-flex rounded-full border border-white/10 bg-black/50 p-1"
                    >
                      <button
                        type="button"
                        onClick={() => setPracticeMode(false)}
                        disabled={!canChangePracticeMode}
                        className={cn(
                          'rounded-full px-4 py-1.5 text-sm font-black transition',
                          !practiceMode ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'text-slate-300 hover:bg-white/10',
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
                          'rounded-full px-4 py-1.5 text-sm font-black transition',
                          practiceMode ? 'bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-300/30' : 'text-slate-300 hover:bg-white/10',
                        )}
                        aria-pressed={practiceMode}
                      >
                        練習
                      </button>
                    </div>
                  </div>

                  {practiceMode && (
                    <div className="mt-3 text-xs font-bold text-cyan-100">
                      練習モード中はHPと制限時間が減らず、レッスン進捗は保存されません。
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={startCountIn}
                    className="mt-5 rounded-2xl bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 px-10 py-4 text-2xl font-black tracking-[0.18em] text-slate-950 shadow-2xl shadow-orange-500/30 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-100"
                  >
                    {startButtonLabel}
                  </button>

                  {lessonContext && gameState === 'stageClear' && (
                    <div className="mt-4 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-bold text-emerald-100">
                      {progressSaved ? 'レッスン進捗を保存しました' : 'レッスン進捗を保存中...'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <div ref={pianoContainerRef} className="h-[106px] shrink-0 border-t border-white/10 bg-slate-950 sm:h-[124px] md:h-[136px]">
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
