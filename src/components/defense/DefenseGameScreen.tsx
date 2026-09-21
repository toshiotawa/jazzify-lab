/**
 * Defense mode game screen orchestrator.
 *
 * High-frequency state (runtime simulation) lives in refs and is drawn imperatively;
 * React state only changes on note events, once per second (hint fade), and on result.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { DefenseCanvas, type DefenseCanvasHandle } from '@/components/defense/DefenseCanvas';
import { DefenseChordProgressionHud } from '@/components/defense/DefenseChordProgressionHud';
import {
  clampDefenseOctaveShift,
  DefenseOctaveStepper,
  DefensePracticeHud,
  DefenseSpeedStepper,
} from '@/components/defense/DefensePracticeHud';
import { DefensePhraseStaff } from '@/components/defense/DefensePhraseStaff';
import { DefenseTutorialStaff } from '@/components/defense/tutorial/DefenseTutorialStaff';
import type { ChordVoicingStaffGroup } from '@/components/earTraining/ChordVoicingStaff';
import { DefenseResult } from '@/components/defense/DefenseResult';
import EarTrainingSettingsModal from '@/components/earTraining/EarTrainingSettingsModal';
import DeferredEarTrainingPianoOverlay, {
  type EarTrainingPianoOverlayHandle,
} from '@/components/earTraining/DeferredEarTrainingPianoOverlay';
import {
  chargeDefenseSp,
  performDefenseSlash,
  spawnTutorialInitialEnemies,
  tickDefenseSimulation,
} from '@/game/defense/defenseEngine';
import {
  DEFENSE_TUTORIAL_AUDIO_URL,
} from '@/game/defense/tutorial/buildDefenseTutorialPhrase';
import { buildDefenseTutorialStaffDisplay } from '@/game/defense/tutorial/buildDefenseTutorialStaffDisplay';
import { synthesizeDefenseTutorialCdeBuffer } from '@/game/defense/tutorial/defenseTutorialAudio';
import {
  isDefenseSharedProgressionSeparateTracksStage,
  isDefenseSharedProgressionStage,
} from '@/game/defense/defenseAudioRegistrationMode';
import {
  defenseBackingDeck,
  unlockDefenseBackingAudioContext,
} from '@/game/defense/defenseBackingDeck';
import {
  defenseSeparateTracksDeck,
  unlockDefenseSeparateTracksAudioContext,
} from '@/game/defense/defenseSeparateTracksDeck';
import {
  defenseSharedProgressionDeck,
  unlockDefenseSharedProgressionAudioContext,
} from '@/game/defense/defenseSharedProgressionDeck';
import {
  resolveDefensePhrasePreloadUrls,
  type DefensePhraseBackingPlayback,
} from '@/game/defense/defensePhraseBacking';
import {
  DEFENSE_START_COUNTDOWN_FIRST_STEP_SEC,
  DEFENSE_START_COUNTDOWN_SEC,
  DEFENSE_START_COUNTDOWN_SECOND_STEP_SEC,
  defenseStartCountdownDisplaySec,
} from '@/game/defense/defenseStartCountdown';
import {
  defensePracticeSpeedRatio,
  stepDefensePracticeSpeedPercent,
} from '@/game/defense/defensePracticeSpeed';
import {
  createInitialPhraseJudgeState,
  evaluateDefensePhraseNoteOn,
  getDefensePhraseKeyboardHints,
  nextPhraseIndex,
  type DefensePhraseJudgeState,
} from '@/game/defense/defensePhraseJudge';
import {
  advanceVoicingKey,
  buildTransposedVoicingPhrases,
  createInitialVoicingKeyState,
  currentVoicingKey,
  isDefenseChordVoicingStage,
  stepVoicingKey,
  type DefenseVoicingKeyState,
} from '@/game/defense/defenseVoicingKeys';
import type {
  DefenseDifficulty,
  DefenseGameResult,
  DefenseRuntime,
  DefenseStage,
  DefenseTutorialOptions,
} from '@/game/defense/defenseTypes';
import type { InputMethod } from '@/types';
import { computeDefenseKeyboardMidis } from '@/game/defense/defenseStageMidis';
import {
  buildDefenseProgressionChips,
  resolveDefenseFormBarCount,
  resolveDefenseProgressionActiveIndex,
} from '@/game/defense/defenseProgressionTimeline';
import type { MutableDefenseSceneHud } from '@/game/defense/defenseSceneHud';
import { DEFENSE_HUD_HEIGHT_PX } from '@/game/defense/defenseSceneLayout';
import { createDefenseRuntime } from '@/game/defense/defenseTypes';
import { PIANO_OVERLAY_HEIGHT } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  getNotationInstrumentPreset,
  getWrittenSemitoneOffset,
  type NotationInstrumentClef,
} from '@/utils/notationInstrument';
import { transposeChordLabelPitchClass } from '@/utils/earTrainingPracticeTranspose';
import { FantasySoundManager } from '@/utils/FantasySoundManager';
import { markAudioUserInteraction, playNote, stopNote } from '@/utils/MidiController';
import { normalizePitchClass } from '@/utils/phraseStreamMatching';
import {
  applySequentialSurvivalVoicingHints,
  applySurvivalVoicingHintsWithOpacity,
  computeKeyboardHintOpacity,
  computeUnpressedNoteOpacity,
} from '@/utils/survivalStaffHintOpacity';

interface DefenseGameScreenProps {
  readonly stage: DefenseStage;
  readonly difficulty: DefenseDifficulty;
  readonly practiceMode: boolean;
  readonly onExit: () => void;
  readonly onRetry: () => void;
  readonly onApplyPracticeModeAndRestart: (nextPracticeMode: boolean) => void;
  /** リザルト画面の「マップに戻る」。未指定時は onExit にフォールバック */
  readonly onResultBack?: () => void;
  /** 本番モードでクリアしたときに1回だけ呼ばれる（レッスン進捗の記録用） */
  readonly onClear?: () => void;
  readonly resultNextStepLabel?: string;
  readonly onResultNextStep?: () => void;
  readonly tutorialOptions?: DefenseTutorialOptions | null;
  readonly tutorialInputMethod?: InputMethod;
  readonly tutorialStaffGroups?: readonly ChordVoicingStaffGroup[];
  readonly tutorialClef?: NotationInstrumentClef;
  readonly tutorialConcertMidis?: readonly [number, number, number];
  readonly onTutorialPhraseSucceeded?: () => void;
  readonly suppressResultScreen?: boolean;
}

