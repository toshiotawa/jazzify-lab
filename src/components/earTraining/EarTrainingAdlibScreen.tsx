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
  EarTrainingPhrase,
  EarTrainingPhraseChord,
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
  resolveEarTrainingOutcome,
} from '@/utils/earTrainingEngine';
import {
  getEarTrainingChordDisplayAtTime,
  getEarTrainingChordJudgmentTargetsAtTime,
  getEarTrainingHarmonyHudRows,
  getEarTrainingNextChordDisplayBoundarySec,
} from '@/utils/earTrainingChordTimeline';
import {
  applyHarmonyWindowTransition,
  buildAdlibStaffCorrectPitchClassesByGroupId,
  buildAdlibStaffVoicingGroups,
  computeAdlibKeyboardHints,
  createAdlibWindowState,
  getAdlibHarmonyRowForActiveChord,
  getHarmonyUnionPitchClasses,
  handleAdlibNoteOn,
  type EarTrainingAdlibWindowState,
} from '@/utils/earTrainingAdlibEngine';
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
import { getChordVoicingQuoteDisplayText } from '@/utils/earTrainingChordVoicingQuote';
import { applyTutorialBattleSnapshot } from '@/components/earTraining/tutorial/applyTutorialBattleSnapshot';
import {
  isEarTrainingTutorialNoCombat,
} from '@/components/earTraining/tutorial/earTrainingTutorialBindings';
import type { EarTrainingTutorialAdlibConfig } from '@/components/earTraining/tutorial/earTrainingTutorialSceneConfig';
import { computeTutorialMeasureClearDelayMs } from '@/utils/earTrainingTutorialMeasureClear';
import {
  scheduleOsmdTimedLinesForLoop,
  type DialogueScheduleHandle,
} from '@/components/earTraining/tutorial/scheduleTimedDialogueLines';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingAdlibScreenProps {
  stage: EarTrainingStage;
  enemy: SurvivalCharacterRow | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
  tutorial?: EarTrainingTutorialAdlibConfig & { onSceneComplete: () => void };
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
const EMPTY_COMPLETED_CHORD_IDS = new Set<string>();

const getFinitePhraseLoopDuration = (phrase: EarTrainingPhrase): number | null => {
  const loopDurationSec = Number(phrase.loop_duration_sec);
  return Number.isFinite(loopDurationSec) && loopDurationSec > 0 ? loopDurationSec : null;
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

const EarTrainingAdlibScreen: React.FC<EarTrainingAdlibScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
  onPracticeModeRestartFromSettings,
  tutorial,
}) => {
  const { settings, updateSettings } = useGameStore();
  const tutorialUi = tutorial?.bindings.ui;
  const tutorialNoCombat = isEarTrainingTutorialNoCombat(tutorialUi);
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
    () => (practiceMode || tutorialNoCombat ? NO_DAMAGE_CONFIG : damageConfig),
    [damageConfig, practiceMode, tutorialNoCombat],
  );

  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);

  const [phraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [adlibWindow, setAdlibWindow] = useState<EarTrainingAdlibWindowState>(() => createAdlibWindowState());
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [timeRemaining, setTimeRemaining] = useState(stage.time_limit_sec);
  const [countInValue, setCountInValue] = useState(stage.count_in_beats);
  const [activeChord, setActiveChord] = useState<EarTrainingPhraseChord | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const bgmLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const syncAudioTimelineRef = useRef<(options?: { scheduleNext?: boolean }) => void>(() => undefined);
  const adlibWindowRef = useRef(adlibWindow);
  const activeChordRef = useRef<EarTrainingPhraseChord | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const timeRemainingRef = useRef(stage.time_limit_sec);
  const chordSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tutorialDialogueHandleRef = useRef<DialogueScheduleHandle | null>(null);
  const timeLimitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const countInEarlyInputRef = useRef(false);
  const [countInEarlyInputActive, setCountInEarlyInputActive] = useState(false);

  const currentPhrase = phrases[phraseIndex];

  useEffect(() => { adlibWindowRef.current = adlibWindow; }, [adlibWindow]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
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

  const clearTutorialTimers = useCallback(() => {
    tutorialDialogueHandleRef.current?.cancel();
    tutorialDialogueHandleRef.current = null;
    if (tutorialClearTimerRef.current) {
      clearTimeout(tutorialClearTimerRef.current);
      tutorialClearTimerRef.current = null;
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
    clearTutorialTimers();
    phrasePlayerRef.current?.stop();
    stopBgmLoop();
  }, [clearChordSyncTimer, clearTutorialTimers, stopBgmLoop]);

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
    if (!handler) {
      return;
    }
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
  }, [clearTimeLimitTimer, copy.timeOver, finishGameOver, practiceMode]);

  const startAdlibBgmLoop = useCallback(async (phrase: EarTrainingPhrase): Promise<boolean> => {
    const url = phrase.audio_url?.trim();
    if (!url) {
      return false;
    }
    const player = ensurePhrasePlayer();
    const ctx = player.ensureAudioContext();
    try {
      const drum = ensureBgmLoop();
      await drum.prepare(url, ctx);
      drum.setVolume(settings.masterVolume * settings.musicVolume);
      drum.start();
      return true;
    } catch {
      return false;
    }
  }, [ensureBgmLoop, ensurePhrasePlayer, settings.masterVolume, settings.musicVolume]);

  const scheduleNextAudioTimelineSync = useCallback(() => {
    clearChordSyncTimer();
    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }
    const phrase = phrases[phraseIndex];
    if (!phrase) {
      return;
    }
    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    if (loopDurationSec === null) {
      return;
    }
    const drum = bgmLoopRef.current;
    if (!drum) {
      return;
    }
    const audioTimeSec = drum.getPlaybackTimeSec();
    const loopTimeSec = getLoopTimeSec(audioTimeSec, loopDurationSec);
    const nextLoopBoundarySec = getEarTrainingNextChordDisplayBoundarySec(
      phrase,
      loopTimeSec,
      stage.bpm,
      EMPTY_COMPLETED_CHORD_IDS,
      loopDurationSec,
    );
    const loopIndex = Math.max(0, Math.floor(audioTimeSec / loopDurationSec));
    const nextAudioSyncTimeSec = nextLoopBoundarySec === null
      ? (loopIndex + 1) * loopDurationSec
      : (loopIndex * loopDurationSec) + nextLoopBoundarySec;
    const delayMs = Math.max(
      MIN_AUDIO_SYNC_TIMER_MS,
      (nextAudioSyncTimeSec - audioTimeSec - AUDIO_SYNC_EPSILON_SEC) * 1000,
    );
    chordSyncTimerRef.current = setTimeout(() => {
      chordSyncTimerRef.current = null;
      syncAudioTimelineRef.current();
    }, delayMs);
  }, [clearChordSyncTimer, phraseIndex, phrases, stage.bpm]);

  const syncAudioTimeline = useCallback((options?: { scheduleNext?: boolean }) => {
    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }
    const phrase = phrases[phraseIndex];
    if (!phrase) {
      return;
    }
    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    const drum = bgmLoopRef.current;
    if (loopDurationSec === null || !drum) {
      return;
    }
    const audioTimeSec = drum.getPlaybackTimeSec();
    const loopTimeSec = getLoopTimeSec(audioTimeSec, loopDurationSec);
    const nextChord = getEarTrainingChordDisplayAtTime(
      phrase,
      loopTimeSec,
      stage.bpm,
      EMPTY_COMPLETED_CHORD_IDS,
      loopDurationSec,
    );
    const harmonyRow = getAdlibHarmonyRowForActiveChord(phrase, nextChord);
    const repId = harmonyRow?.representativeId ?? null;
    const regionChanged = repId !== adlibWindowRef.current.harmonyRepresentativeId;
    const enteredInputDisabled = Boolean(nextChord?.input_disabled);
    if (regionChanged || enteredInputDisabled) {
      const nextWindow = createAdlibWindowState(repId);
      adlibWindowRef.current = nextWindow;
      setAdlibWindow(nextWindow);
    } else {
      const transitioned = applyHarmonyWindowTransition(adlibWindowRef.current, repId);
      if (transitioned !== adlibWindowRef.current) {
        adlibWindowRef.current = transitioned;
        setAdlibWindow(transitioned);
      }
    }
    if (nextChord?.id !== activeChordRef.current?.id) {
      setActiveChord(nextChord);
      activeChordRef.current = nextChord;
    }
    if (options?.scheduleNext !== false) {
      scheduleNextAudioTimelineSync();
    }
  }, [phraseIndex, phrases, scheduleNextAudioTimelineSync, stage.bpm]);

  useEffect(() => {
    syncAudioTimelineRef.current = syncAudioTimeline;
  }, [syncAudioTimeline]);

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
    if (!allowEarlyCountIn) {
      syncAudioTimelineRef.current({ scheduleNext: false });
      if (gameStateRef.current !== 'playingPhrase') {
        return;
      }
    }

    const phrase = phrases[phraseIndex];
    const displayChord = activeChordRef.current;
    const harmonyRow = getAdlibHarmonyRowForActiveChord(phrase, displayChord);
    if (!phrase || !harmonyRow) {
      return;
    }

    if (displayChord?.input_disabled) {
      return;
    }

    const loopDurationSec = getFinitePhraseLoopDuration(phrase);
    let loopTimeSec = 0;
    if (!allowEarlyCountIn) {
      const drum = bgmLoopRef.current;
      if (loopDurationSec === null || !drum) {
        return;
      }
      loopTimeSec = getLoopTimeSec(drum.getPlaybackTimeSec(), loopDurationSec);
    }

    const targets = getEarTrainingChordJudgmentTargetsAtTime(
      phrase,
      loopTimeSec,
      stage.bpm,
      EMPTY_COMPLETED_CHORD_IDS,
      displayChord,
      loopDurationSec ?? undefined,
    );

    const unionPcs = new Set(getHarmonyUnionPitchClasses(phrase, harmonyRow));
    if (targets.overlap && !targets.overlap.input_disabled) {
      const overlapRow = getAdlibHarmonyRowForActiveChord(phrase, targets.overlap);
      if (overlapRow) {
        getHarmonyUnionPitchClasses(phrase, overlapRow).forEach(pc => unionPcs.add(pc));
      }
    }

    const result = handleAdlibNoteOn(
      adlibWindowRef.current,
      unionPcs,
      note,
      activeDamageConfig,
    );
    if (result.nextWindow !== adlibWindowRef.current) {
      adlibWindowRef.current = result.nextWindow;
      setAdlibWindow(result.nextWindow);
    }

    if (result.kind === 'miss') {
      triggerFeedback('miss');
      setStatusText(copy.tryAgain);
      if (result.playerDamage <= 0) {
        return;
      }
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
    if (!result.shouldFire || result.enemyDamage <= 0) {
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
        void finishStageClear();
      }
    });
  }, [
    activeDamageConfig,
    copy.gameOver,
    copy.tryAgain,
    finishGameOver,
    finishStageClear,
    phraseIndex,
    phrases,
    registerBattleEffectImpact,
    stage.bpm,
    triggerBattleEffect,
    triggerFeedback,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  const startCountIn = useCallback(() => {
    if (phrases.length === 0) {
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
    setPhraseIntroSeq(prev => prev + 1);
    setBattleEffectCommand(null);
    pendingImpactHandlersRef.current.clear();
    clearTimeLimitTimer();
    clearChordSyncTimer();
    stopPhraseAudio();
    const initialWindow = createAdlibWindowState();
    adlibWindowRef.current = initialWindow;
    setAdlibWindow(initialWindow);
    setActiveChord(null);
    activeChordRef.current = null;

    const firstPhrase = phrases[0];
    if (!firstPhrase) {
      finishGameOver(copy.noPhrases);
      return;
    }

    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    setCountInValue(beats);

    const scheduleTutorialSession = (): void => {
      if (!tutorial) {
        return;
      }
      clearTutorialTimers();
      const loopDurationSec = getFinitePhraseLoopDuration(firstPhrase) ?? 4;
      const timedLines = tutorial.scene.timedLines;
      if (timedLines && timedLines.length > 0) {
        tutorialDialogueHandleRef.current = scheduleOsmdTimedLinesForLoop({
          bpm: stage.bpm,
          beatsPerMeasure: stage.beats_per_measure,
          countInBeats: stage.count_in_beats,
          loopMeasures: stage.loop_measures,
          phraseLoopDurationSec: loopDurationSec,
          timedLines,
          isEnglishCopy,
          onLine: (text) => {
            phaserGameRef.current?.setPlayerQuote(text);
          },
          loopIndex: 0,
        });
      }
      const delayMs = computeTutorialMeasureClearDelayMs(
        stage.bpm,
        stage.beats_per_measure,
        stage.count_in_beats,
        tutorial.scene.requiredMeasures,
      );
      tutorialClearTimerRef.current = setTimeout(() => {
        tutorialClearTimerRef.current = null;
        tutorial.onSceneComplete();
      }, delayMs);
    };

    const onPhraseBodyStarted = (): void => {
      countInEarlyInputRef.current = false;
      setCountInEarlyInputActive(false);
      setCountInValue(0);
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      void startAdlibBgmLoop(firstPhrase).then(ok => {
        if (!ok) {
          setStatusText(copy.audioFailed);
          return;
        }
        if (!tutorial) {
          startTimeLimit();
        }
        scheduleTutorialSession();
        syncAudioTimelineRef.current();
      });
    };

    if (beats <= 0) {
      setCountInValue(0);
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      void startAdlibBgmLoop(firstPhrase).then(ok => {
        if (!ok) {
          setStatusText(copy.audioFailed);
          return;
        }
        if (!tutorial) {
          startTimeLimit();
        }
        scheduleTutorialSession();
        syncAudioTimelineRef.current();
      });
      return;
    }

    gameStateRef.current = 'countIn';
    setGameState('countIn');
    setStatusText(copy.countIn);
    void (async () => {
      const player = ensurePhrasePlayer();
      let prepared;
      try {
        prepared = await player.prepare(firstPhrase.audio_url);
      } catch {
        setStatusText(copy.audioFailed);
        return;
      }
      player.schedulePreparedPhraseWithCountIn({
        prepared,
        countInBeats: beats,
        bpm: stage.bpm,
        beatGain: settings.masterVolume * settings.musicVolume,
        phraseGain: 0,
        onBeat: remaining => {
          setCountInValue(remaining);
        },
        onInputWindowStart: () => {
          countInEarlyInputRef.current = true;
          setCountInEarlyInputActive(true);
        },
        onPhraseStarted: () => {
          if (!tutorial) {
            startTimeLimit();
          }
          onPhraseBodyStarted();
        },
        onEnded: () => undefined,
      });
    })();
  }, [
    clearChordSyncTimer,
    clearTimeLimitTimer,
    copy,
    ensurePhrasePlayer,
    finishGameOver,
    phrases,
    settings.masterVolume,
    settings.musicVolume,
    stage.bpm,
    stage.count_in_beats,
    stage.enemy_hp,
    stage.player_hp,
    stage.time_limit_sec,
    startAdlibBgmLoop,
    startTimeLimit,
    stopPhraseAudio,
    tutorial,
    clearTutorialTimers,
    isEnglishCopy,
  ]);

  useEffect(() => {
    if (!tutorial?.bindings.ui.hideLobby) {
      return;
    }
    if (gameState === 'idle') {
      startCountIn();
    }
  }, [gameState, startCountIn, tutorial?.bindings.ui.hideLobby]);

  const playerQuoteBubbleText = useMemo(() => {
    if (!activeChord) {
      return null;
    }
    return getChordVoicingQuoteDisplayText(activeChord);
  }, [activeChord]);

  useEffect(() => {
    phaserGameRef.current?.setPlayerQuote(playerQuoteBubbleText);
  }, [playerQuoteBubbleText]);

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

  const harmonyCompletedFlags = useMemo(
    () => harmonyHudRowsForHud.map(() => false),
    [harmonyHudRowsForHud],
  );

  const showVoicingTargetHints =
    gameState === 'playingPhrase'
    || (gameState === 'countIn' && countInEarlyInputActive);
  const showKeyboardTargetHints = practiceMode || stage.show_keyboard_hints_in_battle === true;

  const activeHarmonyRow = useMemo(
    () => getAdlibHarmonyRowForActiveChord(currentPhrase, activeChord),
    [activeChord, currentPhrase],
  );

  const staffVoicingGroups = useMemo((): readonly ChordVoicingStaffGroup[] => {
    if (!activeHarmonyRow) {
      return [];
    }
    return buildAdlibStaffVoicingGroups(currentPhrase, activeHarmonyRow);
  }, [activeHarmonyRow, currentPhrase]);

  const staffCorrectPitchClassesByGroupId = useMemo(
    () => buildAdlibStaffCorrectPitchClassesByGroupId(
      staffVoicingGroups,
      adlibWindow.pressedPitchClasses,
    ),
    [adlibWindow.pressedPitchClasses, staffVoicingGroups],
  );

  const voicingKeyboardHints = useMemo(() => {
    if (!showKeyboardTargetHints || !showVoicingTargetHints || !activeHarmonyRow) {
      return null;
    }
    return computeAdlibKeyboardHints(
      currentPhrase,
      activeHarmonyRow,
      adlibWindow.pressedPitchClasses,
    );
  }, [
    activeHarmonyRow,
    adlibWindow.pressedPitchClasses,
    currentPhrase,
    showKeyboardTargetHints,
    showVoicingTargetHints,
  ]);

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
  }, [voicingKeyboardHints, gameState, phraseRunId]);

  const enemyName = enemy?.name ?? 'Random Rival';
  const enemyBattleKey = useMemo(
    () => buildEarTrainingEnemyBattleSourceKey(stage.id, enemy ?? { id: 'enemy', name: null }),
    [enemy?.id, enemy?.name, stage.id],
  );
  const { url: enemyAvatar, flipX: enemyAvatarFlipX } =
    resolveEarTrainingEnemyAvatarFromBattleSourceKey(enemyBattleKey);
  const timeLabel = practiceMode ? '∞' : formatTime(timeRemaining);
  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const showLobbyControls = tutorial
    ? false
    : gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';
  const stageStatusText = gameState === 'countIn'
    ? formatEarTrainingCountInDisplay(isEnglishCopy, countInValue)
    : statusText;
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);
  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? (progressSaved ? copy.lessonSaved : copy.lessonSaving)
    : null;
  const phraseIntroLine = '';
  void phraseIntroSeq;
  const resultState = gameState === 'stageClear'
    ? 'win' as const
    : gameState === 'gameOver' && statusText === copy.timeOver
      ? 'timeOver' as const
      : gameState === 'gameOver'
        ? 'lose' as const
        : null;

  const currentHarmonySlotIndex = Math.max(
    0,
    harmonyHudRowsForHud.findIndex(
      row => row.representativeId === activeHarmonyRow?.representativeId,
    ),
  );

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => applyTutorialBattleSnapshot({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    hudLabels,
    phraseIntroLine,
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
    phraseIndex,
    phraseRunId,
    phraseIntroSeq,
    totalPhrases: phrases.length,
    activeLoop: 1,
    maxLoops: stage.max_loops_per_phrase,
    demoLoopActive: false,
    enemyAttackGaugePercent: 0,
    attackGaugeHidden: true,
    chords: harmonyHudRowsForHud.map(row => ({
      id: row.representativeId,
      name: row.chordName,
      active: Boolean(
        showVoicingTargetHints
        && activeChord?.id
        && row.voicingIds.includes(activeChord.id),
      ),
    })),
    phraseSlots: harmonyHudRowsForHud.map(() => '◯'),
    phraseSlotsHidden: true,
    revealedNotes: [],
    currentNoteIndex: currentHarmonySlotIndex,
    slotKind: 'circle',
    chordCompleted: harmonyCompletedFlags,
    countInValue: gameState === 'countIn' ? countInValue : 0,
    lastRank: null,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
    quizRulesLine: lessonContext ? undefined : clearConditionLine,
  }, tutorialUi ?? {
    hidePlayerHpBar: false,
    hideSettingsButton: false,
    hideBackButton: false,
    hideLobby: false,
    hideMidiToggle: false,
    hidePhraseIntroQuota: false,
    showExitButton: false,
    playerInvincible: false,
    disableEnemyAttacks: false,
    keyboardHintsDefault: false,
  }), [
    activeChord?.id,
    activeHarmonyRow?.representativeId,
    canChangePracticeMode,
    clearConditionLine,
    countInValue,
    currentHarmonySlotIndex,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyHp,
    enemyName,
    gameState,
    harmonyCompletedFlags,
    harmonyHudRowsForHud,
    hudLabels,
    lessonContext,
    lessonProgressText,
    phraseIndex,
    phraseIntroLine,
    phraseIntroSeq,
    phraseRunId,
    phrases.length,
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
    timeLabel,
    isMidiConnected,
    tutorialUi,
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
      <div
        ref={phaserContainerRef}
        className={cn('relative h-full w-full', showLobbyControls ? 'z-30' : 'z-0')}
      >
        <EarTrainingPhaserGame
          ref={phaserGameRef}
          snapshot={battleSnapshot}
          effectCommand={battleEffectCommand}
          callbacks={battleCallbacks}
          disableCorrectSe
          className="h-full w-full"
        />
      </div>

      {staffVoicingGroups.length > 0 && !staffVoicingGroups.every(group => group.isRest) && (
        <div
          className={cn(
            'pointer-events-none absolute left-1/2 top-[44%] w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2',
            showLobbyControls ? 'z-0' : 'z-10',
          )}
        >
          <ChordVoicingStaff
            chordName={activeHarmonyRow?.chordName}
            voicingGroups={staffVoicingGroups}
            activeGroupId={null}
            showTargetHints={showVoicingTargetHints}
            correctPitchClassesByGroupId={staffCorrectPitchClassesByGroupId}
            singleMeasureLayout
            keyFifths={currentPhrase?.key_fifths ?? stage.key_fifths ?? 0}
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

export default EarTrainingAdlibScreen;
