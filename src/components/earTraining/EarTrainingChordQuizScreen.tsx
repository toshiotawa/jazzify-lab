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
  EarTrainingStage,
} from '@/types';
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
import type {
  EarTrainingBattleEffectKind,
  EarTrainingBattleEffectOriginPoint,
  EarTrainingBattleSceneHandle,
  EarTrainingBattleSnapshot,
} from '@/game/earTraining/types';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import {
  MIDIController,
  markAudioUserInteraction,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import {
  createChordVoicingAttempt,
  handleChordVoicingNoteOn,
} from '@/utils/earTrainingChordVoicingEngine';
import { resolveEarTrainingOutcome } from '@/utils/earTrainingEngine';
import { computeVoicingKeyboardHints } from '@/utils/earTrainingChordVoicingHints';
import { getEarTrainingBattleHudLabels, getEarTrainingGameCopy, formatEarTrainingChordQuizIntroLine } from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  EarTrainingChordVoicingDrumLoop,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';
import {
  buildEarTrainingChordQuizQuestions,
  getActiveChordInQuizQuestion,
  isChordQuizQuestionCompleted,
  isQuizClear,
  pickNextQuizIndex,
  type EarTrainingChordQuizQuestion,
} from '@/utils/earTrainingChordQuiz';
import {
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { parseVoicingNoteName } from '@/utils/voicingMusicXml';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import { applyTutorialBattleSnapshot } from '@/components/earTraining/tutorial/applyTutorialBattleSnapshot';
import {
  clampTutorialPlayerHp,
  isEarTrainingTutorialNoCombat,
  shouldTutorialBlockGameOver,
} from '@/components/earTraining/tutorial/earTrainingTutorialBindings';
import type { EarTrainingTutorialQuizConfig } from '@/components/earTraining/tutorial/earTrainingTutorialSceneConfig';
import { localizedText } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingChordQuizScreenProps {
  stage: EarTrainingStage;
  enemy: SurvivalCharacterRow | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
  tutorial?: EarTrainingTutorialQuizConfig & { onSceneComplete: () => void };
}

const INPUT_COOLDOWN_MS = 20;
const QUIZ_EFFECT_MS = 820;
/** 正解後、譜面の次小節→現在小節の表示切替を遅らせる（CSS 完成パルスが見えるようにする） */
const MEASURE_SHIFT_DELAY_MS = 100;
/** コードクイズ本番の敵 HP（演出・クリア条件用。DB の enemy_hp とは独立） */
const QUIZ_BATTLE_ENEMY_HP = 10_000;
const QUIZ_ATTACK_GAUGE_FILL_MS = 5000;
const QUIZ_ENEMY_STRIKE_DAMAGE = 5;

const QUIZ_ZERO_NOTE_DAMAGE = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};
const EMPTY_STAVES: readonly number[] = [];

const clampGaugeRatio = (value: number): number => Math.min(1, Math.max(0, value));

const randomIntInclusive = (min: number, max: number, rand: () => number): number => (
  Math.floor(rand() * (max - min + 1)) + min
);

const voicingToPitchClasses = (voicing: readonly string[]): readonly number[] => {
  const pcs: number[] = [];
  for (const noteName of voicing) {
    try {
      pcs.push(parseVoicingNoteName(noteName).midi % 12);
    } catch {
      /* 無効な音名はスキップ */
    }
  }
  return pcs;
};

const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${minutes}:${rest.toString().padStart(2, '0')}`;
};

const buildQuizPhrase = (stageId: string, question: EarTrainingChordQuizQuestion, runKey: number): EarTrainingPhrase => {
  const phraseId = `chord-quiz-${question.id}-${runKey}`;
  return {
    id: phraseId,
    stage_id: stageId,
    order_index: 0,
    key_fifths: question.key_fifths,
    audio_url: CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
    loop_duration_sec: 2,
    audio_duration_sec: 2,
    note_count: 0,
    chords: question.chords.map(chord => ({
      ...chord,
      phrase_id: phraseId,
    })),
  };
};

const getQuestionKeyFifths = (
  question: EarTrainingChordQuizQuestion | null,
  stage: EarTrainingStage,
): number => question?.key_fifths ?? stage.key_fifths ?? 0;

const getQuestionNoteTotal = (question: EarTrainingChordQuizQuestion | null): number => (
  question?.chords.reduce((sum, chord) => sum + (chord.voicing?.length ?? 0), 0) ?? 0
);

const getQuestionChordViews = (
  question: EarTrainingChordQuizQuestion | null,
  activeChordId: string | null,
  active: boolean,
): { id: string; name: string; active: boolean }[] => (
  question?.chords.map(chord => ({
    id: chord.id,
    name: chord.chord_name,
    active: active && chord.id === activeChordId,
  })) ?? []
);

const buildQuestionStaffGroups = (
  question: EarTrainingChordQuizQuestion | null,
  measureOffset: 0 | 1,
): ChordVoicingStaffGroup[] => (
  question?.chords.map((chord, index) => ({
    id: chord.id,
    chordName: index === 0 ? chord.chord_name : '',
    voicing: chord.voicing ?? [],
    voicingStaves: chord.voicing_staves ?? EMPTY_STAVES,
    measureOffset,
    isRest: (chord.voicing?.length ?? 0) === 0,
  })) ?? []
);

const EarTrainingChordQuizScreen: React.FC<EarTrainingChordQuizScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
  onPracticeModeRestartFromSettings,
  tutorial,
}) => {
  const tutorialUi = tutorial?.bindings.ui;
  const tutorialNoCombat = isEarTrainingTutorialNoCombat(tutorialUi);
  const [tutorialQuestionsAnswered, setTutorialQuestionsAnswered] = useState(0);
  /** 正解直後の遷移待ちでは進めない（プレビュー小節の表示制御用）。 */
  const [tutorialQuestionIndex, setTutorialQuestionIndex] = useState(0);
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

  const quizQuestions = useMemo(
    () => buildEarTrainingChordQuizQuestions(stage),
    [stage],
  );
  const quizOrder = tutorial
    ? (tutorial.scene.order === 'progression' ? 'sequential' : 'random')
    : (stage.quiz_question_order === 'sequential' ? 'sequential' : 'random');
  const quizDurationSec = stage.quiz_duration_seconds ?? 90;
  const requiredCorrect = stage.quiz_required_correct_count ?? 80;
  const hideNotationInBattle = stage.quiz_show_notation_in_battle === false;

  const [statusText, setStatusText] = useState(copy.idlePrompt);
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [previewQuestionIndex, setPreviewQuestionIndex] = useState(0);
  const [displayedActiveQuestionIndex, setDisplayedActiveQuestionIndex] = useState(0);
  const [displayedPreviewQuestionIndex, setDisplayedPreviewQuestionIndex] = useState(0);
  const [attempt, setAttempt] = useState<EarTrainingChordVoicingAttempt | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(quizDurationSec);
  const [enemyHp, setEnemyHp] = useState(QUIZ_BATTLE_ENEMY_HP);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [countInValue, setCountInValue] = useState(0);
  const [enemyAttackGaugePercent, setEnemyAttackGaugePercentState] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'clear' | null>(null);
  const [completionPulse, setCompletionPulse] = useState<ChordVoicingCompletionPulse | null>(null);
  const completionPulseEventKeyRef = useRef(0);
  const [battleEffectCommand, setBattleEffectCommand] = useState<{
    id: number;
    kind: EarTrainingBattleEffectKind;
    label?: string;
    damage?: number;
    phraseNoteCount?: number;
    originPoint?: EarTrainingBattleEffectOriginPoint;
  } | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const selfPacedDrumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const chordVoicingPhrasePlayerStubRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const phaserContainerRef = useRef<HTMLDivElement | null>(null);
  const staffOverlayRef = useRef<HTMLDivElement | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const attemptRef = useRef<EarTrainingChordVoicingAttempt | null>(null);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const correctCountRef = useRef(0);
  const lastInputAtRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const quizTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, () => void>>(new Map());
  const staffShiftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staffShiftQueueRef = useRef<Array<{ active: number; preview: number }>>([]);
  const quizStartedAtRef = useRef<number | null>(null);
  const quizEndedRef = useRef(false);
  const phraseRunNonceRef = useRef(0);
  const quotaCelebrationFiredRef = useRef(false);
  const randRef = useRef(() => Math.random());
  const enemyHpRef = useRef(enemyHp);
  const playerHpRef = useRef(playerHp);
  const timeRemainingRef = useRef(timeRemaining);
  const practiceModeRef = useRef(practiceMode);
  const attackGaugeEpochMsRef = useRef<number | null>(null);
  const enemyAttackGaugePercentRef = useRef(0);

  const showTutorialQuestionDialogue = useCallback(() => {
    if (!tutorial) {
      return;
    }
    tutorial.bindings.setCharacterText(
      localizedText(tutorial.scene.dialogue.onQuestion, isEnglishCopy),
    );
  }, [isEnglishCopy, tutorial]);

  const setEnemyAttackGaugePercent = useCallback((value: number) => {
    const next = clampGaugeRatio(value);
    if (Math.abs(next - enemyAttackGaugePercentRef.current) < 0.004 && next !== 0 && next !== 1) {
      return;
    }
    enemyAttackGaugePercentRef.current = next;
    setEnemyAttackGaugePercentState(next);
  }, []);

  const clearStaffShiftQueue = useCallback(() => {
    if (staffShiftTimerRef.current !== null) {
      clearTimeout(staffShiftTimerRef.current);
      staffShiftTimerRef.current = null;
    }
    staffShiftQueueRef.current = [];
  }, []);

  const runStaffShiftQueue = useCallback(() => {
    if (staffShiftTimerRef.current !== null) {
      return;
    }
    const step = () => {
      staffShiftTimerRef.current = null;
      const next = staffShiftQueueRef.current.shift();
      if (next) {
        setDisplayedActiveQuestionIndex(next.active);
        setDisplayedPreviewQuestionIndex(next.preview);
      }
      if (staffShiftQueueRef.current.length > 0) {
        staffShiftTimerRef.current = setTimeout(step, MEASURE_SHIFT_DELAY_MS);
      }
    };
    staffShiftTimerRef.current = setTimeout(step, MEASURE_SHIFT_DELAY_MS);
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

  const activeQuestion = quizQuestions[activeQuestionIndex] ?? null;
  const previewQuestion = quizQuestions[previewQuestionIndex] ?? null;
  const shouldShowQuizPreview = useMemo(() => {
    if (!previewQuestion || !activeQuestion || previewQuestion.id === activeQuestion.id) {
      return false;
    }
    if (tutorial) {
      const target = Math.max(1, tutorial.scene.questionCount);
      return tutorialQuestionIndex + 1 < target;
    }
    const required = Math.max(1, stage.quiz_required_correct_count ?? 10);
    return correctCount + 1 < required;
  }, [activeQuestion, correctCount, previewQuestion, stage.quiz_required_correct_count, tutorial, tutorialQuestionIndex]);
  const activeChord = useMemo(
    () => getActiveChordInQuizQuestion(activeQuestion, attempt?.completedChordIds),
    [activeQuestion, attempt],
  );
  const displayedActiveQuestion = quizQuestions[displayedActiveQuestionIndex] ?? null;
  const displayedPreviewQuestion = shouldShowQuizPreview
    ? (quizQuestions[displayedPreviewQuestionIndex] ?? null)
    : null;
  useEffect(() => { attemptRef.current = attempt; }, [attempt]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { timeRemainingRef.current = timeRemaining; }, [timeRemaining]);
  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.midiVolume]);

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
    selfPacedDrumLoopRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.musicVolume]);

  const clearQuizTimer = useCallback(() => {
    if (quizTimerRef.current) {
      clearInterval(quizTimerRef.current);
      quizTimerRef.current = null;
    }
  }, []);

  const clearCountdownTimer = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }, []);

  const clearBattleEffectTimers = useCallback(() => {
    if (battleEffectClearTimerRef.current) {
      clearTimeout(battleEffectClearTimerRef.current);
      battleEffectClearTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearQuizTimer();
    clearCountdownTimer();
    clearBattleEffectTimers();
    clearStaffShiftQueue();
    chordVoicingPhrasePlayerStubRef.current?.dispose();
    chordVoicingPhrasePlayerStubRef.current = null;
    selfPacedDrumLoopRef.current?.dispose();
    selfPacedDrumLoopRef.current = null;
    return () => undefined;
  }, [clearBattleEffectTimers, clearCountdownTimer, clearQuizTimer, clearStaffShiftQueue]);

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
    }, QUIZ_EFFECT_MS);
    return effectId;
  }, [clearBattleEffectTimers]);

  const computeChordLabelOriginPoint = useCallback((groupId: string | null | undefined) => {
    if (!groupId) {
      return undefined;
    }
    const overlay = staffOverlayRef.current;
    const container = phaserContainerRef.current;
    if (!overlay || !container) {
      return undefined;
    }
    const labelEl = overlay.querySelector(`text[data-voicing-group-id="${groupId}"][data-voicing-group-active="true"]`);
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

  const handleBattleEffectImpact = useCallback((effectId: number) => {
    const handler = pendingImpactHandlersRef.current.get(effectId);
    if (!handler) {
      return;
    }
    pendingImpactHandlersRef.current.delete(effectId);
    handler();
  }, []);

  const finishQuizSuccess = useCallback(async () => {
    pendingImpactHandlersRef.current.clear();
    clearStaffShiftQueue();
    clearQuizTimer();
    clearCountdownTimer();
    gameStateRef.current = 'stageClear';
    stopSelfPacedDrumLoop();
    setGameState('stageClear');
    setStatusText(isEnglishCopy ? 'CLEAR!' : 'クリア!');
    setFeedback('clear');
    setTimeout(() => setFeedback(null), 220);

    if (practiceMode || !lessonContext || progressSaveStartedRef.current) {
      return;
    }
    progressSaveStartedRef.current = true;
    await onLessonStageClear('S');
    setProgressSaved(true);
  }, [
    clearQuizTimer,
    isEnglishCopy,
    lessonContext,
    onLessonStageClear,
    practiceMode,
    stopSelfPacedDrumLoop,
    clearCountdownTimer,
    clearStaffShiftQueue,
  ]);

  const finishQuizFail = useCallback(() => {
    pendingImpactHandlersRef.current.clear();
    clearStaffShiftQueue();
    clearQuizTimer();
    clearCountdownTimer();
    gameStateRef.current = 'gameOver';
    stopSelfPacedDrumLoop();
    setGameState('gameOver');
    setStatusText(isEnglishCopy ? 'Try again' : '残念…');
  }, [clearCountdownTimer, clearQuizTimer, clearStaffShiftQueue, isEnglishCopy, stopSelfPacedDrumLoop]);

  const evaluateTimeUp = useCallback(() => {
    if (practiceMode || quizEndedRef.current) {
      return;
    }
    quizEndedRef.current = true;
    const ok = isQuizClear(correctCountRef.current, requiredCorrect);
    if (ok) {
      void finishQuizSuccess();
    } else {
      finishQuizFail();
    }
  }, [finishQuizFail, finishQuizSuccess, practiceMode, requiredCorrect]);

  const applyQuizHpOutcome = useCallback((nextEnemyHp: number, nextPlayerHp: number) => {
    if (practiceModeRef.current || quizEndedRef.current) {
      return;
    }
    const outcome = resolveEarTrainingOutcome({
      enemyHp: nextEnemyHp,
      playerHp: nextPlayerHp,
      timeRemainingSec: Math.max(0, timeRemainingRef.current),
      phraseCompleted: false,
      phraseFailed: false,
    });
    if (outcome === 'stageClear') {
      quizEndedRef.current = true;
      clearQuizTimer();
      clearCountdownTimer();
      void finishQuizSuccess();
      return;
    }
    if (outcome === 'gameOver') {
      quizEndedRef.current = true;
      clearQuizTimer();
      clearCountdownTimer();
      finishQuizFail();
    }
  }, [clearCountdownTimer, clearQuizTimer, finishQuizFail, finishQuizSuccess]);

  const registerPlayerHpImpactDamage = useCallback((damageAmount: number) => {
    if (tutorialNoCombat || practiceModeRef.current || quizEndedRef.current) {
      return;
    }
    const effectId = triggerBattleEffect('miss', undefined, damageAmount);
    pendingImpactHandlersRef.current.set(effectId, () => {
      setPlayerHp(prev => {
        const next = clampTutorialPlayerHp(
          prev,
          damageAmount,
          Boolean(tutorialUi?.playerInvincible),
        );
        playerHpRef.current = next;
        if (!shouldTutorialBlockGameOver(next, Boolean(tutorialUi?.playerInvincible))) {
          applyQuizHpOutcome(enemyHpRef.current, next);
        }
        return next;
      });
    });
  }, [applyQuizHpOutcome, triggerBattleEffect, tutorialNoCombat, tutorialUi?.playerInvincible]);

  const advanceToNextQuestion = useCallback(() => {
    if (quizQuestions.length === 0) {
      return;
    }
    if (tutorial) {
      setTutorialQuestionIndex((prev) => prev + 1);
    }
    const nextActiveIdx = previewQuestionIndex;
    const nextQuestion = quizQuestions[nextActiveIdx];
    if (!nextQuestion) {
      return;
    }
    const nextPreviewIdx = pickNextQuizIndex(quizQuestions, quizOrder, nextActiveIdx, randRef.current);
    phraseRunNonceRef.current += 1;
    const runKey = phraseRunNonceRef.current;
    const phrase = buildQuizPhrase(stage.id, nextQuestion, runKey);
    const nextAttempt = createChordVoicingAttempt(phrase);
    setPhraseRunId(runKey);
    setActiveQuestionIndex(nextActiveIdx);
    setPreviewQuestionIndex(nextPreviewIdx);
    setAttempt(nextAttempt);
    attemptRef.current = nextAttempt;
    attackGaugeEpochMsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setEnemyAttackGaugePercent(0);
    staffShiftQueueRef.current.push({ active: nextActiveIdx, preview: nextPreviewIdx });
    runStaffShiftQueue();
  }, [previewQuestionIndex, quizQuestions, quizOrder, runStaffShiftQueue, setEnemyAttackGaugePercent, stage.id]);

  const startQuizInternal = useCallback(() => {
    if (quizQuestions.length === 0) {
      setStatusText(isEnglishCopy ? 'No quiz items in stage' : '出題がありません');
      return;
    }
    if (tutorial) {
      setTutorialQuestionsAnswered(0);
      setTutorialQuestionIndex(0);
    }
    clearStaffShiftQueue();
    clearCountdownTimer();
    quizEndedRef.current = false;
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    quotaCelebrationFiredRef.current = false;
    correctCountRef.current = 0;
    setCorrectCount(0);
    phraseRunNonceRef.current = 0;
    setPhraseIntroSeq(c => c + 1);

    setEnemyHp(QUIZ_BATTLE_ENEMY_HP);
    setPlayerHp(stage.player_hp);
    enemyHpRef.current = QUIZ_BATTLE_ENEMY_HP;
    playerHpRef.current = stage.player_hp;

    attackGaugeEpochMsRef.current = null;
    setEnemyAttackGaugePercent(0);

    const firstActive = pickNextQuizIndex(quizQuestions, quizOrder, null, randRef.current);
    const firstPreview = pickNextQuizIndex(quizQuestions, quizOrder, firstActive, randRef.current);
    setActiveQuestionIndex(firstActive);
    setPreviewQuestionIndex(firstPreview);
    setDisplayedActiveQuestionIndex(firstActive);
    setDisplayedPreviewQuestionIndex(firstPreview);
    setPhraseRunId(0);
    const question = quizQuestions[firstActive];
    if (!question) {
      return;
    }
    const phrase = buildQuizPhrase(stage.id, question, 0);
    const nextAttempt = createChordVoicingAttempt(phrase);
    setAttempt(nextAttempt);
    attemptRef.current = nextAttempt;

    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    const bpmSafe = Math.max(30, stage.bpm);
    const beatMs = Math.max(100, (60 / bpmSafe) * 1000);

    const beginQuizPlayingPhrase = () => {
      gameStateRef.current = 'playingPhrase';
      setGameState('playingPhrase');
      setStatusText(isEnglishCopy ? 'Go!' : 'スタート!');
      attackGaugeEpochMsRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
      setEnemyAttackGaugePercent(0);

      if (tutorial) {
        showTutorialQuestionDialogue();
      } else if (!practiceMode) {
        quizStartedAtRef.current = Date.now();
        setTimeRemaining(quizDurationSec);
        clearQuizTimer();
        quizTimerRef.current = setInterval(() => {
          const startAt = quizStartedAtRef.current;
          if (startAt === null) {
            return;
          }
          const elapsed = (Date.now() - startAt) / 1000;
          const rem = Math.max(0, Math.ceil(quizDurationSec - elapsed));
          setTimeRemaining(rem);
          if (rem <= 0 && gameStateRef.current === 'playingPhrase') {
            clearQuizTimer();
            evaluateTimeUp();
          }
        }, 250);
      } else {
        setTimeRemaining(quizDurationSec);
      }

      void (async () => {
        const drum = ensureSelfPacedDrumLoop();
        try {
          if (!chordVoicingPhrasePlayerStubRef.current) {
            chordVoicingPhrasePlayerStubRef.current = new EarTrainingChordVoicingPhrasePlayer();
          }
          const stubPlayer = chordVoicingPhrasePlayerStubRef.current;
          await stubPlayer.prepare(CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL);
          const phraseCtx = stubPlayer.getAudioContext();
          if (!phraseCtx) {
            return;
          }
          await drum.prepare(CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, phraseCtx);
          drum.setVolume(settings.musicVolume * settings.masterVolume);
          drum.start();
        } catch {
          /* BGM が無くてもプレイ続行 */
        }
      })();
    };

    if (beats > 0) {
      gameStateRef.current = 'countIn';
      setGameState('countIn');
      setCountInValue(beats);
      setStatusText(copy.countIn);
      let remaining = beats;
      countdownTimerRef.current = setInterval(() => {
        remaining -= 1;
        setCountInValue(Math.max(remaining, 0));
        if (remaining <= 0) {
          clearCountdownTimer();
          beginQuizPlayingPhrase();
        }
      }, beatMs);
    } else {
      beginQuizPlayingPhrase();
    }
  }, [
    clearCountdownTimer,
    clearQuizTimer,
    copy.countIn,
    ensureSelfPacedDrumLoop,
    evaluateTimeUp,
    isEnglishCopy,
    practiceMode,
    quizDurationSec,
    quizQuestions,
    quizOrder,
    settings.musicVolume,
    setEnemyAttackGaugePercent,
    stage.bpm,
    stage.count_in_beats,
    stage.id,
    stage.player_hp,
    clearStaffShiftQueue,
  ]);

  const startQuiz = useCallback(() => {
    stopSelfPacedDrumLoop();
    clearQuizTimer();
    clearCountdownTimer();
    startQuizInternal();
  }, [clearCountdownTimer, clearQuizTimer, startQuizInternal, stopSelfPacedDrumLoop]);

  const handleNoteInput = useCallback((midiNote: number) => {
    const nowTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowTs - lastInputAtRef.current < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtRef.current = nowTs;
    if (gameStateRef.current !== 'playingPhrase') {
      return;
    }
    const currentAttempt = attemptRef.current;
    if (!currentAttempt) {
      return;
    }
    const judgmentChord = getActiveChordInQuizQuestion(activeQuestion, currentAttempt.completedChordIds);
    if (!judgmentChord) {
      return;
    }
    const result = handleChordVoicingNoteOn(
      currentAttempt,
      judgmentChord,
      midiNote,
      QUIZ_ZERO_NOTE_DAMAGE,
      { wrongNotesPolicy: 'first_only_per_chord' },
    );

    if (!practiceModeRef.current && result.firstWrongJustHappened) {
      registerPlayerHpImpactDamage(QUIZ_ENEMY_STRIKE_DAMAGE);
    }

    setAttempt(result.attempt);
    attemptRef.current = result.attempt;

    if (!result.chordJustCompleted) {
      return;
    }

    const questionCompleted = isChordQuizQuestionCompleted(activeQuestion, result.attempt.completedChordIds);
    triggerCompletionPulse(judgmentChord.id, questionCompleted ? 'harmonyComplete' : 'voicingPartial');

    if (!questionCompleted) {
      triggerBattleEffect('voicingCast');
      return;
    }

    if (tutorial) {
      tutorial.bindings.setCharacterText(
        localizedText(tutorial.scene.dialogue.onCorrect, isEnglishCopy),
      );
      setTutorialQuestionsAnswered(prev => {
        const next = prev + 1;
        if (next >= tutorial.scene.questionCount) {
          stopSelfPacedDrumLoop();
          setTimeout(() => tutorial.onSceneComplete(), 600);
        } else {
          setTimeout(() => {
            advanceToNextQuestion();
            showTutorialQuestionDialogue();
          }, 600);
        }
        return next;
      });
      return;
    }

    const nextCorrect = correctCountRef.current + 1;
    correctCountRef.current = nextCorrect;
    setCorrectCount(nextCorrect);

    if (nextCorrect >= requiredCorrect && !quotaCelebrationFiredRef.current) {
      quotaCelebrationFiredRef.current = true;
      triggerBattleEffect('quotaReached');
    }

    const completionDamage = practiceModeRef.current
      ? 0
      : randomIntInclusive(40, 50, randRef.current);

    const origin = computeChordLabelOriginPoint(judgmentChord.id);

    const registerEnemyDamageImpact = () => {
      if (practiceModeRef.current || completionDamage <= 0) {
        return;
      }
      const attachEnemyDamage = (effectId: number, dmg: number) => {
        pendingImpactHandlersRef.current.set(effectId, () => {
          setEnemyHp(prev => {
            const next = Math.max(0, prev - dmg);
            enemyHpRef.current = next;
            applyQuizHpOutcome(next, playerHpRef.current);
            return next;
          });
        });
      };

      if (nextCorrect > 0 && nextCorrect % 5 === 0) {
        const cycle = (nextCorrect / 5 - 1) % 3;
        const label = cycle === 0 ? 'Great' : 'Perfect';
        const phraseNoteCount = cycle === 2 ? 6 : 0;
        const effectId = triggerBattleEffect('complete', label, completionDamage, phraseNoteCount, origin);
        attachEnemyDamage(effectId, completionDamage);
      } else {
        const effectId = triggerBattleEffect('correct', undefined, completionDamage, undefined, origin);
        attachEnemyDamage(effectId, completionDamage);
      }
    };

    if (practiceModeRef.current) {
      if (nextCorrect > 0 && nextCorrect % 5 === 0) {
        const cycle = (nextCorrect / 5 - 1) % 3;
        const label = cycle === 0 ? 'Great' : 'Perfect';
        const phraseNoteCount = cycle === 2 ? 6 : 0;
        triggerBattleEffect('complete', label, 0, phraseNoteCount, origin);
      } else {
        triggerBattleEffect('correct', undefined, 0, undefined, origin);
      }
    } else {
      registerEnemyDamageImpact();
    }

    advanceToNextQuestion();
  }, [
    activeQuestion,
    advanceToNextQuestion,
    applyQuizHpOutcome,
    computeChordLabelOriginPoint,
    isEnglishCopy,
    registerPlayerHpImpactDamage,
    requiredCorrect,
    showTutorialQuestionDialogue,
    stopSelfPacedDrumLoop,
    triggerBattleEffect,
    triggerCompletionPulse,
    tutorial,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  useEffect(() => {
    if (gameState !== 'playingPhrase' || practiceMode || tutorialNoCombat) {
      attackGaugeEpochMsRef.current = null;
      setEnemyAttackGaugePercent(0);
      return undefined;
    }
    let frameId = 0;
    const tick = () => {
      if (
        gameStateRef.current !== 'playingPhrase'
        || practiceModeRef.current
        || tutorialNoCombat
        || quizEndedRef.current
      ) {
        return;
      }
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      let epoch = attackGaugeEpochMsRef.current;
      if (epoch === null) {
        attackGaugeEpochMsRef.current = now;
        epoch = now;
      }
      const elapsed = now - epoch;
      const pct = Math.min(1, elapsed / QUIZ_ATTACK_GAUGE_FILL_MS);
      setEnemyAttackGaugePercent(pct);
      if (pct >= 1) {
        attackGaugeEpochMsRef.current = now;
        setEnemyAttackGaugePercent(0);
        registerPlayerHpImpactDamage(QUIZ_ENEMY_STRIKE_DAMAGE);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [gameState, practiceMode, registerPlayerHpImpactDamage, setEnemyAttackGaugePercent, tutorialNoCombat]);

  useEffect(() => {
    if (!midiControllerRef.current) {
      midiControllerRef.current = new MIDIController({
        onNoteOn: note => handleNoteInputRef.current(note),
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

  const showVoicingTargetHints = gameState === 'playingPhrase' || gameState === 'countIn';
  const showKeyboardTargetHints = practiceMode || stage.show_keyboard_hints_in_battle === true;

  const staffVoicingGroups = useMemo((): ChordVoicingStaffGroup[] => {
    const activeGroups = buildQuestionStaffGroups(displayedActiveQuestion, 0);
    if (!displayedPreviewQuestion || displayedPreviewQuestion.id === displayedActiveQuestion?.id) {
      return activeGroups;
    }
    return [
      ...activeGroups,
      ...buildQuestionStaffGroups(displayedPreviewQuestion, 1),
    ];
  }, [displayedActiveQuestion, displayedPreviewQuestion]);

  const staffDenseCurrentMeasureLayout = useMemo(() => {
    const currentNoteTotal = getQuestionNoteTotal(displayedActiveQuestion);
    return currentNoteTotal >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD;
  }, [displayedActiveQuestion]);

  const staffCorrectPitchClassesByGroupId = useMemo(() => {
    const correctPitchClassesByGroupId = new Map<string, readonly number[]>();
    if (!attempt) {
      return correctPitchClassesByGroupId;
    }
    staffVoicingGroups.forEach(group => {
      const pressed = attempt.pressedByChord.get(group.id);
      if (pressed && pressed.size > 0) {
        correctPitchClassesByGroupId.set(group.id, Array.from(pressed));
        return;
      }
      if (group.measureOffset === 0 && activeChord && group.id !== activeChord.id) {
        const pcs = voicingToPitchClasses(group.voicing);
        if (pcs.length > 0) {
          correctPitchClassesByGroupId.set(group.id, pcs);
        }
      }
    });
    return correctPitchClassesByGroupId;
  }, [attempt, activeChord, staffVoicingGroups]);

  const voicingKeyboardHints = useMemo(() => {
    if (!showKeyboardTargetHints || !activeChord || !showVoicingTargetHints) {
      return null;
    }
    if (attempt?.completedChordIds.has(activeChord.id)) {
      return null;
    }
    const pressed = attempt?.pressedByChord.get(activeChord.id);
    return computeVoicingKeyboardHints(activeChord.voicing, pressed);
  }, [showKeyboardTargetHints, activeChord, attempt, showVoicingTargetHints]);

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

  const playerBubbleText = tutorial
    ? null
    : gameState === 'playingPhrase'
      ? `${correctCount}/${requiredCorrect}`
      : null;
  useEffect(() => {
    phaserGameRef.current?.setPlayerQuote(playerBubbleText);
  }, [playerBubbleText]);

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
  const showLobbyControls = canChangePracticeMode;
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';

  const resultState = gameState === 'stageClear' ? 'win' : gameState === 'gameOver' ? 'lose' : null;
  const resultSummary = `${isEnglishCopy ? 'Correct' : '正解'} ${correctCount} / ${isEnglishCopy ? 'Need' : '必要'} ${requiredCorrect}`;
  const resultRankLine = resultState ? resultSummary : null;

  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? (progressSaved ? copy.lessonSaved : copy.lessonSaving)
    : null;

  const chordQuizBannerLine = useMemo(
    () => formatEarTrainingChordQuizIntroLine(isEnglishCopy, quizDurationSec, requiredCorrect),
    [isEnglishCopy, quizDurationSec, requiredCorrect],
  );
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);

  const phraseIntroLine = tutorial?.bindings.ui.hidePhraseIntroQuota
    ? ''
    : (gameState === 'countIn' ? chordQuizBannerLine : '');

  useEffect(() => {
    if (!tutorial?.bindings.ui.hideLobby) {
      return undefined;
    }
    if (gameStateRef.current !== 'idle') {
      return undefined;
    }
    const timer = setTimeout(() => startQuiz(), 120);
    return () => clearTimeout(timer);
  }, [startQuiz, tutorial?.bindings.ui.hideLobby]);

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => applyTutorialBattleSnapshot({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText,
    hudLabels,
    phraseIntroLine,
    quizRulesLine: tutorial ? undefined : clearConditionLine,
    resultRankLine,
    timeLabel,
    practiceMode,
    isMidiConnected,
    playerHp,
    playerMaxHp: stage.player_hp,
    enemyHp,
    enemyMaxHp: QUIZ_BATTLE_ENEMY_HP,
    enemyName,
    enemyAvatarUrl: enemyAvatar,
    enemyAvatarFlipX,
    playerAvatarUrl: EAR_TRAINING_PLAYER_AVATAR_URL,
    phraseIndex: 0,
    phraseRunId,
    phraseIntroSeq,
    phraseIntroEmphasis: gameState === 'countIn',
    totalPhrases: 1,
    activeLoop: 1,
    maxLoops: 1,
    demoLoopActive: false,
    enemyAttackGaugePercent: practiceMode || tutorialNoCombat ? 0 : enemyAttackGaugePercent,
    attackGaugeHidden: practiceMode || tutorialNoCombat,
    chords: [
      ...getQuestionChordViews(activeQuestion, activeChord?.id ?? null, showVoicingTargetHints),
      ...(shouldShowQuizPreview && previewQuestion
        ? getQuestionChordViews(previewQuestion, null, false)
        : []),
    ],
    phraseSlots: ['◯', '◯'],
    revealedNotes: [],
    currentNoteIndex: 0,
    slotKind: 'circle',
    chordCompleted: activeQuestion?.chords.map(chord => attempt?.completedChordIds.has(chord.id) ?? false) ?? [],
    countInValue,
    lastRank: null,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
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
    activeChord,
    activeQuestion,
    attempt,
    canChangePracticeMode,
    clearConditionLine,
    chordQuizBannerLine,
    countInValue,
    enemyAttackGaugePercent,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyHp,
    enemyName,
    gameState,
    hudLabels,
    isMidiConnected,
    lessonContext,
    phraseIntroLine,
    phraseIntroSeq,
    phraseRunId,
    playerHp,
    practiceMode,
    previewQuestion,
    shouldShowQuizPreview,
    progressSaved,
    requiredCorrect,
    resultRankLine,
    resultState,
    showLobbyControls,
    showVoicingTargetHints,
    stage.player_hp,
    stage.title,
    startButtonLabel,
    statusText,
    timeLabel,
    isEnglishCopy,
  ]);

  const battleCallbacks = useMemo(() => ({
    onStart: startQuiz,
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
    startQuiz,
  ]);

  const hideStaffNotes = !practiceMode && hideNotationInBattle;

  return (
    <div className={cn(
      'relative h-[100dvh] w-full overflow-hidden bg-slate-950 text-white',
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
            hideUnpressedNotes={hideStaffNotes}
            correctPitchClassesByGroupId={staffCorrectPitchClassesByGroupId}
            denseCurrentMeasureLayout={staffDenseCurrentMeasureLayout}
            keyFifths={getQuestionKeyFifths(displayedActiveQuestion, stage)}
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

export default EarTrainingChordQuizScreen;