interface FinalStats {
  readonly result: Exclude<DefenseGameResult, 'playing'>;
  readonly surviveSec: number;
  readonly enemiesDefeated: number;
}

/** fade_15s は 15 秒で完了するため、それ以降は秒カウンタの再レンダーを止める */
const HINT_FADE_TRACK_LIMIT_SEC = 16;
const VOICE_DEFENSE_SAME_PC_DEBOUNCE_MS = 120;
const DEFAULT_TUTORIAL_CONCERT_MIDIS: readonly [number, number, number] = [60, 62, 64];

type DefenseGamePhase = 'loading' | 'loadError' | 'countdown' | 'playing';

export const DefenseGameScreen: React.FC<DefenseGameScreenProps> = ({
  stage,
  difficulty,
  practiceMode,
  onExit,
  onRetry,
  onApplyPracticeModeAndRestart,
  onResultBack,
  onClear,
  resultNextStepLabel,
  onResultNextStep,
  tutorialOptions = null,
  tutorialInputMethod,
  tutorialStaffGroups,
  tutorialClef = 'treble',
  tutorialConcertMidis: tutorialConcertMidisProp,
  onTutorialPhraseSucceeded,
  suppressResultScreen = false,
}) => {
  const tutorialConcertMidis = tutorialConcertMidisProp ?? DEFAULT_TUTORIAL_CONCERT_MIDIS;
  const isTutorialSession = tutorialOptions != null;
  const isChordVoicingStage = isDefenseChordVoicingStage(stage);
  const isSharedProgressionStage = isDefenseSharedProgressionStage(stage);
  const isSeparateTracksStage = isDefenseSharedProgressionSeparateTracksStage(stage);
  const usesProgressionHud = !isChordVoicingStage && (isSharedProgressionStage || isSeparateTracksStage);
  const runtimeRef = useRef<DefenseRuntime>(
    createDefenseRuntime(
      stage.playerHp,
      stage.surviveSeconds,
      tutorialOptions?.maxEnemies ?? difficulty.maxEnemies,
      practiceMode,
      stage.attackTrigger,
      tutorialOptions,
    ),
  );
  const judgeRef = useRef<DefensePhraseJudgeState>(createInitialPhraseJudgeState(0));
  const pendingSwitchAtRef = useRef<number | null>(null);
  const scheduledNextPhraseIndexRef = useRef<number | null>(null);
  const backingRestartGenerationRef = useRef(0);
  const sharedProgressionRequestRevisionRef = useRef(0);
  const separateTracksRequestRevisionRef = useRef(0);
  const practiceSpeedPercentRef = useRef(100);
  const phaseRef = useRef<DefenseGamePhase>('loading');
  const pendingPlaybackRef = useRef<DefensePhraseBackingPlayback | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const elapsedIntRef = useRef(0);
  const pianoRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const canvasRef = useRef<DefenseCanvasHandle | null>(null);
  const onClearRef = useRef(onClear);
  const onTutorialPhraseSucceededRef = useRef(onTutorialPhraseSucceeded);
  const tutorialConcertMidisRef = useRef(tutorialConcertMidis);
  tutorialConcertMidisRef.current = tutorialConcertMidis;
  const tutorialPhraseSucceededRef = useRef(false);
  const hudRef = useRef<MutableDefenseSceneHud>({
    playerHp: stage.playerHp,
    playerMaxHp: stage.playerHp,
    remainSec: stage.surviveSeconds,
    enemiesDefeated: 0,
    wave: practiceMode ? 0 : 1,
    practiceMode,
  });

  const [judgeSnapshot, setJudgeSnapshot] = useState<DefensePhraseJudgeState>(
    createInitialPhraseJudgeState(0),
  );
  const [voicingKeyState, setVoicingKeyState] = useState<DefenseVoicingKeyState | null>(() => {
    if (!isDefenseChordVoicingStage(stage)) return null;
    const mode = stage.voicingKeyMode ?? 'order';
    const startKey = stage.voicingStartKey ?? 'C';
    return createInitialVoicingKeyState(mode, startKey);
  });
  const voicingKeyStateRef = useRef(voicingKeyState);
  voicingKeyStateRef.current = voicingKeyState;

  const activePhrases = useMemo(() => {
    if (!isChordVoicingStage || voicingKeyState == null) {
      return stage.phrases;
    }
    return buildTransposedVoicingPhrases(stage, voicingKeyState);
  }, [stage, isChordVoicingStage, voicingKeyState]);
  const [practiceSpeedPercent, setPracticeSpeedPercent] = useState(100);
  const [elapsedInt, setElapsedInt] = useState(0);
  const [phase, setPhase] = useState<DefenseGamePhase>('loading');
  const [countdownSec, setCountdownSec] = useState(
    defenseStartCountdownDisplaySec(DEFENSE_START_COUNTDOWN_SEC),
  );
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const [progressionActiveIndex, setProgressionActiveIndex] = useState(0);
  const progressionActiveIndexRef = useRef(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isSettingsOpenRef = useRef(false);
  const lastVoicePcAtRef = useRef<Map<number, number>>(new Map());
  const profile = useAuthStore((state) => state.profile);
  const geoCountry = useGeoStore((state) => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: profile?.preferred_locale,
  });
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const effectiveInputMethod = tutorialInputMethod ?? settings.inputMethod;
  const voiceSequential = effectiveInputMethod === 'voice';
  isSettingsOpenRef.current = isSettingsOpen;

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  useEffect(() => {
    onTutorialPhraseSucceededRef.current = onTutorialPhraseSucceeded;
  }, [onTutorialPhraseSucceeded]);

  useEffect(() => {
    practiceSpeedPercentRef.current = practiceSpeedPercent;
  }, [practiceSpeedPercent]);

  const beginPlay = useCallback((): void => {
    const ratio = defensePracticeSpeedRatio(practiceSpeedPercentRef.current);

    if (isSeparateTracksStage) {
      pendingPlaybackRef.current = null;
      void defenseSeparateTracksDeck.start(
        stage,
        judgeRef.current.phraseIndex,
        ratio,
      );
    } else if (isSharedProgressionStage) {
      pendingPlaybackRef.current = null;
      defenseSharedProgressionDeck.start(judgeRef.current.phraseIndex);
    } else {
      const playback = pendingPlaybackRef.current;
      if (!playback) return;
      pendingPlaybackRef.current = null;
      defenseBackingDeck.setTransportConfig(stage.bpm * ratio, stage.beatsPerBar);
      defenseBackingDeck.start(playback);
    }

    runtimeRef.current.elapsedSec = 0;
    elapsedIntRef.current = 0;
    lastFrameRef.current = null;

    if (isTutorialSession) {
      spawnTutorialInitialEnemies(runtimeRef.current, difficulty);
    }

    phaseRef.current = 'playing';
    setPhase('playing');
  }, [
    stage,
    stage.bpm,
    stage.beatsPerBar,
    difficulty,
    isTutorialSession,
    isSharedProgressionStage,
    isSeparateTracksStage,
  ]);

  const trackElapsedForHints = !practiceMode && (
    stage.productionStaffHintMode === 'fade_15s'
    || stage.productionKeyboardHintMode === 'fade_15s'
  );

  const currentPhrase = activePhrases[judgeSnapshot.phraseIndex] ?? activePhrases[0] ?? null;
  const activeVoicingKey = voicingKeyState != null ? currentVoicingKey(voicingKeyState) : null;
  const phraseKeyFifths = currentPhrase?.keyFifths ?? stage.keyFifths;

  const phraseLoopBarCount = useMemo(() => {
    if (!currentPhrase) {
      return Math.max(1, stage.phraseBars);
    }
    if (
      currentPhrase.loopStartMeasure !== null
      && currentPhrase.loopEndMeasure !== null
    ) {
      return Math.max(
        1,
        currentPhrase.loopEndMeasure - currentPhrase.loopStartMeasure + 1,
      );
    }
    return Math.max(1, currentPhrase.chords.length, stage.phraseBars);
  }, [currentPhrase, stage.phraseBars]);

  const formBarCount = useMemo(
    () => resolveDefenseFormBarCount(
      usesProgressionHud ? stage.progressionBars : null,
      phraseLoopBarCount,
    ),
    [usesProgressionHud, stage.progressionBars, phraseLoopBarCount],
  );

  const writtenOffset = useMemo(
    () => getWrittenSemitoneOffset(
      getNotationInstrumentPreset(settings.notationInstrumentId),
      settings.notationOctaveShift,
    ),
    [settings.notationInstrumentId, settings.notationOctaveShift],
  );

  const transposeProgressionLabel = useCallback(
    (label: string) => transposeChordLabelPitchClass(label, writtenOffset),
    [writtenOffset],
  );

  const progressionChips = useMemo(
    () => buildDefenseProgressionChips(
      stage.progressionChords,
      progressionActiveIndex,
      transposeProgressionLabel,
    ),
    [stage.progressionChords, progressionActiveIndex, transposeProgressionLabel],
  );

  const keyboardHints = useMemo(
    () => getDefensePhraseKeyboardHints(activePhrases, judgeSnapshot, voiceSequential),
    [activePhrases, judgeSnapshot, voiceSequential],
  );

  const tutorialConcertPitchClasses = useMemo(
    () => tutorialConcertMidis.map((midi) => ((midi % 12) + 12) % 12),
    [tutorialConcertMidis],
  );

  const tutorialStaffDisplay = useMemo(() => {
    if (!tutorialStaffGroups) return null;
    return buildDefenseTutorialStaffDisplay(
      tutorialStaffGroups,
      judgeSnapshot,
      tutorialConcertPitchClasses,
    );
  }, [tutorialStaffGroups, judgeSnapshot, tutorialConcertPitchClasses]);

  const stageMidiMidis = useMemo(
    () => computeDefenseKeyboardMidis(stage, activePhrases),
    [stage, activePhrases],
  );

  const keyboardRange = useResolvedWebKeyboardRange(stageMidiMidis);

  const staffHintOpacity = useMemo(() => {
    if (practiceMode) return 1;
    return computeUnpressedNoteOpacity(elapsedInt, {
      hintMode: false,
      hintBuffActive: false,
      productionHintMode: stage.productionStaffHintMode,
      isStageMode: true,
      isPlaying: finalStats === null,
      isGameOver: finalStats !== null,
    });
  }, [practiceMode, elapsedInt, stage.productionStaffHintMode, finalStats]);

  const keyboardHintOpacity = useMemo(() => {
    if (practiceMode) return 1;
    return computeKeyboardHintOpacity(elapsedInt, {
      hintMode: false,
      hintBuffActive: false,
      productionHintMode: stage.productionKeyboardHintMode,
      isStageMode: true,
      isPlaying: finalStats === null,
      isGameOver: finalStats !== null,
    });
  }, [practiceMode, elapsedInt, stage.productionKeyboardHintMode, finalStats]);

  const showTargetHints = practiceMode || staffHintOpacity > 0;

  useEffect(() => {
    hudRef.current.practiceMode = practiceMode;
  }, [practiceMode]);

  const applyImmediatePhraseSwitch = useCallback((phraseIndex: number): void => {
    const nextPhrase = stage.phrases[phraseIndex];
    if (!nextPhrase) return;

    judgeRef.current = createInitialPhraseJudgeState(phraseIndex);
    setJudgeSnapshot(judgeRef.current);
  }, [stage.phrases]);

  const restartBackingForPhrase = useCallback(async (
    phraseIndex: number,
    speedPercent: number,
    intent: 'speed' | 'phrase' = 'phrase',
  ): Promise<void> => {
    const phrase = stage.phrases[phraseIndex];
    if (!phrase) return;

    const generation = backingRestartGenerationRef.current + 1;
    backingRestartGenerationRef.current = generation;
    pendingSwitchAtRef.current = null;
    scheduledNextPhraseIndexRef.current = null;

    const ratio = defensePracticeSpeedRatio(speedPercent);
    if (isSeparateTracksStage) {
      try {
        if (intent === 'speed') {
          await defenseSeparateTracksDeck.requestTempo(speedPercent);
        } else {
          if (backingRestartGenerationRef.current !== generation) return;
          separateTracksRequestRevisionRef.current += 1;
          defenseSeparateTracksDeck.requestPhrase(
            phraseIndex,
            separateTracksRequestRevisionRef.current,
          );
        }
      } catch {
        /* tempo/phrase request failed */
      }
      return;
    }
    if (isSharedProgressionStage) {
      try {
        if (intent === 'speed') {
          await defenseSharedProgressionDeck.prepare(stage, ratio);
          if (backingRestartGenerationRef.current !== generation) return;
          backingRestartGenerationRef.current += 1;
          defenseSharedProgressionDeck.restartFromProgressionStart(phraseIndex, ratio);
        } else {
          await defenseSharedProgressionDeck.prepare(stage, ratio);
          if (backingRestartGenerationRef.current !== generation) return;
          sharedProgressionRequestRevisionRef.current += 1;
          defenseSharedProgressionDeck.requestPhrase(
            phraseIndex,
            sharedProgressionRequestRevisionRef.current,
          );
        }
      } catch {
        /* prepare/start failed */
      }
      return;
    }

    try {
      if (intent === 'speed') {
        const livePhrase = stage.phrases[judgeRef.current.phraseIndex] ?? phrase;
        const playback = await defenseBackingDeck.preparePhraseBacking(stage, livePhrase, ratio);
        if (backingRestartGenerationRef.current !== generation) return;
        backingRestartGenerationRef.current += 1;
        defenseBackingDeck.setTransportConfig(stage.bpm * ratio, stage.beatsPerBar);
        defenseBackingDeck.start(playback);
      } else {
        scheduledNextPhraseIndexRef.current = phraseIndex;
        const playback = await defenseBackingDeck.preparePhraseBacking(stage, phrase, ratio);
        if (backingRestartGenerationRef.current !== generation) return;
        if (scheduledNextPhraseIndexRef.current !== phraseIndex) return;
        defenseBackingDeck.setTransportConfig(stage.bpm * ratio, stage.beatsPerBar);
        pendingSwitchAtRef.current = defenseBackingDeck.scheduleSwitch(playback);
      }
    } catch {
      /* prepare/start failed; leave current backing as-is */
    }
  }, [stage, isSharedProgressionStage, isSeparateTracksStage]);

  const applyVoicingKeyStep = useCallback((delta: -1 | 1): void => {
    const keyState = voicingKeyStateRef.current;
    if (!isChordVoicingStage || keyState == null) return;
    const nextKeyState = stepVoicingKey(keyState, delta);
    voicingKeyStateRef.current = nextKeyState;
    setVoicingKeyState(nextKeyState);
    applyImmediatePhraseSwitch(0);
  }, [isChordVoicingStage, applyImmediatePhraseSwitch]);

  const handlePrevPhrase = useCallback((): void => {
    if (!practiceMode) return;
    if (isChordVoicingStage) {
      applyVoicingKeyStep(-1);
      return;
    }
    if (stage.phrases.length <= 1) return;
    const currentIndex = judgeRef.current.phraseIndex;
    const prevIndex = (currentIndex - 1 + stage.phrases.length) % stage.phrases.length;
    applyImmediatePhraseSwitch(prevIndex);
    void restartBackingForPhrase(prevIndex, practiceSpeedPercentRef.current);
  }, [
    practiceMode,
    isChordVoicingStage,
    applyVoicingKeyStep,
    stage.phrases.length,
    applyImmediatePhraseSwitch,
    restartBackingForPhrase,
  ]);

  const handleNextPhrase = useCallback((): void => {
    if (!practiceMode) return;
    if (isChordVoicingStage) {
      applyVoicingKeyStep(1);
      return;
    }
    if (stage.phrases.length <= 1) return;
    const nextIndex = nextPhraseIndex(stage.phrases, judgeRef.current.phraseIndex);
    applyImmediatePhraseSwitch(nextIndex);
    void restartBackingForPhrase(nextIndex, practiceSpeedPercentRef.current);
  }, [
    practiceMode,
    isChordVoicingStage,
    applyVoicingKeyStep,
    stage.phrases,
    applyImmediatePhraseSwitch,
    restartBackingForPhrase,
  ]);

  const handleSpeedDown = useCallback((): void => {
    const nextSpeed = stepDefensePracticeSpeedPercent(practiceSpeedPercentRef.current, -1);
    if (nextSpeed === practiceSpeedPercentRef.current) return;
    setPracticeSpeedPercent(nextSpeed);
    void restartBackingForPhrase(judgeRef.current.phraseIndex, nextSpeed, 'speed');
  }, [restartBackingForPhrase]);

  const handleSpeedUp = useCallback((): void => {
    const nextSpeed = stepDefensePracticeSpeedPercent(practiceSpeedPercentRef.current, 1);
    if (nextSpeed === practiceSpeedPercentRef.current) return;
    setPracticeSpeedPercent(nextSpeed);
    void restartBackingForPhrase(judgeRef.current.phraseIndex, nextSpeed, 'speed');
  }, [restartBackingForPhrase]);

  const handleOctaveDown = useCallback((): void => {
    const nextShift = clampDefenseOctaveShift(settings.notationOctaveShift - 1);
    if (nextShift === settings.notationOctaveShift) return;
    updateSettings({ notationOctaveShift: nextShift });
  }, [settings.notationOctaveShift, updateSettings]);

  const handleOctaveUp = useCallback((): void => {
    const nextShift = clampDefenseOctaveShift(settings.notationOctaveShift + 1);
    if (nextShift === settings.notationOctaveShift) return;
    updateSettings({ notationOctaveShift: nextShift });
  }, [settings.notationOctaveShift, updateSettings]);

  const commitScheduledAudioSwitch = useCallback((phraseIndex: number): void => {
    defenseBackingDeck.commitSwitch();
    pendingSwitchAtRef.current = null;
    scheduledNextPhraseIndexRef.current = null;

    const nextIndex = nextPhraseIndex(stage.phrases, phraseIndex);
    const preloadUrls = resolveDefensePhrasePreloadUrls(stage, [nextIndex]);
    if (preloadUrls.length > 0) {
      void defenseBackingDeck.preload(preloadUrls);
    }
  }, [stage]);

  const handleNoteOn = useCallback((midiNote: number, sequential = false) => {
    if (isSettingsOpenRef.current) return;
    if (phaseRef.current !== 'playing') return;
    const runtime = runtimeRef.current;
    if (runtime.result !== 'playing') return;

    const pitchClass = normalizePitchClass(midiNote % 12);
    if (sequential) {
      const now = performance.now();
      const lastAt = lastVoicePcAtRef.current.get(pitchClass) ?? 0;
      if (now - lastAt < VOICE_DEFENSE_SAME_PC_DEBOUNCE_MS) {
        return;
      }
      lastVoicePcAtRef.current.set(pitchClass, now);
    }

    const autoAdvance = isTutorialSession
      ? Boolean(tutorialOptions?.autoAdvancePhrase)
      : !practiceMode;

    const evaluation = evaluateDefensePhraseNoteOn(
      activePhrases,
      stage.requiredCompletionCount,
      judgeRef.current,
      pitchClass,
      sequential,
      stage.attackTrigger,
      autoAdvance,
      stage.playStyle,
      stage.playRootOnChordChange,
    );

    if (evaluation.nextState === judgeRef.current) return;

    judgeRef.current = evaluation.nextState;
    setJudgeSnapshot(evaluation.nextState);

    if (evaluation.phraseCompleted && isTutorialSession && !tutorialPhraseSucceededRef.current) {
      tutorialPhraseSucceededRef.current = true;
      onTutorialPhraseSucceededRef.current?.();
    }

    if (evaluation.attack) {
      const speedRatio = defensePracticeSpeedRatio(practiceSpeedPercentRef.current);
      const effectiveBpm = stage.bpm > 0 ? stage.bpm * speedRatio : 60;
      const guardPoseSec = 60 / effectiveBpm;
      performDefenseSlash(runtime, guardPoseSec);
    }

    if (evaluation.playRootMidi != null) {
      FantasySoundManager.playBassMidiNote(evaluation.playRootMidi);
    }

    if (evaluation.measureCompleted && stage.attackTrigger === 'note' && !isChordVoicingStage) {
      chargeDefenseSp(runtime);
    }

    if (!isTutorialSession && !practiceMode && evaluation.pendingSwitch) {
      if (isChordVoicingStage && voicingKeyStateRef.current != null) {
        const nextKeyState = advanceVoicingKey(voicingKeyStateRef.current);
        voicingKeyStateRef.current = nextKeyState;
        setVoicingKeyState(nextKeyState);
        judgeRef.current = createInitialPhraseJudgeState(0);
        setJudgeSnapshot(judgeRef.current);
        return;
      }
      const nextIndex = nextPhraseIndex(stage.phrases, judgeRef.current.phraseIndex);
      const nextPhrase = stage.phrases[nextIndex];
      if (!nextPhrase) return;

      if (isSeparateTracksStage) {
        applyImmediatePhraseSwitch(nextIndex);
        separateTracksRequestRevisionRef.current += 1;
        defenseSeparateTracksDeck.requestPhrase(
          nextIndex,
          separateTracksRequestRevisionRef.current,
        );
      } else if (isSharedProgressionStage) {
        applyImmediatePhraseSwitch(nextIndex);
        sharedProgressionRequestRevisionRef.current += 1;
        defenseSharedProgressionDeck.requestPhrase(
          nextIndex,
          sharedProgressionRequestRevisionRef.current,
        );
      } else if (scheduledNextPhraseIndexRef.current === null) {
        scheduledNextPhraseIndexRef.current = nextIndex;
        applyImmediatePhraseSwitch(nextIndex);
        const generation = backingRestartGenerationRef.current;
        void (async () => {
          const ratio = defensePracticeSpeedRatio(practiceSpeedPercentRef.current);
          const playback = await defenseBackingDeck.preparePhraseBacking(stage, nextPhrase, ratio);
          if (backingRestartGenerationRef.current !== generation) return;
          if (scheduledNextPhraseIndexRef.current !== nextIndex) return;
          pendingSwitchAtRef.current = defenseBackingDeck.scheduleSwitch(playback);
        })();
      }
    }
  }, [
    activePhrases,
    stage,
    stage.requiredCompletionCount,
    stage.attackTrigger,
    stage.playStyle,
    stage.playRootOnChordChange,
    stage.bpm,
    practiceMode,
    isTutorialSession,
    isChordVoicingStage,
    tutorialOptions?.autoAdvancePhrase,
    applyImmediatePhraseSwitch,
    isSharedProgressionStage,
    isSeparateTracksStage,
  ]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    if (isTutorialSession && effectiveInputMethod !== 'touch') return;
    markAudioUserInteraction();
    const velocity = Math.round((settings.midiVolume ?? 0.8) * 100);
    void playNote(midiNote, velocity);
    handleNoteOn(midiNote, false);
  }, [handleNoteOn, isTutorialSession, effectiveInputMethod, settings.midiVolume]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
  }, [updateSettings]);

  useStandaloneNoteInput({
    enabled: !isTutorialSession
      || effectiveInputMethod === 'midi'
      || effectiveInputMethod === 'voice',
    inputMethod: effectiveInputMethod,
    voiceFastResponse: settings.voiceFastResponse ?? false,
    onNoteOn: (note) => {
      if (isTutorialSession && effectiveInputMethod === 'touch') return;
      handleNoteOn(note, voiceSequential);
    },
    onKeyHighlight: (note, active) => {
      pianoRef.current?.highlightKey(note, active);
    },
    playMidiSound: effectiveInputMethod !== 'touch',
  });

  useEffect(() => {
    const volume = settings.bgmVolume ?? 0.8;
    defenseBackingDeck.setVoiceInputDucking(voiceSequential);
    defenseBackingDeck.setUserVolume(volume);
    if (isSharedProgressionStage) {
      defenseSharedProgressionDeck.setVoiceInputDucking(voiceSequential);
      defenseSharedProgressionDeck.setUserVolume(volume);
    }
    if (isSeparateTracksStage) {
      defenseSeparateTracksDeck.setVoiceInputDucking(voiceSequential);
      defenseSeparateTracksDeck.setUserVolume(volume);
    }
    return () => {
      defenseBackingDeck.setVoiceInputDucking(false);
      if (isSharedProgressionStage) {
        defenseSharedProgressionDeck.setVoiceInputDucking(false);
      }
      if (isSeparateTracksStage) {
        defenseSeparateTracksDeck.setVoiceInputDucking(false);
      }
    };
  }, [voiceSequential, settings.bgmVolume, isSharedProgressionStage, isSeparateTracksStage]);

  useEffect(() => {
    let cancelled = false;
    phaseRef.current = 'loading';
    setPhase('loading');
    setCountdownSec(defenseStartCountdownDisplaySec(DEFENSE_START_COUNTDOWN_SEC));
    pendingPlaybackRef.current = null;

    const initialRatio = defensePracticeSpeedRatio(practiceSpeedPercentRef.current);
    defenseBackingDeck.setTransportConfig(stage.bpm * initialRatio, stage.beatsPerBar);

    void (async () => {
      unlockDefenseBackingAudioContext();
      if (isSharedProgressionStage) {
        unlockDefenseSharedProgressionAudioContext();
      }
      if (isSeparateTracksStage) {
        unlockDefenseSeparateTracksAudioContext();
      }
      if (isTutorialSession) {
        defenseBackingDeck.registerBufferFactory(
          DEFENSE_TUTORIAL_AUDIO_URL,
          (ctx) => synthesizeDefenseTutorialCdeBuffer(ctx, tutorialConcertMidisRef.current),
        );
      }
      const firstPhrase = stage.phrases[0];
      if (!firstPhrase) return;

      if (isSeparateTracksStage) {
        try {
          await defenseSeparateTracksDeck.prepare(stage, initialRatio);
        } catch {
          if (cancelled) return;
          phaseRef.current = 'loadError';
          setPhase('loadError');
          return;
        }
        if (cancelled) return;
        pendingPlaybackRef.current = null;
        phaseRef.current = 'countdown';
        setPhase('countdown');
        setCountdownSec(defenseStartCountdownDisplaySec(DEFENSE_START_COUNTDOWN_SEC));
        return;
      }

      if (isSharedProgressionStage) {
        try {
          await defenseSharedProgressionDeck.prepare(stage, initialRatio);
        } catch {
          if (cancelled) return;
          phaseRef.current = 'loadError';
          setPhase('loadError');
          return;
        }
        if (cancelled) return;
        pendingPlaybackRef.current = null;
        phaseRef.current = 'countdown';
        setPhase('countdown');
        setCountdownSec(defenseStartCountdownDisplaySec(DEFENSE_START_COUNTDOWN_SEC));
        return;
      }

      const preloadIndices = practiceMode
        ? stage.phrases.map((_, index) => index)
        : [0, 1].filter((index) => index < stage.phrases.length);
      const preloadUrls = resolveDefensePhrasePreloadUrls(stage, preloadIndices);
      await defenseBackingDeck.preload(preloadUrls);
      const playback = await defenseBackingDeck.preparePhraseBacking(
        stage,
        firstPhrase,
        initialRatio,
      );
      if (cancelled) return;
      pendingPlaybackRef.current = playback;
      phaseRef.current = 'countdown';
      setPhase('countdown');
      setCountdownSec(defenseStartCountdownDisplaySec(DEFENSE_START_COUNTDOWN_SEC));
    })();

    return () => {
      cancelled = true;
      pendingPlaybackRef.current = null;
      defenseBackingDeck.stop();
      if (isSharedProgressionStage) {
        defenseSharedProgressionDeck.stop();
      }
      if (isSeparateTracksStage) {
        defenseSeparateTracksDeck.stop();
      }
    };
  }, [stage, practiceMode, isTutorialSession, isSharedProgressionStage, isSeparateTracksStage]);

  useEffect(() => {
    if (isSettingsOpen) return undefined;
    if (phase !== 'countdown') return undefined;
    if (countdownSec <= 0) {
      beginPlay();
      return undefined;
    }
    const delayMs = countdownSec === 2
      ? DEFENSE_START_COUNTDOWN_FIRST_STEP_SEC * 1000
      : DEFENSE_START_COUNTDOWN_SECOND_STEP_SEC * 1000;
    const timer = window.setTimeout(() => {
      setCountdownSec((prev) => (prev <= 1 ? 0 : prev - 1));
    }, delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [phase, countdownSec, isSettingsOpen, beginPlay]);

  useEffect(() => {
    if (isSettingsOpen) return undefined;
    if (phase === 'loading' || phase === 'loadError') return undefined;
    if (phase === 'countdown') {
      lastFrameRef.current = null;
    }
    // rAF ループ: playing 中のみ tick。描画は loading/countdown 中も継続する。
    const loop = (now: number): void => {
      if (runtimeRef.current.result !== 'playing') {
        rafRef.current = null;
        return;
      }
      const runtime = runtimeRef.current;
      const shouldTick = phaseRef.current === 'playing';

      if (shouldTick) {
        const last = lastFrameRef.current ?? now;
        const dt = Math.min(0.05, (now - last) / 1000);
        lastFrameRef.current = now;

        tickDefenseSimulation(runtime, difficulty, dt);

        if (isSharedProgressionStage) {
          defenseSharedProgressionDeck.commitDueSwitch();
        } else {
          const pendingAt = pendingSwitchAtRef.current;
          if (pendingAt !== null && defenseBackingDeck.getCurrentTime() >= pendingAt) {
            const nextIdx = scheduledNextPhraseIndexRef.current;
            if (nextIdx !== null) {
              commitScheduledAudioSwitch(nextIdx);
            }
          }
        }

        if (trackElapsedForHints) {
          const elapsedFloor = Math.floor(runtime.elapsedSec);
          if (elapsedFloor !== elapsedIntRef.current && elapsedFloor <= HINT_FADE_TRACK_LIMIT_SEC) {
            elapsedIntRef.current = elapsedFloor;
            setElapsedInt(elapsedFloor);
          }
        }

        if (!isChordVoicingStage && stage.progressionChords.length > 0) {
          const beatInForm = isSeparateTracksStage
            ? defenseSeparateTracksDeck.getBeatInForm()
            : isSharedProgressionStage
              ? defenseSharedProgressionDeck.getBeatInForm()
              : defenseBackingDeck.getBeatInLoop() % (formBarCount * stage.beatsPerBar);
          const nextActiveIndex = resolveDefenseProgressionActiveIndex(
            stage.progressionChords,
            beatInForm,
            formBarCount,
            stage.beatsPerBar,
          );
          if (nextActiveIndex !== progressionActiveIndexRef.current) {
            progressionActiveIndexRef.current = nextActiveIndex;
            setProgressionActiveIndex(nextActiveIndex);
          }
        }
      }

      const hud = hudRef.current;
      hud.playerHp = runtime.playerHp;
      hud.playerMaxHp = runtime.playerMaxHp;
      hud.remainSec = Math.max(0, Math.ceil(runtime.surviveSeconds - runtime.elapsedSec));
      hud.enemiesDefeated = runtime.enemiesDefeated;
      hud.wave = practiceMode ? 0 : runtime.waveIndex + 1;
      canvasRef.current?.draw(runtime, hudRef.current);

      if (runtime.result !== 'playing') {
        const result = runtime.result;
        setFinalStats({
          result,
          surviveSec: Math.floor(runtime.elapsedSec),
          enemiesDefeated: runtime.enemiesDefeated,
        });
        if (result === 'clear' && !practiceMode) {
          onClearRef.current?.();
        }
        rafRef.current = null;
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    difficulty,
    commitScheduledAudioSwitch,
    practiceMode,
    trackElapsedForHints,
    isSettingsOpen,
    phase,
    isSharedProgressionStage,
    isSeparateTracksStage,
    stage.progressionChords,
    stage.beatsPerBar,
    formBarCount,
  ]);

  useEffect(() => {
    if (!isSharedProgressionStage && !isSeparateTracksStage) {
      return undefined;
    }
    if (isSettingsOpen) {
      if (isSeparateTracksStage) {
        defenseSeparateTracksDeck.pause();
      } else {
        defenseSharedProgressionDeck.pause();
      }
      return undefined;
    }
    if (phaseRef.current === 'playing') {
      if (isSeparateTracksStage) {
        defenseSeparateTracksDeck.resume();
      } else {
        defenseSharedProgressionDeck.resume();
      }
    }
    return undefined;
  }, [isSettingsOpen, isSharedProgressionStage, isSeparateTracksStage]);

  useEffect(() => {
    const overlay = pianoRef.current;
    if (!overlay) {
      return;
    }
    if (!showTargetHints || keyboardHintOpacity <= 0) {
      overlay.clearVoicingHints();
      return;
    }
    if (voiceSequential) {
      applySequentialSurvivalVoicingHints(overlay, keyboardHints, keyboardHintOpacity);
      return;
    }
    applySurvivalVoicingHintsWithOpacity(
      overlay,
      keyboardHints.pendingMidis.map((midi) => Math.round(midi)),
      keyboardHints.completedMidis.map((midi) => Math.round(midi)),
      keyboardHintOpacity,
    );
  }, [keyboardHints, showTargetHints, keyboardHintOpacity, voiceSequential]);

  if (finalStats && !suppressResultScreen) {
    return (
      <DefenseResult
        result={finalStats.result}
        stageId={stage.id}
        stageTitle={stage.title}
        practiceMode={practiceMode}
        surviveSec={finalStats.surviveSec}
        enemiesDefeated={finalStats.enemiesDefeated}
        isEnglishCopy={isEnglishCopy}
        onRetry={onRetry}
        onBack={onResultBack ?? onExit}
        nextStepLabel={resultNextStepLabel}
        onNextStep={onResultNextStep}
      />
    );
  }

  return (
    <div className="defense-game-screen relative h-[100dvh] overflow-hidden bg-slate-950 text-white">
      <DefenseCanvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {progressionChips.length > 0 && (
        <div
          className="pointer-events-none absolute left-0 right-0 z-20"
          style={{ top: DEFENSE_HUD_HEIGHT_PX + 4 }}
        >
          <DefenseChordProgressionHud chips={progressionChips} />
        </div>
      )}

      {tutorialStaffDisplay ? (
        <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2">
          <DefenseTutorialStaff
            groups={tutorialStaffDisplay.groups}
            keyFifths={phraseKeyFifths}
            clef={tutorialClef}
            activeGroupId={tutorialStaffDisplay.activeGroupId}
            correctPitchClassesByGroupId={tutorialStaffDisplay.correctPitchClassesByGroupId}
          />
        </div>
      ) : currentPhrase && currentPhrase.chords.length > 0 ? (
        <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2">
          <DefensePhraseStaff
            chord={currentPhrase.chords[judgeSnapshot.chordIndex] ?? null}
            keyFifths={phraseKeyFifths}
            staffLayout={stage.staffLayout}
            correctNoteIndices={judgeSnapshot.correctNoteIndices}
            revealedNoteIndices={judgeSnapshot.revealedNoteIndices}
            targetStepIndex={judgeSnapshot.targetStepIndex}
            showTargetHints={showTargetHints}
            unpressedNoteOpacity={staffHintOpacity}
          />
        </div>
      ) : null}

      {phase === 'loading' && (
        <p className="pointer-events-none absolute bottom-[96px] left-1/2 z-30 -translate-x-1/2 text-xs text-slate-400">
          {isEnglishCopy ? 'Loading backing track…' : '伴奏を読み込み中…'}
        </p>
      )}

      {phase === 'loadError' && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-black/60 px-6">
          <p className="text-center text-sm text-slate-200">
            {isEnglishCopy ? 'Could not load backing track.' : '伴奏を読み込めませんでした。'}
          </p>
          <button
            type="button"
            className="rounded-md bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
            onClick={onRetry}
          >
            {isEnglishCopy ? 'Retry' : '再試行'}
          </button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <span className="text-6xl font-bold text-white">{countdownSec}</span>
        </div>
      )}

      {practiceMode && currentPhrase && (
        <div
          className="absolute left-3 z-40"
          style={{ bottom: PIANO_OVERLAY_HEIGHT + 8 }}
        >
          <DefensePracticeHud
            phraseIndex={voicingKeyState?.index ?? judgeSnapshot.phraseIndex}
            phraseCount={isChordVoicingStage ? (voicingKeyState?.keys.length ?? 1) : stage.phrases.length}
            stepLabel={activeVoicingKey ?? undefined}
            isEnglishCopy={isEnglishCopy}
            onPrevPhrase={handlePrevPhrase}
            onNextPhrase={handleNextPhrase}
            disabled={phase !== 'playing'}
          />
        </div>
      )}

      {!isTutorialSession ? (
        <div className="absolute right-3 top-[56px] z-40 flex items-center gap-2">
          {!isChordVoicingStage ? (
            <DefenseSpeedStepper
              speedPercent={practiceSpeedPercent}
              isEnglishCopy={isEnglishCopy}
              onSpeedDown={handleSpeedDown}
              onSpeedUp={handleSpeedUp}
              disabled={phase !== 'playing'}
            />
          ) : null}
          <DefenseOctaveStepper
            octaveShift={settings.notationOctaveShift}
            isEnglishCopy={isEnglishCopy}
            onOctaveDown={handleOctaveDown}
            onOctaveUp={handleOctaveUp}
            disabled={phase !== 'playing'}
          />
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
            onClick={onExit}
          >
            {isEnglishCopy ? 'Back' : '戻る'}
          </button>
        </div>
      ) : null}

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

      {!isTutorialSession ? (
        <EarTrainingSettingsModal
          isOpen={isSettingsOpen}
          isEnglishCopy={isEnglishCopy}
          onClose={() => setIsSettingsOpen(false)}
          midiDeviceId={settings.selectedMidiDevice}
          onMidiDeviceChange={handleMidiDeviceChange}
          isMidiConnected={false}
          practiceRunMode={{
            practiceMode,
            onApplyPracticeModeAndRestart: onApplyPracticeModeAndRestart,
          }}
        />
      ) : null}
    </div>
  );
};
