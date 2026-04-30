import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingPhaserGame from './EarTrainingPhaserGame';
import EarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';
import type {
  ClearConditions,
  EarTrainingGameState,
  EarTrainingPhrase,
  EarTrainingPhraseAttempt,
  EarTrainingPhraseChord,
  EarTrainingPhraseNote,
  EarTrainingRank,
  EarTrainingStage,
} from '@/types';
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import type {
  EarTrainingBattleEffectCommand,
  EarTrainingBattleEffectKind,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import {
  MIDIController,
  initializeAudioSystem,
  markAudioUserInteraction,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import {
  calculateEarTrainingRank,
  createPhraseAttempt,
  getCompletionDamage,
  getDisplayNoteName,
  getNextMeasureDelaySec,
  handleEarTrainingNoteInput,
  mapEarTrainingRankToLessonRank,
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';
import {
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';

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

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
const AUDIO_END_EPSILON_SEC = 0.03;
const BATTLE_EFFECT_DURATION_MS = 720;
const ATTACK_GAUGE_TARGET_LOOPS = 6;
const NO_DAMAGE_CONFIG = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const clampRatio = (value: number): number => Math.min(1, Math.max(0, value));

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

const getPhraseNoteTimeSec = (note: EarTrainingPhraseNote, stage: EarTrainingStage): number | null => {
  if (note.measure_number === null || note.measure_number === undefined) {
    return null;
  }
  if (note.beat_offset === null || note.beat_offset === undefined) {
    return null;
  }

  const beatDurationSec = 60 / stage.bpm;
  const measureIndex = Math.max(0, note.measure_number - 1);
  const beatOffset = Math.max(0, note.beat_offset);
  return (measureIndex * stage.beats_per_measure + beatOffset) * beatDurationSec;
};

const getPhraseDemoWindow = (
  phrase: EarTrainingPhrase,
  stage: EarTrainingStage,
): { startSec: number; endSec: number } | null => {
  const noteTimes = (phrase.notes ?? [])
    .map(note => getPhraseNoteTimeSec(note, stage))
    .filter((time): time is number => time !== null && Number.isFinite(time));

  if (noteTimes.length === 0) {
    return null;
  }

  const startSec = Math.min(...noteTimes);
  const lastNoteStartSec = Math.max(...noteTimes);
  const beatDurationSec = 60 / stage.bpm;
  const loopDurationSec = Number(phrase.loop_duration_sec);
  const fallbackEndSec = lastNoteStartSec + beatDurationSec;
  const endSec = Number.isFinite(loopDurationSec)
    ? Math.min(loopDurationSec, fallbackEndSec)
    : fallbackEndSec;

  return {
    startSec,
    endSec: Math.max(startSec, endSec),
  };
};

const isPhraseDemoLoopActive = (phrase: EarTrainingPhrase, loopNumber: number): boolean => (
  Boolean(phrase.demo_loops?.some(loop => loop.loop_number === loopNumber))
);

const shouldShowDemoBubble = (
  phrase: EarTrainingPhrase,
  stage: EarTrainingStage,
  loopNumber: number,
  loopTimeSec: number,
): boolean => {
  if (!isPhraseDemoLoopActive(phrase, loopNumber)) {
    return false;
  }

  const demoWindow = getPhraseDemoWindow(phrase, stage);
  if (!demoWindow) {
    return true;
  }

  return loopTimeSec >= demoWindow.startSec && loopTimeSec <= demoWindow.endSec;
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
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);
  const [enemyAttackGaugePercent, setEnemyAttackGaugePercent] = useState(0);
  const [demoBubbleVisible, setDemoBubbleVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const startPhraseRef = useRef<(nextPhraseIndex: number) => void>(() => undefined);
  const attemptRef = useRef<EarTrainingPhraseAttempt | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const phraseIndexRef = useRef(0);
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const timeRemainingRef = useRef(stage.time_limit_sec);
  const audioPrimeTokenRef = useRef(0);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);

  const currentPhrase = phrases[phraseIndex];

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
    audioPrimeTokenRef.current += 1;
    audio.muted = false;
    audio.pause();
    audio.currentTime = 0;
  }, []);

  const triggerFeedback = useCallback((value: 'correct' | 'miss' | 'clear') => {
    setFeedback(value);
    setTimeout(() => setFeedback(null), 220);
  }, []);

  const triggerBattleEffect = useCallback((
    kind: EarTrainingBattleEffectKind,
    label?: string,
    damage?: number,
    phraseNoteCount?: number,
  ): number => {
    clearBattleEffectTimers();
    battleEffectIdRef.current += 1;
    const effectId = battleEffectIdRef.current;
    setBattleEffectCommand({ id: effectId, kind, label, damage, phraseNoteCount });
    battleEffectClearTimerRef.current = setTimeout(() => {
      setBattleEffectCommand(current => (current?.id === effectId ? null : current));
    }, BATTLE_EFFECT_DURATION_MS);
    return effectId;
  }, [clearBattleEffectTimers]);

  const registerBattleEffectImpact = useCallback((effectId: number, handler: PendingImpactHandler) => {
    pendingImpactHandlersRef.current.set(effectId, handler);
  }, []);

  const handleBattleEffectImpact = useCallback((effectId: number) => {
    const handler = pendingImpactHandlersRef.current.get(effectId);
    if (!handler) {
      return;
    }
    pendingImpactHandlersRef.current.delete(effectId);
    handler();
  }, []);

  const finishStageClear = useCallback(async (rank: EarTrainingRank) => {
    pendingImpactHandlersRef.current.clear();
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
    pendingImpactHandlersRef.current.clear();
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
    setAttempt({ ...currentAttempt, failed: true });
    setLastRank('Fail');
    setEnemyAttackGaugePercent(1);
    triggerFeedback('miss');
    const effectId = triggerBattleEffect('fail', 'Fail', activeDamageConfig.fail);
    registerBattleEffectImpact(effectId, () => {
      const nextPlayerHp = Math.max(0, playerHpRef.current - activeDamageConfig.fail);
      setPlayerHp(nextPlayerHp);
      playerHpRef.current = nextPlayerHp;

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
    });
  }, [
    activeDamageConfig.fail,
    finishGameOver,
    phrases.length,
    registerBattleEffectImpact,
    triggerBattleEffect,
    triggerFeedback,
  ]);

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
    setEnemyAttackGaugePercent(0);
    setDemoBubbleVisible(shouldShowDemoBubble(phrase, stage, 1, 0));
    setActiveChord(getActiveChord(phrase, 0));
    setStatusText(`Phrase ${nextPhraseIndex + 1}`);
    gameStateRef.current = 'playingPhrase';
    setGameState('playingPhrase');

    const audio = audioRef.current;
    if (audio) {
      audioPrimeTokenRef.current += 1;
      audio.pause();
      audio.src = phrase.audio_url;
      audio.currentTime = 0;
      audio.muted = false;
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
    stage,
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
          finishGameOver('Time Over');
        }
        return next;
      });
    }, 1000);
  }, [clearTimeLimitTimer, finishGameOver, practiceMode]);

  const primePhraseAudio = useCallback((phrase: EarTrainingPhrase | undefined) => {
    const audio = audioRef.current;
    if (!audio || !phrase) {
      return;
    }

    audioPrimeTokenRef.current += 1;
    const token = audioPrimeTokenRef.current;
    audio.pause();
    audio.src = phrase.audio_url;
    audio.currentTime = 0;
    audio.muted = true;
    audio.volume = 0;

    void audio.play()
      .then(() => {
        if (audioPrimeTokenRef.current !== token || gameStateRef.current === 'playingPhrase') {
          return;
        }
        audio.pause();
        audio.currentTime = 0;
      })
      .catch(() => undefined)
      .finally(() => {
        if (audioPrimeTokenRef.current !== token || gameStateRef.current === 'playingPhrase') {
          return;
        }
        audio.muted = false;
        audio.volume = settings.musicVolume * settings.masterVolume;
      });
  }, [settings.masterVolume, settings.musicVolume]);

  const startCountIn = useCallback(() => {
    if (phrases.length === 0) {
      finishGameOver('フレーズが登録されていません');
      return;
    }

    markAudioUserInteraction();
    void initializeAudioSystem().catch(() => undefined);
    primePhraseAudio(phrases[0]);
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    setTimeRemaining(stage.time_limit_sec);
    setPhraseIndex(0);
    setCountInValue(stage.count_in_beats);
    setBattleEffectCommand(null);
    pendingImpactHandlersRef.current.clear();
    setEnemyAttackGaugePercent(0);
    setDemoBubbleVisible(false);
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
    primePhraseAudio,
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
      setStatusText(result.revealedNote ? `正解: ${result.revealedNote}` : '正解');
      triggerFeedback('correct');
      if (result.completed) {
        gameStateRef.current = 'phraseComplete';
        setGameState('phraseComplete');
        clearFailTimer();
        const rank = calculateEarTrainingRank(result.attempt.missedNoteCounts, rankRule);
        const completionDamage = getCompletionDamage(rank, activeDamageConfig);
        const totalCompletionDamage = result.enemyDamage + completionDamage;
        triggerBattleEffect(
          'complete',
          rank,
          totalCompletionDamage,
          phrase.notes?.length ?? 0,
        );
        const enemyHpAfterCompletion = Math.max(0, enemyHpRef.current - totalCompletionDamage);
        setEnemyHp(enemyHpAfterCompletion);
        enemyHpRef.current = enemyHpAfterCompletion;

        const outcome = resolveEarTrainingOutcome({
          enemyHp: enemyHpAfterCompletion,
          playerHp: playerHpRef.current,
          timeRemainingSec: timeRemainingRef.current,
          phraseCompleted: true,
          phraseFailed: false,
        });

        if (outcome === 'stageClear') {
          void finishStageClear(rank);
          return;
        }

        if (outcome === 'phraseComplete') {
          transitionToNextPhrase(rank, phrase);
        }
        return;
      }

      const correctEffectId = triggerBattleEffect('correct', undefined, result.enemyDamage);
      registerBattleEffectImpact(correctEffectId, () => {
        const nextEnemyHp = Math.max(0, enemyHpRef.current - result.enemyDamage);
        setEnemyHp(nextEnemyHp);
        enemyHpRef.current = nextEnemyHp;

        const outcome = resolveEarTrainingOutcome({
          enemyHp: nextEnemyHp,
          playerHp: playerHpRef.current,
          timeRemainingSec: timeRemainingRef.current,
          phraseCompleted: false,
          phraseFailed: false,
        });

        if (outcome === 'stageClear') {
          const rank = calculateEarTrainingRank(result.attempt.missedNoteCounts, rankRule);
          void finishStageClear(rank);
        }
      });
      return;
    }

    if (result.playerDamage > 0) {
      triggerFeedback('miss');
      const missEffectId = triggerBattleEffect('miss', 'MISS', result.playerDamage);
      setStatusText('ミス: 敵の攻撃');
      registerBattleEffectImpact(missEffectId, () => {
        const nextPlayerHp = Math.max(0, playerHpRef.current - result.playerDamage);
        setPlayerHp(nextPlayerHp);
        playerHpRef.current = nextPlayerHp;

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
      });
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
    registerBattleEffectImpact,
    transitionToNextPhrase,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

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
      pianoOverlayRef.current?.highlightKey(note, active);
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

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

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
    setDemoBubbleVisible(shouldShowDemoBubble(phrase, stage, loop, loopTime));
    const loopDurationSec = Number(phrase.loop_duration_sec);
    const gaugeDurationSec = loopDurationSec * ATTACK_GAUGE_TARGET_LOOPS;
    setEnemyAttackGaugePercent(
      Number.isFinite(gaugeDurationSec) && gaugeDurationSec > 0
        ? clampRatio(audio.currentTime / gaugeDurationSec)
        : 0,
    );

    const audioDurationSec = Number(phrase.audio_duration_sec);
    if (audio.ended || (Number.isFinite(audioDurationSec) && audio.currentTime >= audioDurationSec - AUDIO_END_EPSILON_SEC)) {
      failCurrentPhrase();
    }
  }, [failCurrentPhrase, phraseIndex, phrases, stage]);

  const handleAudioEnded = useCallback(() => {
    failCurrentPhrase();
  }, [failCurrentPhrase]);

  useEffect(() => {
    return () => {
      pendingImpactHandlersRef.current.clear();
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
  const demoLoopActive = gameState === 'playingPhrase' && demoBubbleVisible;
  const enemyName = enemy?.name ?? 'Random Rival';
  const enemyAvatar = useMemo(() => {
    const source = `${stage.id}:${enemy?.id ?? enemy?.name ?? 'enemy'}`;
    let hash = 0;
    for (let index = 0; index < source.length; index += 1) {
      hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0;
    }
    const avatarIndex = Math.abs(hash) % EAR_TRAINING_ENEMY_AVATAR_URLS.length;
    return EAR_TRAINING_ENEMY_AVATAR_URLS[avatarIndex] ?? DEFAULT_AVATAR_URL;
  }, [enemy?.id, enemy?.name, stage.id]);
  const enemyAvatarFlipX = EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS.has(enemyAvatar);
  const timeLabel = practiceMode ? '∞' : formatTime(timeRemaining);
  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const showLobbyControls = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';
  const stageStatusText = gameState === 'countIn' ? `Count ${countInValue}` : statusText;
  const resultState = gameState === 'stageClear'
    ? 'win'
    : gameState === 'gameOver'
      ? statusText === 'Time Over' ? 'timeOver' : 'lose'
      : null;
  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? progressSaved ? 'レッスン進捗を保存しました' : 'レッスン進捗を保存中...'
    : null;
  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => ({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    timeLabel,
    practiceMode,
    isMidiConnected,
    playerHp,
    playerMaxHp: stage.player_hp,
    enemyHp,
    enemyMaxHp: stage.enemy_hp,
    enemyName,
    enemyAvatarUrl: enemyAvatar,
    enemyAvatarFlipX,
    playerAvatarUrl: EAR_TRAINING_PLAYER_AVATAR_URL,
    phraseIndex,
    totalPhrases: phrases.length,
    activeLoop,
    maxLoops: stage.max_loops_per_phrase,
    demoLoopActive,
    enemyAttackGaugePercent,
    chords: (currentPhrase?.chords ?? []).map(chord => ({
      id: chord.id,
      name: chord.chord_name,
      active: activeChord?.id === chord.id,
    })),
    phraseSlots: currentNotes.map(note => getDisplayNoteName(note)),
    revealedNotes,
    currentNoteIndex,
    countInValue,
    lastRank,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
  }), [
    activeChord?.id,
    activeLoop,
    canChangePracticeMode,
    countInValue,
    currentNoteIndex,
    currentNotes,
    currentPhrase?.chords,
    demoLoopActive,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyAttackGaugePercent,
    enemyHp,
    enemyName,
    gameState,
    isMidiConnected,
    lastRank,
    lessonProgressText,
    phraseIndex,
    phrases.length,
    playerHp,
    practiceMode,
    revealedNotes,
    resultState,
    showLobbyControls,
    stage.enemy_hp,
    stage.max_loops_per_phrase,
    stage.player_hp,
    stage.title,
    stageStatusText,
    startButtonLabel,
    timeLabel,
  ]);
  const battleCallbacks = useMemo(() => ({
    onStart: startCountIn,
    onBack,
    onOpenSettings: () => setIsSettingsOpen(true),
    onPracticeModeChange: (nextPracticeMode: boolean) => {
      if (canChangePracticeMode) {
        setPracticeMode(nextPracticeMode);
      }
    },
    onPianoKeyDown: handlePianoKeyDown,
    onPianoKeyUp: handlePianoKeyUp,
    onEffectImpact: handleBattleEffectImpact,
  }), [
    canChangePracticeMode,
    handleBattleEffectImpact,
    handlePianoKeyDown,
    handlePianoKeyUp,
    onBack,
    startCountIn,
  ]);

  return (
    <div className={cn(
      'relative h-[100dvh] w-full overflow-hidden bg-slate-950 text-white',
      feedback === 'miss' && 'bg-red-950',
      feedback === 'clear' && 'bg-white text-slate-950',
    )}>
      <audio ref={audioRef} onEnded={handleAudioEnded} onTimeUpdate={handleAudioTimeUpdate} preload="auto" />

      <EarTrainingPhaserGame
        ref={phaserGameRef}
        snapshot={battleSnapshot}
        effectCommand={battleEffectCommand}
        callbacks={battleCallbacks}
        className="h-full w-full"
      />

      <EarTrainingPianoOverlay
        ref={pianoOverlayRef}
        onPianoKeyDown={handlePianoKeyDown}
        onPianoKeyUp={handlePianoKeyUp}
      />

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
