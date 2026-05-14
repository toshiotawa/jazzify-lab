import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingPhaserGame from './EarTrainingPhaserGame';
import EarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';
import ChordVoicingStaff, {
  CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD,
  type ChordVoicingCompletionPulse,
  type ChordVoicingStaffGroup,
} from './ChordVoicingStaff';
import type {
  ClearConditions,
  EarTrainingChordVoicingAttempt,
  EarTrainingGameState,
  EarTrainingPhrase,
  EarTrainingPhraseChord,
  EarTrainingRank,
  EarTrainingStage,
} from '@/types';
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import type {
  EarTrainingBattleEffectCommand,
  EarTrainingBattleEffectKind,
  EarTrainingBattleEffectOriginPoint,
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
  getCompletionDamage,
  getNextMeasureDelaySec,
  getNextPhraseIndex,
  mapEarTrainingRankToLessonRank,
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';
import {
  acknowledgeChordAward,
  createChordVoicingAttempt,
  handleChordVoicingNoteOn,
  isAllChordsCompleted,
  selectChordVoicingJudgmentChord,
} from '@/utils/earTrainingChordVoicingEngine';
import { computeVoicingKeyboardHints } from '@/utils/earTrainingChordVoicingHints';
import {
  getEarTrainingChordDisplayAtTime,
  getEarTrainingChordJudgmentTargetsAtTime,
  getEarTrainingHarmonyHudRows,
  getEarTrainingNextChordDisplayBoundarySec,
  getFirstIncompleteVoicingChord,
  getHarmonyRowForChordId,
  isHarmonySegmentFullyCompleted,
} from '@/utils/earTrainingChordTimeline';
import {
  formatEarTrainingCountInDisplay,
  formatEarTrainingPhraseIntroLine,
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  EarTrainingChordVoicingDrumLoop,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';
import { getChordVoicingQuoteDisplayText } from '@/utils/earTrainingChordVoicingQuote';
import {
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingChordVoicingScreenProps {
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
const AUDIO_SYNC_EPSILON_SEC = 0.012;
const MIN_AUDIO_SYNC_TIMER_MS = 8;
const SELF_PACED_TIMELINE_SYNC_MS = 200;
/** セルフペース時、譜面の「次小節→現在小節」の表示切替を遅らせる（完成パルスが見えるようにする） */
const MEASURE_SHIFT_DELAY_MS = 100;
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
const EMPTY_STAVES: readonly number[] = [];

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

const getFinitePhraseLoopDuration = (phrase: EarTrainingPhrase): number | null => {
  const loopDurationSec = Number(phrase.loop_duration_sec);
  return Number.isFinite(loopDurationSec) && loopDurationSec > 0 ? loopDurationSec : null;
};

const getLoopTimeSec = (audioTimeSec: number, loopDurationSec: number): number => {
  const loopTimeSec = audioTimeSec % loopDurationSec;
  return loopTimeSec < 0 ? loopTimeSec + loopDurationSec : loopTimeSec;
};

const sortChordsForVoicingDisplay = (
  a: EarTrainingPhraseChord,
  b: EarTrainingPhraseChord,
): number => {
  const aStart = a.start_time_sec ?? 0;
  const bStart = b.start_time_sec ?? 0;
  if (aStart !== bStart) {
    return aStart - bStart;
  }
  return a.order_index - b.order_index;
};

const getMeasureNumberAtLoopTime = (
  loopTimeSec: number,
  loopDurationSec: number,
  loopMeasures: number,
): number => {
  const safeLoopMeasures = Math.max(1, loopMeasures);
  const measureDurationSec = loopDurationSec / safeLoopMeasures;
  if (!Number.isFinite(measureDurationSec) || measureDurationSec <= 0) {
    return 1;
  }
  return Math.min(safeLoopMeasures, Math.floor(loopTimeSec / measureDurationSec) + 1);
};

const normalizeMeasureNumber = (measureNumber: number, loopMeasures: number): number => {
  const safeLoopMeasures = Math.max(1, loopMeasures);
  return ((Math.max(1, Math.trunc(measureNumber)) - 1) % safeLoopMeasures) + 1;
};

const getChordMeasureNumber = (
  chord: EarTrainingPhraseChord,
  loopDurationSec: number,
  loopMeasures: number,
): number => {
  if (typeof chord.measure_number === 'number' && Number.isFinite(chord.measure_number)) {
    return normalizeMeasureNumber(chord.measure_number, loopMeasures);
  }
  if (typeof chord.start_time_sec === 'number' && Number.isFinite(chord.start_time_sec)) {
    return getMeasureNumberAtLoopTime(chord.start_time_sec, loopDurationSec, loopMeasures);
  }
  return 1;
};

const EarTrainingChordVoicingScreen: React.FC<EarTrainingChordVoicingScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
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
  const chordVoicingSelfPaced = useMemo(
    () => stage.mode === 'chord_voicing' && Boolean(stage.chord_voicing_self_paced),
    [stage.chord_voicing_self_paced, stage.mode],
  );

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
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [attempt, setAttempt] = useState<EarTrainingChordVoicingAttempt | null>(null);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [timeRemaining, setTimeRemaining] = useState(stage.time_limit_sec);
  const [countInValue, setCountInValue] = useState(stage.count_in_beats);
  const [activeLoop, setActiveLoop] = useState(1);
  const [activeMeasureNumber, setActiveMeasureNumber] = useState(1);
  const [displayedActiveMeasureNumber, setDisplayedActiveMeasureNumber] = useState(1);
  const [activeChord, setActiveChord] = useState<EarTrainingPhraseChord | null>(null);
  const [lastRank, setLastRank] = useState<EarTrainingRank | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);
  const [enemyAttackGaugePercent, setEnemyAttackGaugePercentState] = useState(0);
  const [completionPulse, setCompletionPulse] = useState<ChordVoicingCompletionPulse | null>(null);

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const selfPacedDrumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const staffOverlayRef = useRef<HTMLDivElement | null>(null);
  const completionPulseEventKeyRef = useRef(0);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const startPhraseRef = useRef<(nextPhraseIndex: number) => void>(() => undefined);
  const syncAudioTimelineRef = useRef<(options?: { scheduleNext?: boolean }) => void>(() => undefined);
  const attemptRef = useRef<EarTrainingChordVoicingAttempt | null>(null);
  const activeChordRef = useRef<EarTrainingPhraseChord | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const phraseIndexRef = useRef(0);
  const activeLoopRef = useRef(1);
  const activeMeasureNumberRef = useRef(1);
  const lastLoopAttackAppliedRef = useRef(0);
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const timeRemainingRef = useRef(stage.time_limit_sec);
  const failCurrentPhraseRef = useRef<() => void>(() => undefined);
  const failTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chordSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measureShiftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measureShiftQueueRef = useRef<number[]>([]);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const allChordsCompletedAtRef = useRef(false);
  const enemyAttackGaugePercentRef = useRef(0);
  /** カウントイン末尾の「最後の半拍」からのみ true（譜面ヒント／先行入力許可）。 */
  const countInEarlyInputRef = useRef(false);
  const [countInEarlyInputActive, setCountInEarlyInputActive] = useState(false);

  const currentPhrase = phrases[phraseIndex];

  useEffect(() => { attemptRef.current = attempt; }, [attempt]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { phraseIndexRef.current = phraseIndex; }, [phraseIndex]);
  useEffect(() => { activeLoopRef.current = activeLoop; }, [activeLoop]);
  useEffect(() => { activeMeasureNumberRef.current = activeMeasureNumber; }, [activeMeasureNumber]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { activeChordRef.current = activeChord; }, [activeChord]);

  useEffect(() => {
    if (gameState === 'idle') {
      setStatusText(copy.idlePrompt);
    }
  }, [copy.idlePrompt, gameState]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.midiVolume]);

  const ensurePhrasePlayer = useCallback((): EarTrainingChordVoicingPhrasePlayer => {
    if (!phrasePlayerRef.current) {
      phrasePlayerRef.current = new EarTrainingChordVoicingPhrasePlayer();
    }
    return phrasePlayerRef.current;
  }, []);

  const ensureSelfPacedDrumLoop = useCallback((): EarTrainingChordVoicingDrumLoop => {
    if (!selfPacedDrumLoopRef.current) {
      selfPacedDrumLoopRef.current = new EarTrainingChordVoicingDrumLoop();
    }
    return selfPacedDrumLoopRef.current;
  }, []);

  const stopSelfPacedDrumLoop = useCallback(() => {
    selfPacedDrumLoopRef.current?.stop();
  }, []);

  useEffect(() => {
    phrasePlayerRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.musicVolume]);

  useEffect(() => {
    if (!chordVoicingSelfPaced) {
      return;
    }
    selfPacedDrumLoopRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [chordVoicingSelfPaced, settings.masterVolume, settings.musicVolume]);

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

  const clearChordSyncTimer = useCallback(() => {
    if (chordSyncTimerRef.current) {
      clearTimeout(chordSyncTimerRef.current);
      chordSyncTimerRef.current = null;
    }
  }, []);

  const clearMeasureShiftQueue = useCallback(() => {
    if (measureShiftTimerRef.current !== null) {
      clearTimeout(measureShiftTimerRef.current);
      measureShiftTimerRef.current = null;
    }
    measureShiftQueueRef.current = [];
  }, []);

  const runMeasureShiftQueue = useCallback(() => {
    if (measureShiftTimerRef.current !== null) {
      return;
    }
    const step = () => {
      measureShiftTimerRef.current = null;
      const next = measureShiftQueueRef.current.shift();
      if (next !== undefined) {
        setDisplayedActiveMeasureNumber(next);
      }
      if (measureShiftQueueRef.current.length > 0) {
        measureShiftTimerRef.current = setTimeout(step, MEASURE_SHIFT_DELAY_MS);
      }
    };
    measureShiftTimerRef.current = setTimeout(step, MEASURE_SHIFT_DELAY_MS);
  }, []);

  const enqueueMeasureDisplayShift = useCallback((targetMeasure: number) => {
    measureShiftQueueRef.current.push(targetMeasure);
    runMeasureShiftQueue();
  }, [runMeasureShiftQueue]);

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

  const setEnemyAttackGaugePercent = useCallback((value: number) => {
    const next = quantizeAttackGaugePercent(value);
    if (Math.abs(next - enemyAttackGaugePercentRef.current) < 0.0001) {
      return;
    }
    enemyAttackGaugePercentRef.current = next;
    setEnemyAttackGaugePercentState(next);
  }, []);

  const clearBattleEffectTimers = useCallback(() => {
    if (battleEffectClearTimerRef.current) {
      clearTimeout(battleEffectClearTimerRef.current);
      battleEffectClearTimerRef.current = null;
    }
  }, []);

  const stopPhraseAudio = useCallback(() => {
    clearChordSyncTimer();
    phrasePlayerRef.current?.stop();
  }, [clearChordSyncTimer]);

  useEffect(() => {
    if (!chordVoicingSelfPaced) {
      clearMeasureShiftQueue();
      setDisplayedActiveMeasureNumber(activeMeasureNumber);
    }
  }, [activeMeasureNumber, chordVoicingSelfPaced, clearMeasureShiftQueue]);

  useEffect(() => () => {
    clearMeasureShiftQueue();
  }, [clearMeasureShiftQueue]);

  const triggerFeedback = useCallback((value: 'correct' | 'miss' | 'clear') => {
    setFeedback(value);
    setTimeout(() => setFeedback(null), 220);
  }, []);

  const triggerBattleEffect = useCallback((
    kind: EarTrainingBattleEffectKind,
    label?: string,
    damage?: number,
    phraseNoteCount?: number,
    originPoint?: EarTrainingBattleEffectOriginPoint,
  ): number => {
    clearBattleEffectTimers();
    battleEffectIdRef.current += 1;
    const effectId = battleEffectIdRef.current;
    setBattleEffectCommand({ id: effectId, kind, label, damage, phraseNoteCount, originPoint });
    battleEffectClearTimerRef.current = setTimeout(() => {
      setBattleEffectCommand(current => (current?.id === effectId ? null : current));
    }, BATTLE_EFFECT_DURATION_MS);
    return effectId;
  }, [clearBattleEffectTimers]);

  /** アクティブなコード名ラベルの中心座標を Phaser シーン座標で返す。Phaser.Scale.RESIZE のためコンテナと等倍。 */
  const computeChordLabelOriginPoint = useCallback((
    groupId: string | null | undefined,
  ): EarTrainingBattleEffectOriginPoint | undefined => {
    if (!groupId) {
      return undefined;
    }
    const overlay = staffOverlayRef.current;
    const container = phaserContainerRef.current;
    if (!overlay || !container) {
      return undefined;
    }
    const labelEl = overlay.querySelector(
      `text[data-voicing-group-id="${groupId}"][data-voicing-group-active="true"]`,
    );
    if (!labelEl) {
      return undefined;
    }
    const labelRect = labelEl.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const x = labelRect.left + labelRect.width / 2 - containerRect.left;
    const y = labelRect.top + labelRect.height / 2 - containerRect.top;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return undefined;
    }
    return { x, y };
  }, []);

  const triggerCompletionPulse = useCallback((
    groupId: string,
    kind: 'voicingPartial' | 'harmonyComplete',
  ) => {
    completionPulseEventKeyRef.current += 1;
    setCompletionPulse({
      groupId,
      kind,
      eventKey: completionPulseEventKeyRef.current,
    });
  }, []);

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
    stopSelfPacedDrumLoop();
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
    stopSelfPacedDrumLoop,
    triggerFeedback,
  ]);

  const finishGameOver = useCallback((message: string) => {
    pendingImpactHandlersRef.current.clear();
    clearFailTimer();
    clearTransitionTimer();
    clearTimeLimitTimer();
    clearMeasureShiftQueue();
    gameStateRef.current = 'gameOver';
    stopPhraseAudio();
    stopSelfPacedDrumLoop();
    setGameState('gameOver');
    setStatusText(message);
  }, [clearFailTimer, clearMeasureShiftQueue, clearTimeLimitTimer, clearTransitionTimer, stopPhraseAudio, stopSelfPacedDrumLoop]);

  const failCurrentPhrase = useCallback(() => {
    const currentAttempt = attemptRef.current;
    if (!currentAttempt || gameStateRef.current !== 'playingPhrase') {
      return;
    }
    gameStateRef.current = 'phraseFail';
    clearChordSyncTimer();
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
    clearChordSyncTimer,
    clearTransitionTimer,
    copy,
    finishGameOver,
    phrases.length,
    registerBattleEffectImpact,
    setEnemyAttackGaugePercent,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  useEffect(() => {
    failCurrentPhraseRef.current = failCurrentPhrase;
  }, [failCurrentPhrase]);

  const triggerLoopEnemyAttack = useCallback((completedLoop: number) => {
    if (
      gameStateRef.current !== 'playingPhrase'
      || completedLoop < 2
      || completedLoop >= stage.max_loops_per_phrase
      || completedLoop <= lastLoopAttackAppliedRef.current
      || activeDamageConfig.miss <= 0
    ) {
      return;
    }

    lastLoopAttackAppliedRef.current = completedLoop;
    setEnemyAttackGaugePercent(clampRatio(completedLoop / Math.max(1, ATTACK_GAUGE_TARGET_LOOPS)));
    triggerFeedback('miss');
    const attackEffectId = triggerBattleEffect('miss', 'ATTACK', activeDamageConfig.miss);
    registerBattleEffectImpact(attackEffectId, () => {
      const nextPlayerHp = Math.max(0, playerHpRef.current - activeDamageConfig.miss);
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
  }, [
    activeDamageConfig.miss,
    copy.gameOver,
    finishGameOver,
    registerBattleEffectImpact,
    setEnemyAttackGaugePercent,
    stage.max_loops_per_phrase,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  const scheduleNextAudioTimelineSync = useCallback(() => {
    clearChordSyncTimer();
    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }

    const player = phrasePlayerRef.current;
    const phrase = phrases[phraseIndexRef.current];
    const currentAttempt = attemptRef.current;
    if (!player || !phrase || !currentAttempt) {
      return;
    }

    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    if (loopDurationSec === null) {
      return;
    }

    if (chordVoicingSelfPaced) {
      chordSyncTimerRef.current = setTimeout(() => {
        chordSyncTimerRef.current = null;
        syncAudioTimelineRef.current();
      }, SELF_PACED_TIMELINE_SYNC_MS);
      return;
    }

    const audioTimeSec = player.getCurrentTime();
    const loopIndex = Math.max(0, Math.floor(audioTimeSec / loopDurationSec));
    const loopTimeSec = getLoopTimeSec(audioTimeSec, loopDurationSec);
    const nextLoopBoundarySec = getEarTrainingNextChordDisplayBoundarySec(
      phrase,
      loopTimeSec,
      stage.bpm,
      currentAttempt.completedChordIds,
      loopDurationSec,
    );
    let nextAudioSyncTimeSec = nextLoopBoundarySec === null
      ? (loopIndex + 1) * loopDurationSec
      : (loopIndex * loopDurationSec) + nextLoopBoundarySec;

    const audioEndSyncTimeSec = Number(phrase.audio_duration_sec) - AUDIO_END_EPSILON_SEC;
    if (Number.isFinite(audioEndSyncTimeSec) && audioEndSyncTimeSec > 0) {
      nextAudioSyncTimeSec = Math.min(nextAudioSyncTimeSec, audioEndSyncTimeSec);
    }

    if (nextAudioSyncTimeSec <= audioTimeSec + AUDIO_SYNC_EPSILON_SEC) {
      nextAudioSyncTimeSec = audioTimeSec + AUDIO_SYNC_EPSILON_SEC;
    }

    const delayMs = Math.max(
      MIN_AUDIO_SYNC_TIMER_MS,
      (nextAudioSyncTimeSec - audioTimeSec - AUDIO_SYNC_EPSILON_SEC) * 1000,
    );
    chordSyncTimerRef.current = setTimeout(() => {
      chordSyncTimerRef.current = null;
      syncAudioTimelineRef.current();
    }, delayMs);
  }, [chordVoicingSelfPaced, clearChordSyncTimer, phrases, stage.bpm]);

  const syncAudioTimeline = useCallback((options?: { scheduleNext?: boolean }) => {
    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }

    const player = phrasePlayerRef.current;
    const phrase = phrases[phraseIndexRef.current];
    const currentAttempt = attemptRef.current;
    if (!player || !phrase || !currentAttempt) {
      return;
    }

    const audioTimeSec = player.getCurrentTime();
    const audioDurationSec = Number(phrase.audio_duration_sec);
    if (
      player.hasEnded()
      || (Number.isFinite(audioDurationSec) && audioTimeSec >= audioDurationSec - AUDIO_END_EPSILON_SEC)
    ) {
      failCurrentPhrase();
      return;
    }

    const loopDurationForGauge = getFinitePhraseLoopDuration(phrase);
    if (loopDurationForGauge !== null) {
      const gaugeDurationSec = loopDurationForGauge * ATTACK_GAUGE_TARGET_LOOPS;
      setEnemyAttackGaugePercent(
        Number.isFinite(gaugeDurationSec) && gaugeDurationSec > 0
          ? clampRatio(audioTimeSec / gaugeDurationSec)
          : 0,
      );
    }

    const loopDurationSec = loopDurationForGauge;
    if (loopDurationSec === null) {
      return;
    }

    const loop = Math.floor(audioTimeSec / loopDurationSec) + 1;
    const nextActiveLoop = Math.max(1, Math.min(stage.max_loops_per_phrase, loop));
    if (nextActiveLoop !== activeLoopRef.current) {
      activeLoopRef.current = nextActiveLoop;
      setActiveLoop(nextActiveLoop);
    }

    const loopTime = getLoopTimeSec(audioTimeSec, loopDurationSec);

    const nextChord = chordVoicingSelfPaced
      ? getFirstIncompleteVoicingChord(phrase, currentAttempt.completedChordIds)
      : getEarTrainingChordDisplayAtTime(
          phrase,
          loopTime,
          stage.bpm,
          currentAttempt.completedChordIds,
          loopDurationSec,
        );
    const nextActiveMeasureNumber = nextChord !== null
      ? getChordMeasureNumber(nextChord, loopDurationSec, stage.loop_measures)
      : getMeasureNumberAtLoopTime(loopTime, loopDurationSec, stage.loop_measures);
    if (nextActiveMeasureNumber !== activeMeasureNumberRef.current) {
      activeMeasureNumberRef.current = nextActiveMeasureNumber;
      setActiveMeasureNumber(nextActiveMeasureNumber);
      if (chordVoicingSelfPaced) {
        enqueueMeasureDisplayShift(nextActiveMeasureNumber);
      }
    }
    const completedLoop = Math.min(
      stage.max_loops_per_phrase,
      Math.max(0, Math.floor(audioTimeSec / loopDurationSec)),
    );
    triggerLoopEnemyAttack(completedLoop);

    const previousChord = activeChordRef.current;
    if (nextChord?.id !== previousChord?.id) {
      setActiveChord(nextChord);
      activeChordRef.current = nextChord;
    }

    if (options?.scheduleNext !== false) {
      scheduleNextAudioTimelineSync();
    }
  }, [
    enqueueMeasureDisplayShift,
    failCurrentPhrase,
    phrases,
    scheduleNextAudioTimelineSync,
    setEnemyAttackGaugePercent,
    chordVoicingSelfPaced,
    stage.bpm,
    stage.loop_measures,
    stage.max_loops_per_phrase,
    triggerLoopEnemyAttack,
  ]);

  useEffect(() => {
    syncAudioTimelineRef.current = syncAudioTimeline;
  }, [syncAudioTimeline]);

  const prepareChordVoicingPhrasePlayback = useCallback((nextPhraseIndex: number): boolean => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver(copy.noPhrases);
      return false;
    }
    clearMeasureShiftQueue();
    setPhraseIndex(nextPhraseIndex);
    phraseIndexRef.current = nextPhraseIndex;
    setPhraseRunId(current => current + 1);
    setPhraseIntroSeq(current => current + 1);
    const nextAttempt = createChordVoicingAttempt(phrase);
    setAttempt(nextAttempt);
    attemptRef.current = nextAttempt;
    setLastRank(null);
    setActiveLoop(1);
    activeLoopRef.current = 1;
    lastLoopAttackAppliedRef.current = 0;
    setEnemyAttackGaugePercent(0);
    allChordsCompletedAtRef.current = false;
    const phraseLoopDuration = getFinitePhraseLoopDuration(phrase);
    const initialChord = chordVoicingSelfPaced
      ? getFirstIncompleteVoicingChord(phrase, nextAttempt.completedChordIds)
      : getEarTrainingChordDisplayAtTime(
          phrase,
          0,
          stage.bpm,
          nextAttempt.completedChordIds,
          phraseLoopDuration ?? undefined,
        );
    const initialMeasureNumber = initialChord !== null
      ? phraseLoopDuration !== null
        ? getChordMeasureNumber(initialChord, phraseLoopDuration, stage.loop_measures)
        : typeof initialChord.measure_number === 'number' && Number.isFinite(initialChord.measure_number)
          ? normalizeMeasureNumber(initialChord.measure_number, stage.loop_measures)
          : 1
      : 1;
    activeMeasureNumberRef.current = initialMeasureNumber;
    setActiveMeasureNumber(initialMeasureNumber);
    setDisplayedActiveMeasureNumber(initialMeasureNumber);
    setActiveChord(initialChord);
    activeChordRef.current = initialChord;
    setStatusText(copy.phraseLabel(nextPhraseIndex + 1));
    return true;
  }, [
    chordVoicingSelfPaced,
    clearMeasureShiftQueue,
    copy,
    finishGameOver,
    phrases,
    setEnemyAttackGaugePercent,
    stage.bpm,
    stage.loop_measures,
  ]);

  const startPhraseAudioPlaybackOnly = useCallback(() => {
    countInEarlyInputRef.current = false;
    setCountInEarlyInputActive(false);
    gameStateRef.current = 'playingPhrase';
    setGameState('playingPhrase');
    const phrase = phrases[phraseIndexRef.current];
    if (!phrase) {
      return;
    }
    const player = ensurePhrasePlayer();
    void (async () => {
      try {
        const prepared = await player.prepare(phrase.audio_url);
        player.playPrepared({
          prepared,
          ...(chordVoicingSelfPaced ? { phraseGain: 0 } : {}),
          onPhraseStarted: () => {
            syncAudioTimelineRef.current();
          },
          onEnded: () => {
            failCurrentPhraseRef.current();
          },
        });
      } catch {
        setStatusText(copy.audioFailed);
      }
    })();
  }, [
    chordVoicingSelfPaced,
    copy.audioFailed,
    ensurePhrasePlayer,
    phrases,
  ]);

  const beginPhrasePlayback = useCallback((nextPhraseIndex: number) => {
    if (!prepareChordVoicingPhrasePlayback(nextPhraseIndex)) {
      return;
    }
    startPhraseAudioPlaybackOnly();
  }, [prepareChordVoicingPhrasePlayback, startPhraseAudioPlaybackOnly]);

  const startPhrase = useCallback((nextPhraseIndex: number, playsCountIn = true) => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver(copy.noPhrases);
      return;
    }
    clearFailTimer();
    clearChordSyncTimer();
    clearTransitionTimer();
    if (playsCountIn && !chordVoicingSelfPaced) {
      void (async () => {
        countInEarlyInputRef.current = false;
        setCountInEarlyInputActive(false);
        gameStateRef.current = 'countIn';
        setGameState('countIn');
        setStatusText(copy.countIn);
        const beats = Math.max(0, Math.min(32, stage.count_in_beats));
        setCountInValue(beats);
        stopPhraseAudio();
        if (!prepareChordVoicingPhrasePlayback(nextPhraseIndex)) {
          return;
        }
        const phraseAfterPrepare = phrases[nextPhraseIndex];
        if (!phraseAfterPrepare) {
          return;
        }
        const player = ensurePhrasePlayer();
        let prepared;
        try {
          prepared = await player.prepare(phraseAfterPrepare.audio_url);
        } catch {
          setStatusText(copy.audioFailed);
          return;
        }
        const onEnded = (): void => {
          failCurrentPhraseRef.current();
        };
        const onPhraseBodyStarted = (): void => {
          countInEarlyInputRef.current = false;
          setCountInEarlyInputActive(false);
          gameStateRef.current = 'playingPhrase';
          setGameState('playingPhrase');
          syncAudioTimelineRef.current();
        };
        if (beats <= 0) {
          player.playPrepared({
            prepared,
            onPhraseStarted: onPhraseBodyStarted,
            onEnded,
          });
          return;
        }
        player.schedulePreparedPhraseWithCountIn({
          prepared,
          countInBeats: beats,
          bpm: stage.bpm,
          beatGain: settings.masterVolume * settings.musicVolume,
          onBeat: remaining => {
            setCountInValue(remaining);
          },
          onInputWindowStart: () => {
            countInEarlyInputRef.current = true;
            setCountInEarlyInputActive(true);
          },
          onPhraseStarted: onPhraseBodyStarted,
          onEnded,
        });
      })();
      return;
    }
    beginPhrasePlayback(nextPhraseIndex);
  }, [
    beginPhrasePlayback,
    chordVoicingSelfPaced,
    clearChordSyncTimer,
    clearFailTimer,
    clearTransitionTimer,
    copy,
    copy.audioFailed,
    ensurePhrasePlayer,
    finishGameOver,
    phrases,
    prepareChordVoicingPhrasePlayback,
    settings.masterVolume,
    settings.musicVolume,
    stage.bpm,
    stage.count_in_beats,
    stopPhraseAudio,
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

  const startCountIn = useCallback(() => {
    if (phrases.length === 0) {
      finishGameOver(copy.noPhrases);
      return;
    }
    markAudioUserInteraction();
    void initializeAudioSystem().catch(() => undefined);
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    countInEarlyInputRef.current = false;
    setCountInEarlyInputActive(false);
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    setTimeRemaining(stage.time_limit_sec);
    setPhraseIndex(0);
    setPhraseRunId(0);
    setPhraseIntroSeq(0);
    activeLoopRef.current = 1;
    activeMeasureNumberRef.current = 1;
    lastLoopAttackAppliedRef.current = 0;
    setActiveMeasureNumber(1);
    setDisplayedActiveMeasureNumber(1);
    setBattleEffectCommand(null);
    pendingImpactHandlersRef.current.clear();
    setEnemyAttackGaugePercent(0);
    clearCountdownTimer();
    clearBattleEffectTimers();
    clearFailTimer();
    clearChordSyncTimer();
    clearTransitionTimer();
    clearMeasureShiftQueue();
    clearTimeLimitTimer();
    stopPhraseAudio();
    if (chordVoicingSelfPaced) {
      stopSelfPacedDrumLoop();
    }

    if (chordVoicingSelfPaced) {
      setCountInValue(0);
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      setStatusText(copy.phraseLabel(1));
      void (async () => {
        countInEarlyInputRef.current = false;
        setCountInEarlyInputActive(false);
        if (!prepareChordVoicingPhrasePlayback(0)) {
          return;
        }
        const firstPhrase = phrases[0];
        if (!firstPhrase) {
          return;
        }
        const player = ensurePhrasePlayer();
        let prepared;
        try {
          prepared = await player.prepare(firstPhrase.audio_url);
        } catch {
          setStatusText(copy.audioFailed);
          return;
        }
        const phraseCtx = player.getAudioContext();
        if (phraseCtx) {
          try {
            const drum = ensureSelfPacedDrumLoop();
            await drum.prepare(CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, phraseCtx);
            drum.setVolume(settings.masterVolume * settings.musicVolume);
          } catch {
            // ドラム取得失敗時はフレーズ時計のみ
          }
        }
        if (!practiceMode) {
          startTimeLimit();
        }
        player.playPrepared({
          prepared,
          phraseGain: 0,
          onPhraseStarted: () => {
            ensureSelfPacedDrumLoop().start();
            syncAudioTimelineRef.current();
          },
          onEnded: () => {
            failCurrentPhraseRef.current();
          },
        });
      })();
      return;
    }

    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText(copy.countIn);
    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    setCountInValue(beats);
    void (async () => {
      countInEarlyInputRef.current = false;
      setCountInEarlyInputActive(false);
      if (!prepareChordVoicingPhrasePlayback(0)) {
        return;
      }
      const firstPhrase = phrases[0];
      if (!firstPhrase) {
        return;
      }
      const player = ensurePhrasePlayer();
      let prepared;
      try {
        prepared = await player.prepare(firstPhrase.audio_url);
      } catch {
        setStatusText(copy.audioFailed);
        return;
      }
      const onEnded = (): void => {
        failCurrentPhraseRef.current();
      };
      const onPhraseBodyStarted = (): void => {
        countInEarlyInputRef.current = false;
        setCountInEarlyInputActive(false);
        gameStateRef.current = 'playingPhrase';
        setGameState('playingPhrase');
        syncAudioTimelineRef.current();
      };
      if (beats <= 0) {
        startTimeLimit();
        player.playPrepared({
          prepared,
          onPhraseStarted: onPhraseBodyStarted,
          onEnded,
        });
        return;
      }
      player.schedulePreparedPhraseWithCountIn({
        prepared,
        countInBeats: beats,
        bpm: stage.bpm,
        beatGain: settings.masterVolume * settings.musicVolume,
        onBeat: remaining => {
          setCountInValue(remaining);
        },
        onInputWindowStart: () => {
          countInEarlyInputRef.current = true;
          setCountInEarlyInputActive(true);
        },
        onPhraseStarted: () => {
          startTimeLimit();
          onPhraseBodyStarted();
        },
        onEnded,
      });
    })();
  }, [
    clearBattleEffectTimers,
    clearChordSyncTimer,
    clearFailTimer,
    clearMeasureShiftQueue,
    clearTimeLimitTimer,
    clearTransitionTimer,
    copy,
    copy.audioFailed,
    ensurePhrasePlayer,
    ensureSelfPacedDrumLoop,
    finishGameOver,
    phrases,
    prepareChordVoicingPhrasePlayback,
    setEnemyAttackGaugePercent,
    settings.masterVolume,
    settings.musicVolume,
    stage.bpm,
    stage.count_in_beats,
    stage.enemy_hp,
    stage.player_hp,
    stage.time_limit_sec,
    chordVoicingSelfPaced,
    practiceMode,
    startTimeLimit,
    stopPhraseAudio,
    stopSelfPacedDrumLoop,
  ]);

  const transitionToNextPhrase = useCallback((rank: EarTrainingRank, phrase: EarTrainingPhrase) => {
    clearTransitionTimer();
    clearChordSyncTimer();
    if (chordVoicingSelfPaced) {
      gameStateRef.current = 'phraseComplete';
      setGameState('phraseComplete');
      setLastRank(rank);
      stopPhraseAudio();
      gameStateRef.current = 'transitionToNextPhrase';
      setGameState('transitionToNextPhrase');
      const nextIndexSelfPaced = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
      startPhraseRef.current(nextIndexSelfPaced);
      return;
    }
    const player = phrasePlayerRef.current;
    const currentAudioTimeSec = player?.getCurrentTime() ?? 0;
    const delaySec = getNextMeasureDelaySec(
      currentAudioTimeSec,
      Number(phrase.loop_duration_sec),
      stage.loop_measures,
    );
    const targetAudioTimeSec = currentAudioTimeSec + delaySec;
    gameStateRef.current = 'phraseComplete';
    setGameState('phraseComplete');
    setLastRank(rank);
    setStatusText(copy.transitionNextBar(rank));

    const startNextPhraseAtTarget = () => {
      transitionTimerRef.current = null;
      const currentPlayer = phrasePlayerRef.current;
      const remainingSec = currentPlayer?.isPlayingPhraseClock()
        ? targetAudioTimeSec - currentPlayer.getCurrentTime()
        : 0;
      if (remainingSec > AUDIO_SYNC_EPSILON_SEC) {
        transitionTimerRef.current = setTimeout(
          startNextPhraseAtTarget,
          Math.max(MIN_AUDIO_SYNC_TIMER_MS, (remainingSec - AUDIO_SYNC_EPSILON_SEC) * 1000),
        );
        return;
      }
      stopPhraseAudio();
      gameStateRef.current = 'transitionToNextPhrase';
      setGameState('transitionToNextPhrase');
      const nextIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
      startPhraseRef.current(nextIndex);
    };

    transitionTimerRef.current = setTimeout(
      startNextPhraseAtTarget,
      Math.max(MIN_AUDIO_SYNC_TIMER_MS, (delaySec - AUDIO_SYNC_EPSILON_SEC) * 1000),
    );
  }, [
    chordVoicingSelfPaced,
    clearChordSyncTimer,
    clearTransitionTimer,
    copy,
    phrases.length,
    stage.loop_measures,
    stopPhraseAudio,
  ]);

  const handlePhraseAllChordsCompleted = useCallback((
    completedAttempt: EarTrainingChordVoicingAttempt,
    phrase: EarTrainingPhrase,
  ) => {
    if (allChordsCompletedAtRef.current) {
      return;
    }
    allChordsCompletedAtRef.current = true;
    gameStateRef.current = 'phraseComplete';
    clearFailTimer();
    clearChordSyncTimer();
    const totalChords = phrase.chords?.length ?? 0;
    const totalVoicingNotes = (phrase.chords ?? []).reduce(
      (sum, chord) => sum + (chord.voicing?.length ?? 0),
      0,
    );
    const missMap = new Map<number, number>();
    let chordSlotIndex = 0;
    completedAttempt.missByChord.forEach(value => {
      missMap.set(chordSlotIndex, value);
      chordSlotIndex += 1;
    });
    const rank = calculateEarTrainingRank(missMap, rankRule);
    const completionDamage = getCompletionDamage(rank, activeDamageConfig);
    const completionOriginGroupId = activeChordRef.current?.id ?? null;
    if (completionOriginGroupId) {
      triggerCompletionPulse(completionOriginGroupId, 'harmonyComplete');
    }
    const completionOriginPoint = computeChordLabelOriginPoint(completionOriginGroupId);
    const effectId = triggerBattleEffect(
      'complete',
      rank,
      completionDamage,
      totalVoicingNotes,
      completionOriginPoint,
    );
    const willStageClear = enemyHpRef.current - completionDamage <= 0;
    registerBattleEffectImpact(effectId, () => {
      const nextEnemyHp = Math.max(0, enemyHpRef.current - completionDamage);
      setEnemyHp(nextEnemyHp);
      enemyHpRef.current = nextEnemyHp;
      const outcome = resolveEarTrainingOutcome({
        enemyHp: nextEnemyHp,
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
    void totalChords;
  }, [
    activeDamageConfig,
    clearChordSyncTimer,
    clearFailTimer,
    computeChordLabelOriginPoint,
    finishStageClear,
    rankRule,
    registerBattleEffectImpact,
    transitionToNextPhrase,
    triggerBattleEffect,
    triggerCompletionPulse,
  ]);

  const handleNoteInput = useCallback((note: number) => {
    const now = performance.now();
    if (now - lastInputAtRef.current < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtRef.current = now;
    const allowEarlyCountIn = gameStateRef.current === 'countIn' && countInEarlyInputRef.current;
    if (gameStateRef.current !== 'playingPhrase' && !allowEarlyCountIn) {
      return;
    }
    const isEarlyCountIn = allowEarlyCountIn;
    if (!isEarlyCountIn) {
      syncAudioTimelineRef.current({ scheduleNext: false });
      if (gameStateRef.current !== 'playingPhrase') {
        return;
      }
    }
    const phrase = phrases[phraseIndex];
    const currentAttempt = attemptRef.current;
    const displayChord = activeChordRef.current;
    const player = phrasePlayerRef.current;
    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    if (
      !phrase
      || !currentAttempt
      || loopDurationSec === null
      || (!isEarlyCountIn && !player)
    ) {
      return;
    }
    let loopTimeSec = 0;
    if (!isEarlyCountIn) {
      if (!player) {
        return;
      }
      loopTimeSec = getLoopTimeSec(player.getCurrentTime(), loopDurationSec);
    }
    const targets = chordVoicingSelfPaced
      ? {
          primary: getFirstIncompleteVoicingChord(phrase, currentAttempt.completedChordIds),
          overlap: null,
        }
      : getEarTrainingChordJudgmentTargetsAtTime(
          phrase,
          loopTimeSec,
          stage.bpm,
          currentAttempt.completedChordIds,
          displayChord,
          loopDurationSec,
        );
    const judgmentChord = selectChordVoicingJudgmentChord(
      currentAttempt,
      targets.primary,
      targets.overlap,
      note,
    );
    if (!judgmentChord) {
      return;
    }
    const result = handleChordVoicingNoteOn(currentAttempt, judgmentChord, note, activeDamageConfig);
    if (result.attempt !== currentAttempt) {
      setAttempt(result.attempt);
      attemptRef.current = result.attempt;
    }

    if (result.evaluationMissAdded) {
      triggerFeedback('miss');
      setStatusText(copy.tryAgain);
      return;
    }

    if (result.hitPitchClass !== null) {
      triggerFeedback('correct');
    }

    if (!result.chordJustCompleted) {
      return;
    }

    const harmonyRow = getHarmonyRowForChordId(phrase, judgmentChord.id);
    if (harmonyRow !== null && !isHarmonySegmentFullyCompleted(result.attempt, harmonyRow)) {
      triggerCompletionPulse(judgmentChord.id, 'voicingPartial');
      triggerBattleEffect('voicingCast');
      syncAudioTimelineRef.current();
      return;
    }

    const awardKey = harmonyRow?.representativeId ?? judgmentChord.id;
    const acknowledgedAttempt = acknowledgeChordAward(result.attempt, awardKey);
    setAttempt(acknowledgedAttempt);
    attemptRef.current = acknowledgedAttempt;

    setStatusText(copy.chordCompleted(judgmentChord.chord_name));
    triggerCompletionPulse(judgmentChord.id, 'harmonyComplete');

    // フレーズ最後のコード完了時は Skill (complete) 演出のみで完結させる。
    // ここで `correct` を発火すると火の玉と Skill 演出が二重に走り、Skill 演出が埋もれてしまう。
    // この回の `result.enemyDamage` は意図的に drop し、`completionDamage` のみ HP に反映する。
    if (isAllChordsCompleted(phrase, acknowledgedAttempt)) {
      handlePhraseAllChordsCompleted(acknowledgedAttempt, phrase);
      return;
    }

    const correctOriginPoint = computeChordLabelOriginPoint(judgmentChord.id);
    const correctEffectId = triggerBattleEffect(
      'correct',
      undefined,
      result.enemyDamage,
      undefined,
      correctOriginPoint,
    );
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
        const missMap = new Map<number, number>();
        let idx = 0;
        acknowledgedAttempt.missByChord.forEach(value => {
          missMap.set(idx, value);
          idx += 1;
        });
        const rank = calculateEarTrainingRank(missMap, rankRule);
        void finishStageClear(rank);
      }
    });
    syncAudioTimelineRef.current();
  }, [
    activeDamageConfig,
    chordVoicingSelfPaced,
    computeChordLabelOriginPoint,
    copy,
    finishGameOver,
    finishStageClear,
    handlePhraseAllChordsCompleted,
    phraseIndex,
    phrases,
    rankRule,
    registerBattleEffectImpact,
    triggerBattleEffect,
    triggerCompletionPulse,
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

  useEffect(() => {
    return () => {
      pendingImpactHandlersRef.current.clear();
      clearBattleEffectTimers();
      clearCountdownTimer();
      clearFailTimer();
      clearChordSyncTimer();
      clearTimeLimitTimer();
      clearTransitionTimer();
      stopPhraseAudio();
      selfPacedDrumLoopRef.current?.dispose();
      selfPacedDrumLoopRef.current = null;
      phrasePlayerRef.current?.dispose();
      phrasePlayerRef.current = null;
    };
  }, [
    clearBattleEffectTimers,
    clearChordSyncTimer,
    clearCountdownTimer,
    clearFailTimer,
    clearTimeLimitTimer,
    clearTransitionTimer,
    stopPhraseAudio,
  ]);

  const harmonyHudRowsForHud = useMemo(() => {
    const rows = getEarTrainingHarmonyHudRows(currentPhrase);
    if (rows.length > 0) {
      return rows;
    }
    const chords = currentPhrase?.chords ?? [];
    return chords.map(chord => ({
      representativeId: chord.id,
      chordName: chord.chord_name,
      voicingIds: [chord.id],
    }));
  }, [currentPhrase]);

  const harmonyCompletedFlags = useMemo(() => {
    if (!attempt) {
      return harmonyHudRowsForHud.map(() => false);
    }
    return harmonyHudRowsForHud.map(row =>
      row.voicingIds.every(id => attempt.completedChordIds.has(id)),
    );
  }, [attempt, harmonyHudRowsForHud]);

  const harmonyCompletedIndex = harmonyCompletedFlags.findIndex(flag => !flag);
  const harmonySlotCount = harmonyHudRowsForHud.length;
  const currentChordSlotIndex = harmonyCompletedIndex >= 0
    ? harmonyCompletedIndex
    : Math.max(0, harmonySlotCount - 1);

  const showVoicingTargetHints =
    gameState === 'playingPhrase'
    || (gameState === 'countIn' && countInEarlyInputActive);

  const playerQuoteBubbleText = useMemo(() => {
    if (!showVoicingTargetHints || !activeChord) {
      return null;
    }
    if (attempt?.completedChordIds.has(activeChord.id)) {
      return null;
    }
    return getChordVoicingQuoteDisplayText(activeChord);
  }, [showVoicingTargetHints, activeChord, attempt]);

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
  const resultRankLine = gameState === 'stageClear' && lastRank
    ? `${hudLabels.clearGradePrefix} ${mapEarTrainingRankToLessonRank(lastRank)}`
    : null;

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
    phraseRunId,
    phraseIntroSeq,
    totalPhrases: phrases.length,
    activeLoop,
    maxLoops: stage.max_loops_per_phrase,
    demoLoopActive: false,
    enemyAttackGaugePercent,
    chords: harmonyHudRowsForHud.map(row => ({
      id: row.representativeId,
      name: row.chordName,
      active: Boolean(
        showVoicingTargetHints && activeChord?.id && row.voicingIds.includes(activeChord.id),
      ),
    })),
    phraseSlots: harmonyHudRowsForHud.map(() => '◯'),
    revealedNotes: [],
    currentNoteIndex: currentChordSlotIndex,
    slotKind: 'circle',
    chordCompleted: harmonyCompletedFlags,
    countInValue,
    lastRank,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
  }), [
    activeChord?.id,
    activeLoop,
    harmonyHudRowsForHud,
    harmonyCompletedFlags,
    canChangePracticeMode,
    countInValue,
    currentChordSlotIndex,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyAttackGaugePercent,
    enemyHp,
    enemyName,
    gameState,
    hudLabels,
    isMidiConnected,
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
    resultState,
    showLobbyControls,
    stage.enemy_hp,
    stage.max_loops_per_phrase,
    stage.player_hp,
    stage.title,
    stageStatusText,
    showVoicingTargetHints,
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

  const { staffVoicingGroups, staffDenseCurrentMeasureLayout } = useMemo(() => {
    const phrase = currentPhrase;
    const chords = phrase?.chords ?? [];
    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    if (!phrase || chords.length === 0 || loopDurationSec === null) {
      return {
        staffVoicingGroups: [] as ChordVoicingStaffGroup[],
        staffDenseCurrentMeasureLayout: false,
      };
    }

    const currentMeasureNumber = normalizeMeasureNumber(displayedActiveMeasureNumber, stage.loop_measures);
    const nextMeasureNumber = normalizeMeasureNumber(currentMeasureNumber + 1, stage.loop_measures);
    const slotIndexByMeasure = new Map<number, number>();

    const visibleEntries = chords
      .slice()
      .sort(sortChordsForVoicingDisplay)
      .map(chord => ({
        chord,
        measureNumber: getChordMeasureNumber(chord, loopDurationSec, stage.loop_measures),
      }))
      .filter(({ measureNumber }) => (
        measureNumber === currentMeasureNumber || measureNumber === nextMeasureNumber
      ));

    const harmonyRow = activeChord ? getHarmonyRowForChordId(phrase, activeChord.id) : null;
    const harmonyIdSet = new Set(harmonyRow?.voicingIds ?? []);
    const currentMeasureNoteTotalAll = visibleEntries.reduce((sum, { chord, measureNumber }) => (
      measureNumber === currentMeasureNumber ? sum + (chord.voicing?.length ?? 0) : sum
    ), 0);
    const currentMeasureNoteTotalInActiveHarmony = visibleEntries.reduce((sum, { chord, measureNumber }) => {
      if (measureNumber !== currentMeasureNumber || !harmonyIdSet.has(chord.id)) {
        return sum;
      }
      return sum + (chord.voicing?.length ?? 0);
    }, 0);
    const useWideCurrentMeasure = activeChord
      ? currentMeasureNoteTotalInActiveHarmony >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD
      : currentMeasureNoteTotalAll >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD;
    let nextMeasureVisibleCount = 0;

    const staffVoicingGroups = visibleEntries
      .filter(({ measureNumber }) => {
        if (measureNumber === currentMeasureNumber || !useWideCurrentMeasure) {
          return true;
        }
        nextMeasureVisibleCount += 1;
        return nextMeasureVisibleCount === 1;
      })
      .map(({ chord, measureNumber }) => {
        const slotIndex = slotIndexByMeasure.get(measureNumber) ?? 0;
        slotIndexByMeasure.set(measureNumber, slotIndex + 1);
        const voicing = chord.voicing ?? [];
        return {
          id: chord.id,
          chordName: slotIndex === 0 ? chord.chord_name : '',
          voicing,
          voicingStaves: chord.voicing_staves ?? EMPTY_STAVES,
          measureOffset: (measureNumber === currentMeasureNumber ? 0 : 1) as 0 | 1,
          isRest: voicing.length === 0,
        };
      });

    return {
      staffVoicingGroups,
      staffDenseCurrentMeasureLayout: useWideCurrentMeasure,
    };
  }, [
    activeChord?.id,
    currentPhrase,
    displayedActiveMeasureNumber,
    stage.loop_measures,
  ]);

  const staffCorrectPitchClassesByGroupId = useMemo(() => {
    const correctPitchClassesByGroupId = new Map<string, readonly number[]>();
    if (!attempt) {
      return correctPitchClassesByGroupId;
    }
    staffVoicingGroups.forEach(group => {
      const pressed = attempt.pressedByChord.get(group.id);
      if (pressed) {
        correctPitchClassesByGroupId.set(group.id, Array.from(pressed));
      }
    });
    return correctPitchClassesByGroupId;
  }, [attempt, staffVoicingGroups]);

  const voicingKeyboardHints = useMemo(() => {
    if (!practiceMode || !activeChord) {
      return null;
    }
    if (!showVoicingTargetHints) {
      return null;
    }
    if (attempt?.completedChordIds.has(activeChord.id)) {
      return null;
    }
    const pressed = attempt?.pressedByChord.get(activeChord.id);
    return computeVoicingKeyboardHints(activeChord.voicing, pressed);
  }, [practiceMode, activeChord, attempt, showVoicingTargetHints]);

  useEffect(() => {
    const overlay = pianoOverlayRef.current;
    if (!overlay) {
      return;
    }
    if (!voicingKeyboardHints) {
      overlay.clearVoicingHints();
      return;
    }
    overlay.setVoicingHints(voicingKeyboardHints.pendingMidis, voicingKeyboardHints.completedMidis);
  }, [voicingKeyboardHints]);

  useEffect(() => {
    phaserGameRef.current?.setPlayerQuote(playerQuoteBubbleText);
  }, [playerQuoteBubbleText]);

  return (
    <div className={cn(
      'relative h-[100dvh] w-full overflow-hidden bg-slate-950 text-white',
      feedback === 'miss' && 'bg-red-950',
      feedback === 'clear' && 'bg-white text-slate-950',
    )}>
      <div
        ref={phaserContainerRef}
        className={cn('relative h-full w-full', showLobbyControls ? 'z-30' : 'z-0')}
      >
        <EarTrainingPhaserGame
          ref={phaserGameRef}
          snapshot={battleSnapshot}
          effectCommand={battleEffectCommand}
          callbacks={battleCallbacks}
          className="h-full w-full"
        />
      </div>

      {staffVoicingGroups.length > 0 && (
        <div
          ref={staffOverlayRef}
          className={cn(
            'pointer-events-none absolute left-1/2 top-[44%] w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2',
            showLobbyControls ? 'z-0' : 'z-10',
          )}
        >
          <ChordVoicingStaff
            chordName={activeChord?.chord_name}
            voicingGroups={staffVoicingGroups}
            activeGroupId={activeChord?.id ?? null}
            showTargetHints={showVoicingTargetHints}
            correctPitchClassesByGroupId={staffCorrectPitchClassesByGroupId}
            denseCurrentMeasureLayout={staffDenseCurrentMeasureLayout}
            keyFifths={currentPhrase?.key_fifths ?? stage.key_fifths ?? 0}
            completionPulse={completionPulse}
          />
        </div>
      )}

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
        isMidiConnected={isMidiConnected}
      />
    </div>
  );
};

export default EarTrainingChordVoicingScreen;
