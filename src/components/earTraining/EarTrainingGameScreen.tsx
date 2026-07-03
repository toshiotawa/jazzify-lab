import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuestCompleteJingleOnStageClear, useGameOverJingleOnGameOver } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingBattleRenderer from './EarTrainingBattleRenderer';
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
import type { EarTrainingBattleEnemy } from '@/utils/earTrainingBattleAvatar';
import type {
  EarTrainingBattleEffectCommand,
  EarTrainingBattleEffectKind,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import {
  markAudioUserInteraction,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import type { GameMidiBindings } from '@/hooks/useGameMidiSession';
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import {
  calculateEarTrainingRank,
  createPhraseAttempt,
  getCompletionDamage,
  getDisplayNoteName,
  getNextMeasureDelaySec,
  getNextPhraseIndex,
  handleEarTrainingNoteInput,
  mapEarTrainingRankToLessonRank,
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';
import {
  formatEarTrainingCountInDisplay,
  formatEarTrainingPhraseIntroLine,
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingGameScreenProps {
  stage: EarTrainingStage;
  enemy: EarTrainingBattleEnemy | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
  earMidi: GameMidiBindings;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
const AUDIO_END_EPSILON_SEC = 0.03;
const BATTLE_EFFECT_DURATION_MS = 720;
const ATTACK_GAUGE_TARGET_LOOPS = 6;
const ENEMY_ATTACK_GAUGE_STEP = 0.02;
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

const quantizeAttackGaugePercent = (value: number): number => (
  Math.round(clampRatio(value) / ENEMY_ATTACK_GAUGE_STEP) * ENEMY_ATTACK_GAUGE_STEP
);

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
  onPracticeModeRestartFromSettings,
  earMidi,
}) => {
  const { settings, updateSettings } = useGameStore();
  const { profile } = useAuthStore(state => ({ profile: state.profile }));
  const geoCountry = useGeoStore(state => state.country);
  const audienceContext = useMemo(
    () => ({
      rank: profile?.rank,
      country: profile?.country ?? geoCountry,
      preferredLocale: profile?.preferred_locale,
    }),
    [profile?.rank, profile?.country, profile?.preferred_locale, geoCountry],
  );
  const isEnglishCopy = shouldUseEnglishCopy(audienceContext);
  const copy = useMemo(() => getEarTrainingGameCopy(isEnglishCopy), [isEnglishCopy]);
  const hudLabels = useMemo(() => getEarTrainingBattleHudLabels(isEnglishCopy), [isEnglishCopy]);
  const [statusText, setStatusText] = useState(copy.idlePrompt);
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

  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [attempt, setAttempt] = useState<EarTrainingPhraseAttempt | null>(null);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [timeRemaining, setTimeRemaining] = useState(stage.time_limit_sec);
  const [countInValue, setCountInValue] = useState(stage.count_in_beats);
  const [activeLoop, setActiveLoop] = useState(1);
  const [activeChord, setActiveChord] = useState<EarTrainingPhraseChord | null>(null);
  const [lastRank, setLastRank] = useState<EarTrainingRank | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);
  const [demoBubbleVisible, setDemoBubbleVisible] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  const enemyAttackGaugePercentRef = useRef(0);
  const activeLoopRef = useRef(1);
  const activeChordIdRef = useRef<string | null>(null);
  const demoBubbleVisibleRef = useRef(false);

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
    if (gameState === 'idle') {
      setStatusText(copy.idlePrompt);
    }
  }, [copy.idlePrompt, gameState]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

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

  const setEnemyAttackGaugePercent = useCallback((value: number) => {
    const next = quantizeAttackGaugePercent(value);
    if (Math.abs(next - enemyAttackGaugePercentRef.current) < 0.0001) {
      return;
    }
    enemyAttackGaugePercentRef.current = next;
    phaserGameRef.current?.setEnemyAttackGaugePercent(next);
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
    setStatusText(copy.stageClear);
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
    copy,
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
        finishGameOver(copy.gameOver);
        return;
      }

      setGameState('phraseFail');
      setStatusText(copy.failAdvance);
      clearTransitionTimer();
      transitionTimerRef.current = setTimeout(() => {
        const wrappedIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
        startPhraseRef.current(wrappedIndex);
      }, 900);
    });
  }, [
    activeDamageConfig.fail,
    clearTransitionTimer,
    copy,
    finishGameOver,
    phrases.length,
    registerBattleEffectImpact,
    setEnemyAttackGaugePercent,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  const startPhrase = useCallback((nextPhraseIndex: number) => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver(copy.noPhrases);
      return;
    }

    clearFailTimer();
    clearTransitionTimer();
    setPhraseIndex(nextPhraseIndex);
    phraseIndexRef.current = nextPhraseIndex;
    setPhraseRunId(current => current + 1);
    setPhraseIntroSeq(current => current + 1);
    const nextAttempt = createPhraseAttempt(phrase);
    setAttempt(nextAttempt);
    setLastRank(null);
    setActiveLoop(1);
    setEnemyAttackGaugePercent(0);
    setDemoBubbleVisible(shouldShowDemoBubble(phrase, stage, 1, 0));
    setActiveChord(getActiveChord(phrase, 0));
    setStatusText(copy.phraseLabel(nextPhraseIndex + 1));
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
        setStatusText(copy.audioFailed);
      });
    }
  }, [
    clearFailTimer,
    clearTransitionTimer,
    copy,
    finishGameOver,
    phrases,
    setEnemyAttackGaugePercent,
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
          finishGameOver(copy.timeOver);
        }
        return next;
      });
    }, 1000);
  }, [clearTimeLimitTimer, copy, finishGameOver, practiceMode]);

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
      finishGameOver(copy.noPhrases);
      return;
    }

    markAudioUserInteraction();
    void ensureBattlePianoAudio({
      midiVolume: settings.midiVolume,
      soundEffectVolume: settings.soundEffectVolume,
      rootSoundVolume: settings.rootSoundVolume,
    }).catch(() => undefined);
    primePhraseAudio(phrases[0]);
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    setTimeRemaining(stage.time_limit_sec);
    setPhraseIndex(0);
    setPhraseRunId(0);
    setPhraseIntroSeq(0);
    setCountInValue(stage.count_in_beats);
    setBattleEffectCommand(null);
    pendingImpactHandlersRef.current.clear();
    setEnemyAttackGaugePercent(0);
    setDemoBubbleVisible(false);
    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText(copy.countIn);
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
    copy,
    finishGameOver,
    phrases.length,
    primePhraseAudio,
    setEnemyAttackGaugePercent,
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
    clearTransitionTimer();
    const delaySec = getNextMeasureDelaySec(
      audioRef.current?.currentTime ?? 0,
      Number(phrase.loop_duration_sec),
      stage.loop_measures,
    );
    gameStateRef.current = 'phraseComplete';
    setGameState('phraseComplete');
    setLastRank(rank);
    setStatusText(copy.transitionNextBar(rank));

    transitionTimerRef.current = setTimeout(() => {
      transitionTimerRef.current = null;
      stopPhraseAudio();
      gameStateRef.current = 'transitionToNextPhrase';
      setGameState('transitionToNextPhrase');
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        const nextIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
        startPhraseRef.current(nextIndex);
      }, 420);
    }, delaySec * 1000);
  }, [clearTransitionTimer, copy, phrases.length, stage.loop_measures, stopPhraseAudio]);

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
      setStatusText(copy.correct(result.revealedNote));
      triggerFeedback('correct');
      if (result.completed) {
        gameStateRef.current = 'phraseComplete';
        setGameState('phraseComplete');
        clearFailTimer();
        const rank = calculateEarTrainingRank(result.attempt.missedNoteCounts, rankRule);
        const completionDamage = getCompletionDamage(rank, activeDamageConfig);
        const totalCompletionDamage = result.enemyDamage + completionDamage;
        const completeEffectId = triggerBattleEffect(
          'complete',
          rank,
          totalCompletionDamage,
          phrase.notes?.length ?? 0,
        );
        const willStageClear = enemyHpRef.current - totalCompletionDamage <= 0;
        registerBattleEffectImpact(completeEffectId, () => {
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
          }
        });

        if (!willStageClear) {
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
      setStatusText(copy.missEnemyAttack);
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
          finishGameOver(copy.gameOver);
        }
      });
      return;
    }

    setStatusText(copy.tryAgain);
    triggerFeedback('miss');
  }, [
    clearFailTimer,
    activeDamageConfig,
    copy,
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
    return earMidi.registerNoteHandler((note) => {
      handleNoteInputRef.current(note);
    });
  }, [earMidi]);

  useEffect(() => {
    return earMidi.registerKeyHighlightHandler((note, active) => {
      pianoOverlayRef.current?.highlightKey(note, active);
    });
  }, [earMidi]);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
  }, [updateSettings]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
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
    const nextLoop = Math.max(1, Math.min(stage.max_loops_per_phrase, loop));
    if (nextLoop !== activeLoopRef.current) {
      activeLoopRef.current = nextLoop;
      setActiveLoop(nextLoop);
    }
    const loopTime = audio.currentTime % Number(phrase.loop_duration_sec);
    const nextChord = getActiveChord(phrase, loopTime);
    const nextChordId = nextChord?.id ?? null;
    if (nextChordId !== activeChordIdRef.current) {
      activeChordIdRef.current = nextChordId;
      setActiveChord(nextChord);
    }
    const nextDemoVisible = shouldShowDemoBubble(phrase, stage, nextLoop, loopTime);
    if (nextDemoVisible !== demoBubbleVisibleRef.current) {
      demoBubbleVisibleRef.current = nextDemoVisible;
      setDemoBubbleVisible(nextDemoVisible);
    }
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
  }, [failCurrentPhrase, phraseIndex, phrases, setEnemyAttackGaugePercent, stage]);

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
  const stageStatusText = gameState === 'countIn'
    ? formatEarTrainingCountInDisplay(isEnglishCopy, countInValue)
    : statusText;
  const resultState = gameState === 'stageClear'
    ? 'win'
    : gameState === 'gameOver'
      ? statusText === copy.timeOver ? 'timeOver' : 'lose'
      : null;
  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? progressSaved ? copy.lessonSaved : copy.lessonSaving
    : null;
  const phraseIntroLine = formatEarTrainingPhraseIntroLine(isEnglishCopy, phraseIndex, phrases.length);
  const resultRankLine = null;
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);
  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => ({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    hudLabels,
    phraseIntroLine,
    resultRankLine,
    timeLabel,
    practiceMode,
    isMidiConnected: earMidi.isMidiConnected,
    playerHp,
    playerMaxHp: stage.player_hp,
    enemyHp,
    enemyMaxHp: stage.enemy_hp,
    enemyName,
    enemyAvatarUrl: enemyAvatar,
    enemyAvatarFlipX,
    playerAvatarUrl: EAR_TRAINING_PLAYER_AVATAR_URL,
    phraseIndex,
    phraseRunId,
    phraseIntroSeq,
    totalPhrases: phrases.length,
    activeLoop,
    maxLoops: stage.max_loops_per_phrase,
    demoLoopActive,
    enemyAttackGaugePercent: 0,
    chords: (currentPhrase?.chords ?? []).map(chord => ({
      id: chord.id,
      name: chord.chord_name,
      active: activeChord?.id === chord.id,
    })),
    phraseSlots: currentNotes.map(note => getDisplayNoteName(note)),
    revealedNotes,
    currentNoteIndex,
    slotKind: 'noteName',
    chordCompleted: [],
    countInValue,
    lastRank,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
    quizRulesLine: clearConditionLine,
  }), [
    activeChord?.id,
    activeLoop,
    canChangePracticeMode,
    clearConditionLine,
    countInValue,
    currentNoteIndex,
    currentNotes,
    currentPhrase?.chords,
    demoLoopActive,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyHp,
    enemyName,
    gameState,
    hudLabels,
    earMidi,
    lastRank,
    lessonProgressText,
    phraseIndex,
    phraseIntroSeq,
    phraseRunId,
    phraseIntroLine,
    phrases.length,
    playerHp,
    practiceMode,
    resultRankLine,
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

      <EarTrainingBattleRenderer
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
        isEnglishCopy={isEnglishCopy}
        onClose={() => setIsSettingsOpen(false)}
        midiDeviceId={settings.selectedMidiDevice}
        onMidiDeviceChange={handleMidiDeviceChange}
        isMidiConnected={earMidi.isMidiConnected}
        practiceRunMode={
          onPracticeModeRestartFromSettings
            ? {
                practiceMode,
                onApplyPracticeModeAndRestart: onPracticeModeRestartFromSettings,
              }
            : undefined
        }
      />
    </div>
  );
};

export default EarTrainingGameScreen;
