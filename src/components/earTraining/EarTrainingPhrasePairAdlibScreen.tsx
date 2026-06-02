import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuestCompleteJingleOnStageClear, useGameOverJingleOnGameOver } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingPhaserGame from './EarTrainingPhaserGame';
import EarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';
import ChordVoicingStaff, {
  type ChordVoicingStaffGroup,
} from './ChordVoicingStaff';
import type {
  ClearConditions,
  EarTrainingGameState,
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
import { resolveEarTrainingOutcome } from '@/utils/earTrainingEngine';
import {
  applyPhrasePairStepTransition,
  createPhrasePairAdlibWindowState,
  handlePhrasePairAdlibNoteOn,
  type PhrasePairAdlibWindowState,
} from '@/utils/earTrainingPhrasePairBattleEngine';
import {
  createInitialAdlibRuntimeState,
  handleChordChange,
  type AdlibPattern,
  type AdlibRuntimeState,
} from '@/utils/earTrainingPhrasePairEngine';
import type { EarTrainingPhrasePairAdlibStep } from '@/utils/earTrainingPhrasePairAdlibAdapter';
import {
  getNextPhrasePairStepBoundarySec,
  getPhrasePairAdlibPatternsForStep,
  getPhrasePairAdlibStepAtTime,
} from '@/utils/earTrainingPhrasePairTimeline';
import {
  formatEarTrainingCountInDisplay,
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { EarTrainingChordVoicingDrumLoop } from '@/utils/earTrainingChordVoicingDrumLoop';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';
import { unlockFireMagicSe } from '@/utils/earTrainingFireMagicSe';
import {
  buildEarTrainingEnemyBattleSourceKey,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  resolveEarTrainingEnemyAvatarFromBattleSourceKey,
} from '@/utils/earTrainingBattleAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import {
  buildPhrasePairStaffVoicingGroups,
  pickLongestPhrasePairPattern,
} from '@/utils/earTrainingPhrasePairStaff';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingPhrasePairAdlibScreenProps {
  stage: EarTrainingStage;
  enemy: SurvivalCharacterRow | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
const AUDIO_SYNC_EPSILON_SEC = 0.012;
const MIN_AUDIO_SYNC_TIMER_MS = 8;
const BATTLE_EFFECT_DURATION_MS = 720;
const NO_DAMAGE_CONFIG = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};

const getLoopTimeSec = (audioTimeSec: number, loopDurationSec: number): number => {
  const loopTimeSec = audioTimeSec % loopDurationSec;
  return loopTimeSec < 0 ? loopTimeSec + loopDurationSec : loopTimeSec;
};

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const EarTrainingPhrasePairAdlibScreen: React.FC<EarTrainingPhrasePairAdlibScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
  onPracticeModeRestartFromSettings,
}) => {
  const bootstrap = stage.phrasePairAdlibBootstrap;
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

  const steps = useMemo(
    () => bootstrap?.steps ?? [],
    [bootstrap?.steps],
  );
  const patternsByGroupId = useMemo(
    () => bootstrap?.patternsByGroupId ?? {},
    [bootstrap?.patternsByGroupId],
  );
  const loopDurationSec = bootstrap?.loopDurationSec ?? 4;

  const [statusText, setStatusText] = useState(copy.idlePrompt);
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);

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

  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);

  const [phraseRunId, setPhraseRunId] = useState(0);
  const [pairWindow, setPairWindow] = useState<PhrasePairAdlibWindowState>(() => createPhrasePairAdlibWindowState());
  const [matcherState, setMatcherState] = useState<AdlibRuntimeState>(() => createInitialAdlibRuntimeState());
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [timeRemaining, setTimeRemaining] = useState(stage.time_limit_sec);
  const [countInValue, setCountInValue] = useState(stage.count_in_beats);
  const [activeStep, setActiveStep] = useState<EarTrainingPhrasePairAdlibStep | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);
  const [countInEarlyInputActive, setCountInEarlyInputActive] = useState(false);

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const bgmLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const syncAudioTimelineRef = useRef<(options?: { scheduleNext?: boolean }) => void>(() => undefined);
  const pairWindowRef = useRef(pairWindow);
  const matcherStateRef = useRef(matcherState);
  const activeStepRef = useRef<EarTrainingPhrasePairAdlibStep | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const timeRemainingRef = useRef(stage.time_limit_sec);
  const chordSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const countInEarlyInputRef = useRef(false);

  useEffect(() => { pairWindowRef.current = pairWindow; }, [pairWindow]);
  useEffect(() => { matcherStateRef.current = matcherState; }, [matcherState]);
  useEffect(() => { activeStepRef.current = activeStep; }, [activeStep]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);

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

  const ensureBgmLoop = useCallback((): EarTrainingChordVoicingDrumLoop => {
    if (!bgmLoopRef.current) {
      bgmLoopRef.current = new EarTrainingChordVoicingDrumLoop();
    }
    return bgmLoopRef.current;
  }, []);

  const stopBgmLoop = useCallback(() => {
    bgmLoopRef.current?.stop();
  }, []);

  useEffect(() => {
    phrasePlayerRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
    bgmLoopRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.musicVolume]);

  const clearChordSyncTimer = useCallback(() => {
    if (chordSyncTimerRef.current) {
      clearTimeout(chordSyncTimerRef.current);
      chordSyncTimerRef.current = null;
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
    clearChordSyncTimer();
    phrasePlayerRef.current?.stop();
    stopBgmLoop();
  }, [clearChordSyncTimer, stopBgmLoop]);

  const triggerFeedback = useCallback((value: 'correct' | 'miss' | 'clear') => {
    setFeedback(value);
    setTimeout(() => setFeedback(null), 220);
  }, []);

  const triggerBattleEffect = useCallback((
    kind: EarTrainingBattleEffectKind,
    label?: string,
    damage?: number,
  ): number => {
    clearBattleEffectTimers();
    battleEffectIdRef.current += 1;
    const effectId = battleEffectIdRef.current;
    setBattleEffectCommand({ id: effectId, kind, label, damage });
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
    if (!handler) return;
    pendingImpactHandlersRef.current.delete(effectId);
    handler();
  }, []);

  const finishStageClear = useCallback(async () => {
    pendingImpactHandlersRef.current.clear();
    clearTimeLimitTimer();
    gameStateRef.current = 'stageClear';
    stopPhraseAudio();
    setGameState('stageClear');
    setStatusText(copy.stageClear);
    triggerFeedback('clear');

    if (practiceMode || !lessonContext || progressSaveStartedRef.current) {
      return;
    }
    progressSaveStartedRef.current = true;
    await onLessonStageClear('B');
    setProgressSaved(true);
  }, [
    clearTimeLimitTimer,
    copy.stageClear,
    lessonContext,
    onLessonStageClear,
    practiceMode,
    stopPhraseAudio,
    triggerFeedback,
  ]);

  const finishGameOver = useCallback((message: string) => {
    pendingImpactHandlersRef.current.clear();
    clearTimeLimitTimer();
    gameStateRef.current = 'gameOver';
    stopPhraseAudio();
    setGameState('gameOver');
    setStatusText(message);
  }, [clearTimeLimitTimer, stopPhraseAudio]);

  const startTimeLimit = useCallback(() => {
    clearTimeLimitTimer();
    if (practiceMode) return;
    timeLimitTimerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        const next = Math.max(0, prev - 1);
        if (next <= 0) {
          finishGameOver(copy.timeOver);
        }
        return next;
      });
    }, 1000);
  }, [clearTimeLimitTimer, copy.timeOver, finishGameOver, practiceMode]);

  const applyActiveStep = useCallback((
    nextStep: EarTrainingPhrasePairAdlibStep | null,
    patterns: readonly AdlibPattern[],
  ) => {
    const prevStepId = activeStepRef.current?.id ?? null;
    const nextStepId = nextStep?.id ?? null;

    if (nextStepId !== prevStepId) {
      const changedMatcher = handleChordChange(matcherStateRef.current, patterns);
      matcherStateRef.current = changedMatcher;
      setMatcherState(changedMatcher);

      const transitioned = applyPhrasePairStepTransition(pairWindowRef.current, nextStepId);
      pairWindowRef.current = transitioned;
      setPairWindow(transitioned);
    }

    if (nextStep?.id !== activeStepRef.current?.id) {
      setActiveStep(nextStep);
      activeStepRef.current = nextStep;
    }
  }, []);

  const startPairBgmLoop = useCallback(async (): Promise<boolean> => {
    const url = bootstrap?.bgmUrl?.trim();
    if (!url) return false;
    const player = ensurePhrasePlayer();
    const ctx = player.getAudioContext();
    if (!ctx) return false;
    try {
      const drum = ensureBgmLoop();
      await drum.prepare(url, ctx);
      drum.setVolume(settings.masterVolume * settings.musicVolume);
      drum.start();
      return true;
    } catch {
      return false;
    }
  }, [bootstrap?.bgmUrl, ensureBgmLoop, ensurePhrasePlayer, settings.masterVolume, settings.musicVolume]);

  const scheduleNextAudioTimelineSync = useCallback(() => {
    clearChordSyncTimer();
    if (gameStateRef.current !== 'playingPhrase' || !bootstrap) return;
    const drum = bgmLoopRef.current;
    if (!drum) return;

    const audioTimeSec = drum.getPlaybackTimeSec();
    const loopTimeSec = getLoopTimeSec(audioTimeSec, loopDurationSec);
    const nextBoundary = getNextPhrasePairStepBoundarySec(steps, loopTimeSec, loopDurationSec);
    const loopIndex = Math.max(0, Math.floor(audioTimeSec / loopDurationSec));
    const nextAudioSyncTimeSec = nextBoundary === null
      ? (loopIndex + 1) * loopDurationSec
      : (loopIndex * loopDurationSec) + nextBoundary;
    const delayMs = Math.max(
      MIN_AUDIO_SYNC_TIMER_MS,
      (nextAudioSyncTimeSec - audioTimeSec - AUDIO_SYNC_EPSILON_SEC) * 1000,
    );
    chordSyncTimerRef.current = setTimeout(() => {
      chordSyncTimerRef.current = null;
      syncAudioTimelineRef.current();
    }, delayMs);
  }, [bootstrap, clearChordSyncTimer, loopDurationSec, steps]);

  const syncAudioTimeline = useCallback((options?: { scheduleNext?: boolean }) => {
    if (gameStateRef.current !== 'playingPhrase' || !bootstrap) return;
    const drum = bgmLoopRef.current;
    if (!drum) return;

    const audioTimeSec = drum.getPlaybackTimeSec();
    const loopTimeSec = getLoopTimeSec(audioTimeSec, loopDurationSec);
    const nextStep = getPhrasePairAdlibStepAtTime(steps, loopTimeSec, loopDurationSec);
    const patterns = getPhrasePairAdlibPatternsForStep(nextStep, patternsByGroupId);
    applyActiveStep(nextStep, patterns);

    if (options?.scheduleNext !== false) {
      scheduleNextAudioTimelineSync();
    }
  }, [
    applyActiveStep,
    bootstrap,
    loopDurationSec,
    patternsByGroupId,
    scheduleNextAudioTimelineSync,
    steps,
  ]);

  useEffect(() => {
    syncAudioTimelineRef.current = syncAudioTimeline;
  }, [syncAudioTimeline]);

  const handleNoteInput = useCallback((note: number) => {
    const now = performance.now();
    if (now - lastInputAtRef.current < INPUT_COOLDOWN_MS) return;
    lastInputAtRef.current = now;

    const allowEarlyCountIn = gameStateRef.current === 'countIn' && countInEarlyInputRef.current;
    if (gameStateRef.current !== 'playingPhrase' && !allowEarlyCountIn) return;
    if (!allowEarlyCountIn) {
      syncAudioTimelineRef.current({ scheduleNext: false });
      if (gameStateRef.current !== 'playingPhrase') return;
    }

    const step = activeStepRef.current;
    if (!step || !bootstrap) return;

    const patterns = getPhrasePairAdlibPatternsForStep(step, patternsByGroupId);
    const result = handlePhrasePairAdlibNoteOn(
      matcherStateRef.current,
      pairWindowRef.current,
      patterns,
      note,
      activeDamageConfig,
    );

    if (result.nextMatcherState !== matcherStateRef.current) {
      matcherStateRef.current = result.nextMatcherState;
      setMatcherState(result.nextMatcherState);
    }
    if (result.nextWindow !== pairWindowRef.current) {
      pairWindowRef.current = result.nextWindow;
      setPairWindow(result.nextWindow);
    }

    if (result.evaluation.result === 'miss') {
      triggerFeedback('miss');
      setStatusText(copy.tryAgain);
      if (result.playerDamage <= 0) return;
      const missEffectId = triggerBattleEffect('miss', 'MISS', result.playerDamage);
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

    triggerFeedback('correct');
    if (result.evaluation.result === 'complete' && result.evaluation.completedPattern) {
      setStatusText(result.evaluation.completedPattern.label);
    }

    if (!result.shouldFire || result.enemyDamage <= 0) return;

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
        void finishStageClear();
      }
    });
  }, [
    activeDamageConfig,
    bootstrap,
    copy.gameOver,
    copy.tryAgain,
    finishGameOver,
    finishStageClear,
    patternsByGroupId,
    registerBattleEffectImpact,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  const startCountIn = useCallback(() => {
    if (!bootstrap || steps.length === 0) {
      finishGameOver(copy.noPhrases);
      return;
    }
    markAudioUserInteraction();
    void initializeAudioSystem().catch(() => undefined);
    unlockFireMagicSe();
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    countInEarlyInputRef.current = false;
    setCountInEarlyInputActive(false);
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    setTimeRemaining(stage.time_limit_sec);
    setPhraseRunId(prev => prev + 1);
    setBattleEffectCommand(null);
    pendingImpactHandlersRef.current.clear();
    clearTimeLimitTimer();
    clearChordSyncTimer();
    stopPhraseAudio();

    const initialMatcher = createInitialAdlibRuntimeState();
    matcherStateRef.current = initialMatcher;
    setMatcherState(initialMatcher);
    const initialWindow = createPhrasePairAdlibWindowState();
    pairWindowRef.current = initialWindow;
    setPairWindow(initialWindow);
    setActiveStep(null);
    activeStepRef.current = null;

    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    setCountInValue(beats);

    const onPhraseBodyStarted = (): void => {
      countInEarlyInputRef.current = false;
      setCountInEarlyInputActive(false);
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      void startPairBgmLoop().then(ok => {
        if (!ok) {
          setStatusText(copy.audioFailed);
          return;
        }
        startTimeLimit();
        syncAudioTimelineRef.current();
      });
    };

    if (beats <= 0) {
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      void startPairBgmLoop().then(ok => {
        if (!ok) {
          setStatusText(copy.audioFailed);
          return;
        }
        startTimeLimit();
        syncAudioTimelineRef.current();
      });
      return;
    }

    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText(copy.countIn);
    countInEarlyInputRef.current = true;
    setCountInEarlyInputActive(true);
    let remaining = beats;
    setCountInValue(remaining);
    const beatMs = Math.max(1, Math.round(60_000 / stage.bpm));
    const countInterval = setInterval(() => {
      remaining -= 1;
      setCountInValue(remaining);
      if (remaining <= 0) {
        clearInterval(countInterval);
        onPhraseBodyStarted();
      }
    }, beatMs);
  }, [
    bootstrap,
    clearChordSyncTimer,
    clearTimeLimitTimer,
    copy,
    finishGameOver,
    stage.bpm,
    stage.count_in_beats,
    stage.enemy_hp,
    stage.player_hp,
    stage.time_limit_sec,
    startPairBgmLoop,
    startTimeLimit,
    steps.length,
    stopPhraseAudio,
  ]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

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

  useEffect(() => () => {
    pendingImpactHandlersRef.current.clear();
    clearBattleEffectTimers();
    clearChordSyncTimer();
    clearTimeLimitTimer();
    stopPhraseAudio();
    bgmLoopRef.current?.dispose();
    bgmLoopRef.current = null;
    phrasePlayerRef.current?.dispose();
    phrasePlayerRef.current = null;
  }, [
    clearBattleEffectTimers,
    clearChordSyncTimer,
    clearTimeLimitTimer,
    stopPhraseAudio,
  ]);

  const stepHudRows = useMemo(
    () => steps.map(step => ({
      id: step.id,
      chordName: step.chordName,
    })),
    [steps],
  );

  const showVoicingTargetHints =
    gameState === 'playingPhrase'
    || (gameState === 'countIn' && countInEarlyInputActive);

  const staffVoicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
    if (!activeStep) return [];
    const patterns = getPhrasePairAdlibPatternsForStep(activeStep, patternsByGroupId);
    const longestPattern = pickLongestPhrasePairPattern(patterns);
    return buildPhrasePairStaffVoicingGroups(longestPattern, activeStep.chordName);
  }, [activeStep, patternsByGroupId]);

  const enemyName = enemy?.name ?? 'Random Rival';
  const enemyBattleKey = useMemo(
    () => buildEarTrainingEnemyBattleSourceKey(stage.id, enemy ?? { id: 'enemy', name: null }),
    [enemy?.id, enemy?.name, stage.id],
  );
  const { url: enemyAvatar, flipX: enemyAvatarFlipX } =
    resolveEarTrainingEnemyAvatarFromBattleSourceKey(enemyBattleKey);
  const timeLabel = practiceMode ? '∞' : formatTime(timeRemaining);
  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const showLobbyControls = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';
  const stageStatusText = gameState === 'countIn'
    ? formatEarTrainingCountInDisplay(isEnglishCopy, countInValue)
    : statusText;
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);
  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? (progressSaved ? copy.lessonSaved : copy.lessonSaving)
    : null;
  const resultState = gameState === 'stageClear'
    ? 'win' as const
    : gameState === 'gameOver' && statusText === copy.timeOver
      ? 'timeOver' as const
      : gameState === 'gameOver'
        ? 'lose' as const
        : null;

  const currentStepIndex = Math.max(
    0,
    stepHudRows.findIndex(row => row.id === activeStep?.id),
  );

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => ({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    hudLabels,
    phraseIntroLine: '',
    resultRankLine: null,
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
    phraseIndex: 0,
    phraseRunId,
    phraseIntroSeq: 0,
    totalPhrases: 1,
    activeLoop: 1,
    maxLoops: stage.max_loops_per_phrase,
    demoLoopActive: false,
    enemyAttackGaugePercent: 0,
    attackGaugeHidden: true,
    chords: stepHudRows.map(row => ({
      id: row.id,
      name: row.chordName,
      active: showVoicingTargetHints && row.id === activeStep?.id,
    })),
    phraseSlots: stepHudRows.map(() => '◯'),
    revealedNotes: [],
    currentNoteIndex: currentStepIndex,
    slotKind: 'circle',
    chordCompleted: stepHudRows.map(() => false),
    countInValue,
    lastRank: null,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
    quizRulesLine: lessonContext ? undefined : clearConditionLine,
  }), [
    activeStep?.id,
    canChangePracticeMode,
    clearConditionLine,
    countInValue,
    currentStepIndex,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyHp,
    enemyName,
    gameState,
    hudLabels,
    lessonContext,
    lessonProgressText,
    phraseRunId,
    playerHp,
    practiceMode,
    resultState,
    showLobbyControls,
    showVoicingTargetHints,
    stage.enemy_hp,
    stage.max_loops_per_phrase,
    stage.player_hp,
    stage.title,
    stageStatusText,
    startButtonLabel,
    stepHudRows,
    timeLabel,
    isMidiConnected,
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

  if (!bootstrap) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-slate-950 text-white">
        <p>{isEnglishCopy ? 'Stage configuration missing.' : 'ステージ設定がありません。'}</p>
      </div>
    );
  }

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
          className={cn(
            'pointer-events-none absolute left-1/2 top-[44%] w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2',
            showLobbyControls ? 'z-0' : 'z-10',
          )}
        >
          <ChordVoicingStaff
            voicingGroups={staffVoicingGroups}
            activeGroupId={null}
            showTargetHints={showVoicingTargetHints}
            singleMeasureLayout
            fadeAllMeasureNotes
            smuflUseForeignObject
            keyFifths={bootstrap.keyFifths}
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

export default EarTrainingPhrasePairAdlibScreen;
