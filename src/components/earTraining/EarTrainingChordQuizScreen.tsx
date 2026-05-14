import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingPhaserGame from './EarTrainingPhaserGame';
import EarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';
import ChordVoicingStaff, {
  CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD,
  type ChordVoicingStaffGroup,
} from './ChordVoicingStaff';
import type {
  ClearConditions,
  EarTrainingChordQuizItem,
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
import { createChordVoicingAttempt, handleChordVoicingNoteOn } from '@/utils/earTrainingChordVoicingEngine';
import { computeVoicingKeyboardHints } from '@/utils/earTrainingChordVoicingHints';
import { getEarTrainingBattleHudLabels, getEarTrainingGameCopy } from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  EarTrainingChordVoicingDrumLoop,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';
import { isQuizClear, pickNextQuizIndex } from '@/utils/earTrainingChordQuiz';
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

interface EarTrainingChordQuizScreenProps {
  stage: EarTrainingStage;
  enemy: SurvivalCharacterRow | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
const QUIZ_EFFECT_MS = 820;
const NO_DAMAGE = {
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

const itemToPhraseChord = (item: EarTrainingChordQuizItem): EarTrainingPhraseChord => ({
  id: item.id,
  phrase_id: 'chord-quiz',
  order_index: item.order_index,
  chord_name: item.chord_name,
  voicing: item.voicing,
  voicing_staves: item.voicing_staves,
});

const buildQuizPhrase = (stageId: string, chord: EarTrainingPhraseChord, runKey: number): EarTrainingPhrase => ({
  id: `chord-quiz-${chord.id}-${runKey}`,
  stage_id: stageId,
  order_index: 0,
  audio_url: CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  loop_duration_sec: 2,
  audio_duration_sec: 2,
  note_count: 0,
  chords: [chord],
});

const EarTrainingChordQuizScreen: React.FC<EarTrainingChordQuizScreenProps> = ({
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

  const quizItems = useMemo(
    () => (stage.chord_quiz_items ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [stage.chord_quiz_items],
  );
  const quizOrder = stage.quiz_question_order === 'sequential' ? 'sequential' : 'random';
  const quizDurationSec = stage.quiz_duration_seconds ?? 90;
  const requiredCorrect = stage.quiz_required_correct_count ?? 80;
  const hideNotationInBattle = stage.quiz_show_notation_in_battle === false;

  const [statusText, setStatusText] = useState(copy.idlePrompt);
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [previewItemIndex, setPreviewItemIndex] = useState(0);
  const [attempt, setAttempt] = useState<EarTrainingChordVoicingAttempt | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(quizDurationSec);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'clear' | null>(null);
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
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const battleEffectIdRef = useRef(0);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const quizStartedAtRef = useRef<number | null>(null);
  const quizEndedRef = useRef(false);
  const phraseRunNonceRef = useRef(0);
  const randRef = useRef(() => Math.random());

  const activeItem = quizItems[activeItemIndex] ?? null;
  const previewItem = quizItems[previewItemIndex] ?? null;
  const activeChord = useMemo(
    () => (activeItem ? itemToPhraseChord(activeItem) : null),
    [activeItem],
  );
  const previewChord = useMemo(
    () => (previewItem ? itemToPhraseChord(previewItem) : null),
    [previewItem],
  );
  useEffect(() => { attemptRef.current = attempt; }, [attempt]);
  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { correctCountRef.current = correctCount; }, [correctCount]);

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

  const clearBattleEffectTimers = useCallback(() => {
    if (battleEffectClearTimerRef.current) {
      clearTimeout(battleEffectClearTimerRef.current);
      battleEffectClearTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    clearQuizTimer();
    clearBattleEffectTimers();
    chordVoicingPhrasePlayerStubRef.current?.dispose();
    chordVoicingPhrasePlayerStubRef.current = null;
    selfPacedDrumLoopRef.current?.dispose();
    selfPacedDrumLoopRef.current = null;
    return () => undefined;
  }, [clearBattleEffectTimers, clearQuizTimer]);

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

  const finishQuizSuccess = useCallback(async () => {
    pendingImpactHandlersRef.current.clear();
    clearQuizTimer();
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
  ]);

  const finishQuizFail = useCallback(() => {
    pendingImpactHandlersRef.current.clear();
    clearQuizTimer();
    gameStateRef.current = 'gameOver';
    stopSelfPacedDrumLoop();
    setGameState('gameOver');
    setStatusText(isEnglishCopy ? 'Try again' : '残念…');
  }, [clearQuizTimer, isEnglishCopy, stopSelfPacedDrumLoop]);

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

  const advanceToNextQuestion = useCallback(() => {
    if (quizItems.length === 0) {
      return;
    }
    const nextActiveIdx = previewItemIndex;
    const nextChord = quizItems[nextActiveIdx];
    if (!nextChord) {
      return;
    }
    const nextPreviewIdx = pickNextQuizIndex(quizItems, quizOrder, nextActiveIdx, randRef.current);
    phraseRunNonceRef.current += 1;
    const runKey = phraseRunNonceRef.current;
    const phrase = buildQuizPhrase(stage.id, itemToPhraseChord(nextChord), runKey);
    const nextAttempt = createChordVoicingAttempt(phrase);
    setPhraseRunId(runKey);
    setActiveItemIndex(nextActiveIdx);
    setPreviewItemIndex(nextPreviewIdx);
    setAttempt(nextAttempt);
    attemptRef.current = nextAttempt;
  }, [previewItemIndex, quizItems, quizOrder, stage.id]);

  const startQuizInternal = useCallback(() => {
    if (quizItems.length === 0) {
      setStatusText(isEnglishCopy ? 'No quiz items in stage' : '出題がありません');
      return;
    }
    quizEndedRef.current = false;
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    correctCountRef.current = 0;
    setCorrectCount(0);
    phraseRunNonceRef.current = 0;
    const firstActive = pickNextQuizIndex(quizItems, quizOrder, null, randRef.current);
    const firstPreview = pickNextQuizIndex(quizItems, quizOrder, firstActive, randRef.current);
    setActiveItemIndex(firstActive);
    setPreviewItemIndex(firstPreview);
    setPhraseRunId(0);
    const chord = quizItems[firstActive];
    if (!chord) {
      return;
    }
    const phrase = buildQuizPhrase(stage.id, itemToPhraseChord(chord), 0);
    const nextAttempt = createChordVoicingAttempt(phrase);
    setAttempt(nextAttempt);
    attemptRef.current = nextAttempt;
    gameStateRef.current = 'playingPhrase';
    setGameState('playingPhrase');
    setStatusText(isEnglishCopy ? 'Go!' : 'スタート!');

    if (!practiceMode) {
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
  }, [
    clearQuizTimer,
    ensureSelfPacedDrumLoop,
    evaluateTimeUp,
    isEnglishCopy,
    practiceMode,
    quizDurationSec,
    quizItems,
    quizOrder,
    settings.musicVolume,
    stage.id,
  ]);

  const startQuiz = useCallback(() => {
    stopSelfPacedDrumLoop();
    clearQuizTimer();
    startQuizInternal();
  }, [clearQuizTimer, startQuizInternal, stopSelfPacedDrumLoop]);

  const handleNoteInput = useCallback((midiNote: number) => {
    const nowTs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowTs - lastInputAtRef.current < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtRef.current = nowTs;
    if (gameStateRef.current !== 'playingPhrase' || !activeChord) {
      return;
    }
    const currentAttempt = attemptRef.current;
    if (!currentAttempt) {
      return;
    }
    const result = handleChordVoicingNoteOn(
      currentAttempt,
      activeChord,
      midiNote,
      NO_DAMAGE,
      { suppressMissRecording: true },
    );
    if (!result.chordJustCompleted) {
      setAttempt(result.attempt);
      attemptRef.current = result.attempt;
      return;
    }

    setAttempt(result.attempt);
    attemptRef.current = result.attempt;

    const nextCorrect = correctCountRef.current + 1;
    correctCountRef.current = nextCorrect;
    setCorrectCount(nextCorrect);

    const origin = computeChordLabelOriginPoint(activeChord.id);

    const applyAfterEffect = () => {
      advanceToNextQuestion();
    };

    if (nextCorrect > 0 && nextCorrect % 5 === 0) {
      const cycle = (nextCorrect / 5 - 1) % 3;
      const label = cycle === 0 ? 'Great' : 'Perfect';
      const phraseNoteCount = cycle === 2 ? 6 : 0;
      const effectId = triggerBattleEffect('complete', label, 0, phraseNoteCount, origin);
      registerBattleEffectImpact(effectId, applyAfterEffect);
    } else {
      const effectId = triggerBattleEffect('correct', undefined, 0, undefined, origin);
      registerBattleEffectImpact(effectId, applyAfterEffect);
    }
  }, [
    activeChord,
    advanceToNextQuestion,
    computeChordLabelOriginPoint,
    registerBattleEffectImpact,
    triggerBattleEffect,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

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

  const showVoicingTargetHints = gameState === 'playingPhrase';

  const staffVoicingGroups = useMemo((): ChordVoicingStaffGroup[] => {
    if (!activeChord || !previewChord) {
      return [];
    }
    const currentNoteTotal = activeChord.voicing?.length ?? 0;
    const denseCurrentMeasureLayout = currentNoteTotal >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD;
    return [
      {
        id: activeChord.id,
        chordName: activeChord.chord_name,
        voicing: activeChord.voicing ?? [],
        voicingStaves: activeChord.voicing_staves ?? EMPTY_STAVES,
        measureOffset: 0,
        isRest: false,
      },
      {
        id: previewChord.id,
        chordName: previewChord.chord_name,
        voicing: previewChord.voicing ?? [],
        voicingStaves: previewChord.voicing_staves ?? EMPTY_STAVES,
        measureOffset: 1,
        isRest: false,
      },
    ];
  }, [activeChord, previewChord]);

  const staffDenseCurrentMeasureLayout = useMemo(() => {
    if (!activeChord) {
      return false;
    }
    return (activeChord.voicing?.length ?? 0) >= CHORD_VOICING_STAFF_DENSE_NOTE_TOTAL_THRESHOLD;
  }, [activeChord]);

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
    if (!practiceMode || !activeChord || !showVoicingTargetHints) {
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

  const playerBubbleText = gameState === 'playingPhrase'
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

  const phraseIntroLine = isEnglishCopy
    ? `Chord quiz · ${quizItems.length} chords`
    : `コードクイズ · 全${quizItems.length}種`;

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => ({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText,
    hudLabels,
    phraseIntroLine,
    resultRankLine,
    timeLabel,
    practiceMode,
    isMidiConnected,
    playerHp: stage.player_hp,
    playerMaxHp: stage.player_hp,
    enemyHp: stage.enemy_hp,
    enemyMaxHp: stage.enemy_hp,
    enemyName,
    enemyAvatarUrl: enemyAvatar,
    enemyAvatarFlipX,
    playerAvatarUrl: EAR_TRAINING_PLAYER_AVATAR_URL,
    phraseIndex: 0,
    phraseRunId,
    totalPhrases: 1,
    activeLoop: 1,
    maxLoops: 1,
    demoLoopActive: false,
    enemyAttackGaugePercent: 0,
    attackGaugeHidden: true,
    chords: [
      ...(activeChord
        ? [{ id: activeChord.id, name: activeChord.chord_name, active: showVoicingTargetHints }]
        : []),
      ...(previewChord && previewChord.id !== activeChord?.id
        ? [{ id: previewChord.id, name: previewChord.chord_name, active: false }]
        : []),
    ],
    phraseSlots: ['◯', '◯'],
    revealedNotes: [],
    currentNoteIndex: 0,
    slotKind: 'circle',
    chordCompleted: [false, false],
    countInValue: 0,
    lastRank: null,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
  }), [
    activeChord,
    canChangePracticeMode,
    correctCount,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyName,
    gameState,
    hudLabels,
    isMidiConnected,
    lessonContext,
    phraseIntroLine,
    phraseRunId,
    practiceMode,
    previewChord,
    progressSaved,
    requiredCorrect,
    resultRankLine,
    resultState,
    showLobbyControls,
    showVoicingTargetHints,
    stage.enemy_hp,
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
            keyFifths={stage.key_fifths ?? 0}
            completionPulse={null}
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

export default EarTrainingChordQuizScreen;
