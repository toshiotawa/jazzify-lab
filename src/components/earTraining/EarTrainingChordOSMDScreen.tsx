import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuestCompleteJingleOnStageClear, useGameOverJingleOnGameOver } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingBattleRenderer from './EarTrainingBattleRenderer';
import EarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './EarTrainingPianoOverlay';
import EarTrainingChordOSMDScore from './EarTrainingChordOSMDScore';
import type {
  ClearConditions,
  EarTrainingGameState,
  EarTrainingPhrase,
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
import { EAR_TRAINING_OSMD_STAFF_BAND } from '@/game/earTraining/canvas/earTrainingBattleLayout';
import { useGameStore } from '@/stores/gameStore';
import { cn } from '@/utils/cn';
import {
  MIDIController,
  markAudioUserInteraction,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import { toCdnProxyUrl } from '@/utils/cdnProxy';
import {
  getCachedEarTrainingMusicXml,
  prefetchEarTrainingLobbyAssetsFromStage,
  prefetchEarTrainingMusicXml,
  storeEarTrainingMusicXml,
} from '@/utils/prefetchEarTrainingLobbyAssets';
import {
  preloadBattleCountInClick,
  preloadBattleGmPiano,
} from '@/utils/ensureBattlePianoAudio';
import {
  getCompletionDamage,
  getNextPhraseIndex,
  mapEarTrainingRankToLessonRank,
} from '@/utils/earTrainingEngine';
import {
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
  getEarTrainingRhythmBattleStartCopy,
} from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import {
  buildEarTrainingEnemyBattleSourceKey,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  resolveEarTrainingEnemyAvatarFromBattleSourceKey,
} from '@/utils/earTrainingBattleAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import {
  EarTrainingChordVoicingPhrasePlayer,
} from '@/utils/earTrainingChordVoicingPhrasePlayer';
import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  EarTrainingChordVoicingDrumLoop,
  resolveChordVoicingSelfPacedPhraseClockUrl,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import {
  computeChordOsmdActiveMeasureNumber,
  computeChordOsmdPhraseLoopEndSec,
  OSMD_PARRY_PRECISE_RING_ON_SUCCESS,
  shouldStartTutorialOsmdDrumLoop,
} from '@/utils/earTrainingChordOsmdTimeline';
import {
  buildChordOsmdRhythmTargets,
  areAllChordOsmdTargetsCompleted,
  collectChordOsmdMusicXmlAttacks,
  collectChordOsmdMusicXmlLyrics,
  findFirstIncompleteChordOsmdTarget,
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  CHORD_OSMD_HAMMER_LEAD_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC,
  hasChordOsmdJudgmentWindowExpired,
  isPhraseTimeInChordOsmdJudgmentWindow,
  chordOsmdRankForAccuracy,
  chordOsmdTargetIsComplete,
  consumeChordOsmdMidi,
  createChordOsmdRemainingCounts,
  earTrainingOsmdUsesScoreTargets,
  getChordOsmdTotalNoteCount,
  normalizeChordOsmdMusicXml,
  type ChordOsmdLyricEvent,
  type ChordOsmdRhythmTarget,
} from '@/utils/earTrainingChordOsmd';
import {
  applyPracticeTransposeToMusicXml,
  clampPracticeTransposeOffset,
  fifthsToPreferredKeyName,
  readKeyFifthsFromMusicXml,
} from '@/utils/earTrainingPracticeTranspose';
import {
  clampPracticeSpeedPercent,
  effectivePracticeBpm,
  scalePracticePhraseLoopEndSec,
  scalePracticeTargetTimeSec,
  scalePracticeTimingWindowSec,
} from '@/utils/earTrainingPracticeSpeed';
import {
  clampEarTrainingOsmdTimingAdjustmentMs,
  loadEarTrainingOsmdTimingAdjustmentMs,
  resolveOsmdCalibratedTargetTimeSec,
  saveEarTrainingOsmdTimingAdjustmentMs,
} from '@/utils/earTrainingOsmdTimingAdjustment';
import { applyTutorialBattleSnapshot } from '@/components/earTraining/tutorial/applyTutorialBattleSnapshot';
import {
  clampTutorialPlayerHp,
  isEarTrainingTutorialNoCombat,
  shouldTutorialBlockGameOver,
} from '@/components/earTraining/tutorial/earTrainingTutorialBindings';
import type { EarTrainingTutorialOsmdConfig } from '@/components/earTraining/tutorial/earTrainingTutorialSceneConfig';
import {
  scheduleOsmdTimedLinesForLoop,
  type DialogueScheduleHandle,
} from '@/components/earTraining/tutorial/scheduleTimedDialogueLines';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingChordOSMDScreenProps {
  stage: EarTrainingStage;
  enemy: EarTrainingBattleEnemy | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
  tutorial?: EarTrainingTutorialOsmdConfig & { drumLoopUrl?: string; onSceneComplete: () => void };
}

interface RuntimeTargetState {
  remainingCounts: Map<number, number>;
  completed: boolean;
  failed: boolean;
  hammerEffectId?: number;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
/** OSMD 鍵盤ヒント: |Δ|≤30ms で最濃（alpha 0.85） */
const OSMD_VOICING_HINT_STRONG_SEC = 0.03;
/** OSMD 鍵盤ヒント: |Δ|≤70ms で中間（alpha 0.55） */
const OSMD_VOICING_HINT_MEDIUM_SEC = 0.07;
/** 正解連打時の statusText 更新間隔（React 再レンダリング抑制） */
const STATUS_TEXT_THROTTLE_MS = 400;
const NO_DAMAGE_CONFIG = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};

const EarTrainingChordOSMDScreen: React.FC<EarTrainingChordOSMDScreenProps> = ({
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
  const tutorialOsmdLoopRef = useRef(0);
  const tutorialDialogueHandleRef = useRef<DialogueScheduleHandle | null>(null);
  const tutorialDrumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const selfPacedDrumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
  const tutorialOsmdDrumLoopPrepareUrl = useMemo((): string | null => {
    if (!tutorial) {
      return null;
    }
    const raw = tutorial.drumLoopUrl?.trim();
    return raw && raw.length > 0 ? raw : CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL;
  }, [tutorial]);
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
  const osmdSelfPaced = useMemo(
    () => stage.mode === 'chord_osmd' && Boolean(stage.chord_voicing_self_paced),
    [stage.chord_voicing_self_paced, stage.mode],
  );
  const phrases = useMemo(
    () => (stage.phrases ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [stage.phrases],
  );
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const practiceModeRef = useRef(initialPracticeMode);
  const showKeyboardHintsInBattle = stage.show_keyboard_hints_in_battle === true;
  const showKeyboardHintsInBattleRef = useRef(showKeyboardHintsInBattle);
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

  const [statusText, setStatusText] = useState(
    () => getEarTrainingRhythmBattleStartCopy(isEnglishCopy, osmdSelfPaced),
  );
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('ear-training:osmd-screen-mounted');
    }
  }, []);

  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [activeMeasureNumber, setActiveMeasureNumber] = useState(1);
  const [scoreTimelineArmed, setScoreTimelineArmed] = useState(false);
  const [musicXmlText, setMusicXmlText] = useState<string | null>(null);
  const [baseMusicXmlText, setBaseMusicXmlText] = useState<string | null>(null);
  const [practiceTransposeOffset, setPracticeTransposeOffset] = useState(0);
  const [practiceSpeedPercent, setPracticeSpeedPercent] = useState(100);
  const [timingAdjustmentMs, setTimingAdjustmentMs] = useState(
    () => loadEarTrainingOsmdTimingAdjustmentMs(),
  );
  const measureDurationSec = useMemo(
    () => (60 / Math.max(1, effectivePracticeBpm(stage.bpm, practiceMode ? practiceSpeedPercent : 100)))
      * Math.max(1, stage.beats_per_measure),
    [practiceMode, practiceSpeedPercent, stage.beats_per_measure, stage.bpm],
  );
  const [scoreErrorText, setScoreErrorText] = useState<string | null>(null);
  const chordOsmdXmlAttacks = useMemo(
    () => (musicXmlText ? collectChordOsmdMusicXmlAttacks(musicXmlText) : null),
    [musicXmlText],
  );
  const [targets, setTargets] = useState<ChordOsmdRhythmTarget[]>([]);
  const [completedTargetCount, setCompletedTargetCount] = useState(0);
  const [lastRank, setLastRank] = useState<EarTrainingRank | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const startPhraseRef = useRef<(nextPhraseIndex: number) => void>(() => undefined);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const phraseIndexRef = useRef(0);
  const phraseRunIdRef = useRef(0);
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const targetsRef = useRef<ChordOsmdRhythmTarget[]>([]);
  const runtimeByTargetIdRef = useRef<Map<string, RuntimeTargetState>>(new Map());
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastStatusUpdateAtRef = useRef(0);
  const lastInputAtByNoteRef = useRef<Map<number, number>>(new Map());
  const battleEffectIdRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const phraseEndingRef = useRef(false);
  const totalCompletedTargetsRef = useRef(0);
  const totalJudgedTargetsRef = useRef(0);
  const lastRankRef = useRef<EarTrainingRank | null>(null);
  const phraseLyricsRef = useRef<readonly ChordOsmdLyricEvent[]>([]);
  const phraseLoopDurationSecRef = useRef(0);
  const phraseLoopEndSecRef = useRef(0);
  const nextHammerTargetIndexRef = useRef(0);
  const nextMissTargetIndexRef = useRef(0);
  const nextLyricQuoteIndexRef = useRef(0);
  const finishCurrentPhraseRef = useRef<(runId: number) => void>(() => undefined);
  const replaySelfPacedPhraseClockRef = useRef<() => void>(() => undefined);
  const osmdSelfPacedRef = useRef(osmdSelfPaced);
  const practiceTransposeOffsetRef = useRef(0);
  const practiceSpeedPercentRef = useRef(100);
  const timingAdjustmentMsRef = useRef(loadEarTrainingOsmdTimingAdjustmentMs());
  const practiceTransposeEnabled = stage.practice_transpose === true;

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { phraseIndexRef.current = phraseIndex; }, [phraseIndex]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);
  useEffect(() => { showKeyboardHintsInBattleRef.current = showKeyboardHintsInBattle; }, [showKeyboardHintsInBattle]);
  useEffect(() => { practiceTransposeOffsetRef.current = practiceTransposeOffset; }, [practiceTransposeOffset]);
  useEffect(() => { practiceSpeedPercentRef.current = practiceSpeedPercent; }, [practiceSpeedPercent]);
  useEffect(() => { timingAdjustmentMsRef.current = timingAdjustmentMs; }, [timingAdjustmentMs]);

  const resolveEffectiveTargetTimeSec = useCallback((targetTimeSec: number): number => {
    if (!practiceModeRef.current) {
      return targetTimeSec;
    }
    return scalePracticeTargetTimeSec(targetTimeSec, practiceSpeedPercentRef.current);
  }, []);

  const resolveCalibratedTargetTimeSec = useCallback((targetTimeSec: number): number => (
    resolveOsmdCalibratedTargetTimeSec(
      resolveEffectiveTargetTimeSec(targetTimeSec),
      timingAdjustmentMsRef.current,
    )
  ), [resolveEffectiveTargetTimeSec]);

  const resolveEffectiveTimingWindowSec = useCallback((baseSec: number): number => {
    if (!practiceModeRef.current) {
      return baseSec;
    }
    return scalePracticeTimingWindowSec(baseSec, practiceSpeedPercentRef.current);
  }, []);

  const resolveEffectivePracticeBpm = useCallback((): number => {
    if (!practiceModeRef.current) {
      return stage.bpm;
    }
    return effectivePracticeBpm(stage.bpm, practiceSpeedPercentRef.current);
  }, [stage.bpm]);

  useEffect(() => {
    if (!practiceMode) {
      if (practiceTransposeOffsetRef.current !== 0) {
        practiceTransposeOffsetRef.current = 0;
        setPracticeTransposeOffset(0);
        phrasePlayerRef.current?.setPitchShiftSemitones(0);
        if (baseMusicXmlText) {
          setMusicXmlText(baseMusicXmlText);
        }
      }
      if (practiceSpeedPercentRef.current !== 100) {
        practiceSpeedPercentRef.current = 100;
        setPracticeSpeedPercent(100);
        phrasePlayerRef.current?.setPlaybackSpeedPercent(100);
      }
      return;
    }
    if (!practiceTransposeEnabled && practiceTransposeOffsetRef.current !== 0) {
      practiceTransposeOffsetRef.current = 0;
      setPracticeTransposeOffset(0);
      phrasePlayerRef.current?.setPitchShiftSemitones(0);
      if (baseMusicXmlText) {
        setMusicXmlText(baseMusicXmlText);
      }
    }
  }, [baseMusicXmlText, practiceMode, practiceTransposeEnabled]);

  useEffect(() => {
    preloadBattleGmPiano();
    preloadBattleCountInClick();
    prefetchEarTrainingLobbyAssetsFromStage(stage);
  }, [stage]);

  useEffect(() => {
    if (!practiceMode && !showKeyboardHintsInBattle) {
      pianoOverlayRef.current?.clearVoicingHints();
    }
  }, [practiceMode, showKeyboardHintsInBattle]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  const ensurePhrasePlayer = useCallback((): EarTrainingChordVoicingPhrasePlayer => {
    if (!phrasePlayerRef.current) {
      phrasePlayerRef.current = new EarTrainingChordVoicingPhrasePlayer();
    }
    return phrasePlayerRef.current;
  }, []);

  useEffect(() => {
    phrasePlayerRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.musicVolume]);

  useEffect(() => {
    if (gameState !== 'idle') {
      return undefined;
    }
    const audioUrl = phrases[0]?.audio_url?.trim();
    if (!audioUrl) {
      return undefined;
    }
    const proxyUrl = toCdnProxyUrl(audioUrl);
    const player = ensurePhrasePlayer();
    void player.prepare(proxyUrl).catch(() => undefined);
    return undefined;
  }, [ensurePhrasePlayer, gameState, phrases]);

  useEffect(() => {
    if (gameState !== 'idle') {
      return undefined;
    }
    const musicXmlUrl = phrases[0]?.music_xml_url?.trim();
    if (!musicXmlUrl) {
      return undefined;
    }
    prefetchEarTrainingMusicXml(musicXmlUrl);
    return undefined;
  }, [gameState, phrases]);

  const clearScheduledTimers = useCallback(() => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current.clear();
    phaserGameRef.current?.setPlayerQuote(null);
  }, []);

  const scheduleTimer = useCallback((handler: () => void, delayMs: number) => {
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      handler();
    }, Math.max(0, delayMs));
    timersRef.current.add(timer);
    return timer;
  }, []);

  const publishTargetStates = useCallback(() => {
    let completed = 0;
    runtimeByTargetIdRef.current.forEach(state => {
      if (state.completed) {
        completed += 1;
      }
    });
    setCompletedTargetCount(completed);
  }, []);

  const isTargetIncomplete = useCallback((targetId: string): boolean => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    return Boolean(state && !state.completed && !state.failed);
  }, []);

  const isTargetCompleted = useCallback((targetId: string): boolean => (
    runtimeByTargetIdRef.current.get(targetId)?.completed === true
  ), []);

  const ensureSelfPacedDrumLoop = useCallback((): EarTrainingChordVoicingDrumLoop => {
    if (!selfPacedDrumLoopRef.current) {
      selfPacedDrumLoopRef.current = new EarTrainingChordVoicingDrumLoop();
    }
    return selfPacedDrumLoopRef.current;
  }, []);

  const stopSelfPacedDrumLoop = useCallback(() => {
    selfPacedDrumLoopRef.current?.stop();
  }, []);

  const syncSelfPacedMeasureAndHints = useCallback(() => {
    const firstTarget = findFirstIncompleteChordOsmdTarget(
      targetsRef.current,
      isTargetIncomplete,
    );
    const nextMeasure = firstTarget?.measureNumber
      ?? targetsRef.current[targetsRef.current.length - 1]?.measureNumber
      ?? 1;
    setActiveMeasureNumber(current => (current === nextMeasure ? current : nextMeasure));

    if (!showKeyboardHintsInBattleRef.current) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    if (!firstTarget) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    const state = runtimeByTargetIdRef.current.get(firstTarget.id);
    if (!state) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    const hintMidis: number[] = [];
    state.remainingCounts.forEach((count, midi) => {
      if (count > 0) {
        hintMidis.push(midi);
      }
    });
    if (hintMidis.length === 0) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    pianoOverlayRef.current?.setVoicingHintsByIntensity(hintMidis, [], [], []);
  }, [isTargetIncomplete]);

  const syncPracticeVoicingHints = useCallback(() => {
    if (osmdSelfPacedRef.current) {
      syncSelfPacedMeasureAndHints();
      return;
    }
    if (!practiceModeRef.current && !showKeyboardHintsInBattleRef.current) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    const player = phrasePlayerRef.current;
    const phraseT = player?.getPhraseTimelineSec();
    if (phraseT == null || !Number.isFinite(phraseT)) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    const earlyW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC);
    const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
    const tierByMidi = new Map<number, 0 | 1 | 2>();
    for (const target of targetsRef.current) {
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        continue;
      }
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      if (!isPhraseTimeInChordOsmdJudgmentWindow(phraseT, judged, earlyW, lateW)) {
        continue;
      }
      const dt = Math.abs(phraseT - judged);
      const tier: 0 | 1 | 2 = dt <= resolveEffectiveTimingWindowSec(OSMD_VOICING_HINT_STRONG_SEC)
        ? 0
        : dt <= resolveEffectiveTimingWindowSec(OSMD_VOICING_HINT_MEDIUM_SEC)
          ? 1
          : 2;
      state.remainingCounts.forEach((count, midi) => {
        if (count <= 0) {
          return;
        }
        const prev = tierByMidi.get(midi);
        if (prev === undefined || tier < prev) {
          tierByMidi.set(midi, tier);
        }
      });
    }
    if (tierByMidi.size === 0) {
      pianoOverlayRef.current?.clearVoicingHints();
    } else {
      const strongMidis: number[] = [];
      const mediumMidis: number[] = [];
      const softMidis: number[] = [];
      tierByMidi.forEach((tier, midi) => {
        if (tier === 0) {
          strongMidis.push(midi);
        } else if (tier === 1) {
          mediumMidis.push(midi);
        } else {
          softMidis.push(midi);
        }
      });
      pianoOverlayRef.current?.setVoicingHintsByIntensity(strongMidis, mediumMidis, softMidis, []);
    }
  }, [syncSelfPacedMeasureAndHints, resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec]);

  const stopPhraseAudio = useCallback(() => {
    phrasePlayerRef.current?.stop();
    stopSelfPacedDrumLoop();
    tutorialDrumLoopRef.current?.stop();
  }, [stopSelfPacedDrumLoop]);

  const triggerFeedback = useCallback((value: 'correct' | 'miss' | 'clear') => {
    setFeedback(value);
    scheduleTimer(() => setFeedback(null), 220);
  }, [scheduleTimer]);

  const triggerBattleEffect = useCallback((
    kind: EarTrainingBattleEffectKind,
    options: {
      label?: string;
      damage?: number;
      phraseNoteCount?: number;
      relatedEffectId?: number;
      travelDurationSec?: number;
      precise?: boolean;
    } = {},
  ): number => {
    battleEffectIdRef.current += 1;
    const effectId = battleEffectIdRef.current;
    const command: EarTrainingBattleEffectCommand = {
      id: effectId,
      kind,
      label: options.label,
      damage: options.damage,
      phraseNoteCount: options.phraseNoteCount,
      relatedEffectId: options.relatedEffectId,
      travelDurationSec: options.travelDurationSec,
      precise: options.precise,
    };
    phaserGameRef.current?.triggerEffect(command);
    return effectId;
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
    clearScheduledTimers();
    gameStateRef.current = 'stageClear';
    stopPhraseAudio();
    tutorialDrumLoopRef.current?.stop();
    lastRankRef.current = rank;
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
    clearScheduledTimers,
    copy.stageClear,
    lessonContext,
    onLessonStageClear,
    practiceMode,
    stopPhraseAudio,
    triggerFeedback,
  ]);

  const finishGameOver = useCallback((message: string) => {
    pendingImpactHandlersRef.current.clear();
    clearScheduledTimers();
    gameStateRef.current = 'gameOver';
    stopPhraseAudio();
    setGameState('gameOver');
    setStatusText(message);
  }, [clearScheduledTimers, stopPhraseAudio]);

  const applyEnemyDamage = useCallback((damage: number, rankForClear: EarTrainingRank | null) => {
    if (damage <= 0 || practiceMode) {
      return;
    }
    const nextEnemyHp = Math.max(0, enemyHpRef.current - damage);
    enemyHpRef.current = nextEnemyHp;
    setEnemyHp(nextEnemyHp);
    if (nextEnemyHp <= 0) {
      void finishStageClear(rankForClear ?? lastRankRef.current ?? 'Good');
    }
  }, [finishStageClear, practiceMode]);

  const applyPlayerDamage = useCallback((damage: number) => {
    if (damage <= 0 || practiceMode || tutorialNoCombat) {
      return;
    }
    const nextPlayerHp = clampTutorialPlayerHp(
      playerHpRef.current,
      damage,
      Boolean(tutorialUi?.playerInvincible),
    );
    playerHpRef.current = nextPlayerHp;
    setPlayerHp(nextPlayerHp);
    if (
      nextPlayerHp <= 0
      && !shouldTutorialBlockGameOver(nextPlayerHp, Boolean(tutorialUi?.playerInvincible))
    ) {
      finishGameOver(copy.gameOver);
    }
  }, [copy.gameOver, finishGameOver, practiceMode, tutorialNoCombat, tutorialUi?.playerInvincible]);

  const loadMusicXml = useCallback(async (phrase: EarTrainingPhrase, runId: number): Promise<string | null> => {
    const rawUrl = phrase.music_xml_url?.trim();
    if (!rawUrl) {
      setMusicXmlText(null);
      setBaseMusicXmlText(null);
      setScoreErrorText(isEnglishCopy ? 'MusicXML is not registered.' : 'MusicXMLが登録されていません');
      return null;
    }
    const resolveDisplayXml = (normalizedBase: string): string => {
      const offset = practiceTransposeEnabled && practiceModeRef.current
        ? practiceTransposeOffsetRef.current
        : 0;
      return applyPracticeTransposeToMusicXml(normalizedBase, offset);
    };
    const cached = getCachedEarTrainingMusicXml(rawUrl);
    if (cached) {
      setBaseMusicXmlText(cached);
      const displayXml = resolveDisplayXml(cached);
      setMusicXmlText(displayXml);
      setScoreErrorText(null);
      return displayXml;
    }
    try {
      const response = await fetch(toCdnProxyUrl(rawUrl));
      if (!response.ok) {
        throw new Error(String(response.status));
      }
      const text = await response.text();
      if (phraseRunIdRef.current !== runId) {
        return null;
      }
      if (!text.trim()) {
        setMusicXmlText(null);
        setBaseMusicXmlText(null);
        setScoreErrorText(isEnglishCopy ? 'MusicXML is empty.' : 'MusicXMLが空です');
        return null;
      }
      const normalizedText = normalizeChordOsmdMusicXml(text);
      storeEarTrainingMusicXml(rawUrl, normalizedText);
      setBaseMusicXmlText(normalizedText);
      const displayXml = resolveDisplayXml(normalizedText);
      setMusicXmlText(displayXml);
      setScoreErrorText(null);
      return displayXml;
    } catch {
      if (phraseRunIdRef.current === runId) {
        setMusicXmlText(null);
        setBaseMusicXmlText(null);
        setScoreErrorText(isEnglishCopy ? 'Could not load MusicXML.' : 'MusicXMLを読み込めませんでした');
      }
      return null;
    }
  }, [isEnglishCopy, practiceTransposeEnabled]);

  useEffect(() => {
    if (gameState !== 'idle' || phrases.length === 0) {
      return undefined;
    }
    void loadMusicXml(phrases[0], phraseRunIdRef.current);
    return undefined;
  }, [gameState, loadMusicXml, phrases]);

  useEffect(() => {
    const firstPhrase = phrases[0];
    if (gameState === 'idle' && firstPhrase) {
      const transposeOffset = practiceMode && practiceTransposeEnabled
        ? practiceTransposeOffset
        : 0;
      const initialTargets = buildChordOsmdRhythmTargets(
        firstPhrase,
        stage.bpm,
        stage.beats_per_measure,
        chordOsmdXmlAttacks,
        earTrainingOsmdUsesScoreTargets(stage),
        transposeOffset,
      );
      targetsRef.current = initialTargets;
      setTargets(initialTargets);
      setCompletedTargetCount(0);
    }
  }, [
    chordOsmdXmlAttacks,
    gameState,
    phrases,
    practiceMode,
    practiceTransposeEnabled,
    practiceTransposeOffset,
    stage,
    stage.bpm,
    stage.beats_per_measure,
  ]);

  const resetPhraseTimelineIndices = useCallback(() => {
    nextHammerTargetIndexRef.current = 0;
    nextMissTargetIndexRef.current = 0;
    nextLyricQuoteIndexRef.current = 0;
  }, []);

  const resetPhraseRuntime = useCallback((nextTargets: readonly ChordOsmdRhythmTarget[]) => {
    const runtime = new Map<string, RuntimeTargetState>();
    nextTargets.forEach(target => {
      runtime.set(target.id, {
        remainingCounts: createChordOsmdRemainingCounts(target),
        completed: false,
        failed: false,
      });
    });
    targetsRef.current = [...nextTargets];
    runtimeByTargetIdRef.current = runtime;
    resetPhraseTimelineIndices();
    pianoOverlayRef.current?.clearVoicingHints();
    setTargets([...nextTargets]);
    setCompletedTargetCount(0);
  }, [resetPhraseTimelineIndices]);

  const failTargetIfNeeded = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed || state.failed) {
      return;
    }
    state.failed = true;
    syncPracticeVoicingHints();
    triggerFeedback('miss');
    setStatusText(isEnglishCopy ? 'Miss' : 'ミス');
  }, [isEnglishCopy, syncPracticeVoicingHints, triggerFeedback]);

  const handleHammerImpact = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed) {
      return;
    }
    if (!state.failed) {
      state.failed = true;
    }
    if (!tutorialNoCombat) {
      applyPlayerDamage(activeDamageConfig.miss);
    }
  }, [activeDamageConfig.miss, applyPlayerDamage, tutorialNoCombat]);

  const finishCurrentPhrase = useCallback((runId: number) => {
    if (
      phraseRunIdRef.current !== runId
      || gameStateRef.current === 'stageClear'
      || gameStateRef.current === 'gameOver'
      || phraseEndingRef.current
    ) {
      return;
    }
    phraseEndingRef.current = true;
    stopPhraseAudio();

    let completed = 0;
    runtimeByTargetIdRef.current.forEach(state => {
      if (state.completed) {
        completed += 1;
      } else if (!state.failed) {
        state.failed = true;
      }
    });
    pianoOverlayRef.current?.clearVoicingHints();
    publishTargetStates();

    const phraseTargets = targetsRef.current;
    const phraseTotal = Math.max(1, phraseTargets.length);
    const accuracy = completed / phraseTotal;
    totalCompletedTargetsRef.current += completed;
    totalJudgedTargetsRef.current += phraseTotal;
    const rank = chordOsmdRankForAccuracy(accuracy);
    lastRankRef.current = rank;
    setLastRank(rank);
    const completionDamage = practiceMode ? 0 : getCompletionDamage(rank, activeDamageConfig);
    const playerFailDamage = !practiceMode && rank === 'Fail' ? activeDamageConfig.fail : 0;

    gameStateRef.current = 'phraseComplete';
    setGameState('phraseComplete');
    setStatusText(isEnglishCopy
      ? `Phrase accuracy ${Math.round(accuracy * 100)}%`
      : `フレーズ正解率 ${Math.round(accuracy * 100)}%`);

    const pendingPhraseImpacts =
      (completionDamage > 0 ? 1 : 0) + (playerFailDamage > 0 ? 1 : 0);

    const advanceAfterPhraseBattleEffects = (): void => {
      if (tutorial) {
        tutorialOsmdLoopRef.current += 1;
        if (tutorialOsmdLoopRef.current >= tutorial.scene.requiredLoops) {
          tutorial.onSceneComplete();
          return;
        }
        const nextIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
        startPhraseRef.current(nextIndex);
        return;
      }
      if (!practiceMode && enemyHpRef.current <= 0) {
        return;
      }
      if (!practiceMode && playerHpRef.current <= 0) {
        return;
      }
      const nextIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
      startPhraseRef.current(nextIndex);
    };

    if (pendingPhraseImpacts === 0) {
      if (!practiceMode && enemyHpRef.current - completionDamage <= 0) {
        return;
      }
      if (!practiceMode && playerHpRef.current - playerFailDamage <= 0) {
        return;
      }
      advanceAfterPhraseBattleEffects();
      return;
    }

    let phraseImpactRemainder = pendingPhraseImpacts;
    const onPhraseBattleEffectImpactDone = (): void => {
      phraseImpactRemainder -= 1;
      if (phraseImpactRemainder > 0) {
        return;
      }
      advanceAfterPhraseBattleEffects();
    };

    if (completionDamage > 0) {
      const effectId = triggerBattleEffect(
        rank === 'Perfect' ? 'osmdMeteor' : 'complete',
        {
          label: rank,
          damage: completionDamage,
          phraseNoteCount: getChordOsmdTotalNoteCount(phraseTargets),
        },
      );
      registerBattleEffectImpact(effectId, () => {
        applyEnemyDamage(completionDamage, rank);
        onPhraseBattleEffectImpactDone();
      });
    }

    if (playerFailDamage > 0) {
      const effectId = triggerBattleEffect('fail', {
        label: 'Fail',
        damage: playerFailDamage,
      });
      registerBattleEffectImpact(effectId, () => {
        applyPlayerDamage(playerFailDamage);
        onPhraseBattleEffectImpactDone();
      });
    }
  }, [
    activeDamageConfig,
    applyEnemyDamage,
    applyPlayerDamage,
    isEnglishCopy,
    phrases.length,
    practiceMode,
    publishTargetStates,
    registerBattleEffectImpact,
    stopPhraseAudio,
    triggerBattleEffect,
  ]);

  const throwDueHammers = useCallback((phraseTimeSec: number) => {
    const phraseTargets = targetsRef.current;
    while (nextHammerTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextHammerTargetIndexRef.current];
      const throwTime = resolveCalibratedTargetTimeSec(target.targetTimeSec) - CHORD_OSMD_HAMMER_LEAD_SEC;
      if (phraseTimeSec + 1e-9 < throwTime) {
        break;
      }
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        nextHammerTargetIndexRef.current += 1;
        continue;
      }
      const impactTimeSec = resolveCalibratedTargetTimeSec(target.targetTimeSec) + CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC;
      const travelDurationSec = Math.max(0.12, impactTimeSec - phraseTimeSec);
      const effectId = triggerBattleEffect('osmdHammer', { travelDurationSec });
      state.hammerEffectId = effectId;
      const targetId = target.id;
      registerBattleEffectImpact(effectId, () => {
        handleHammerImpact(targetId);
      });
      nextHammerTargetIndexRef.current += 1;
    }
  }, [handleHammerImpact, registerBattleEffectImpact, resolveCalibratedTargetTimeSec, triggerBattleEffect]);

  const failExpiredTargets = useCallback((phraseTimeSec: number) => {
    const phraseTargets = targetsRef.current;
    while (nextMissTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextMissTargetIndexRef.current];
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
      if (!hasChordOsmdJudgmentWindowExpired(phraseTimeSec, judged, lateW)) {
        break;
      }
      failTargetIfNeeded(target.id);
      nextMissTargetIndexRef.current += 1;
    }
  }, [failTargetIfNeeded, resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec]);

  const applyMusicXmlLyricQuotes = useCallback((phraseTimeSec: number) => {
    const lyrics = phraseLyricsRef.current;
    while (
      nextLyricQuoteIndexRef.current < lyrics.length
      && phraseTimeSec + 1e-9 >= resolveCalibratedTargetTimeSec(lyrics[nextLyricQuoteIndexRef.current].targetTimeSec)
    ) {
      phaserGameRef.current?.setPlayerQuote(lyrics[nextLyricQuoteIndexRef.current].text);
      nextLyricQuoteIndexRef.current += 1;
    }
  }, [resolveCalibratedTargetTimeSec]);

  const updateActiveMeasureForPhraseTime = useCallback((phraseTimeSec: number) => {
    if (phraseTimeSec < 0) {
      return;
    }
    const nextMeasure = computeChordOsmdActiveMeasureNumber(
      phraseTimeSec,
      resolveEffectivePracticeBpm(),
      stage.beats_per_measure,
      phraseLoopDurationSecRef.current,
      stage.loop_measures,
      targetsRef.current,
    );
    setActiveMeasureNumber(current => (current === nextMeasure ? current : nextMeasure));
  }, [resolveEffectivePracticeBpm, stage.beats_per_measure, stage.loop_measures]);

  const handlePhraseTimelineTick = useCallback(() => {
    if (phraseEndingRef.current) {
      return;
    }
    const state = gameStateRef.current;
    if (state !== 'countIn' && state !== 'playingPhrase') {
      return;
    }

    if (osmdSelfPacedRef.current) {
      if (state === 'playingPhrase') {
        syncSelfPacedMeasureAndHints();
        if (areAllChordOsmdTargetsCompleted(targetsRef.current, isTargetCompleted)) {
          finishCurrentPhraseRef.current(phraseRunIdRef.current);
        }
      }
      return;
    }

    const phraseTimeSec = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseTimeSec == null || !Number.isFinite(phraseTimeSec)) {
      return;
    }

    if (phraseTimeSec >= 0) {
      updateActiveMeasureForPhraseTime(phraseTimeSec);
    }
    throwDueHammers(phraseTimeSec);
    failExpiredTargets(phraseTimeSec);
    applyMusicXmlLyricQuotes(phraseTimeSec);
    syncPracticeVoicingHints();

    if (state !== 'playingPhrase') {
      return;
    }
    if (phraseTimeSec >= phraseLoopEndSecRef.current) {
      finishCurrentPhraseRef.current(phraseRunIdRef.current);
    }
  }, [
    applyMusicXmlLyricQuotes,
    failExpiredTargets,
    isTargetCompleted,
    syncPracticeVoicingHints,
    syncSelfPacedMeasureAndHints,
    throwDueHammers,
    updateActiveMeasureForPhraseTime,
  ]);

  useEffect(() => {
    if (gameState !== 'countIn' && gameState !== 'playingPhrase') {
      return undefined;
    }
    let rafId = 0;
    let frameSkip = 0;
    const tick = (): void => {
      frameSkip += 1;
      if (frameSkip >= 2) {
        frameSkip = 0;
        handlePhraseTimelineTick();
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [gameState, handlePhraseTimelineTick]);

  const replaySelfPacedPhraseClock = useCallback(() => {
    if (!osmdSelfPacedRef.current || gameStateRef.current !== 'playingPhrase') {
      return;
    }
    const phrase = phrases[phraseIndexRef.current];
    if (!phrase) {
      return;
    }
    const phraseClockUrl = resolveChordVoicingSelfPacedPhraseClockUrl(phrase.audio_url);
    const player = ensurePhrasePlayer();
    void (async () => {
      try {
        const prepared = await player.prepare(toCdnProxyUrl(phraseClockUrl));
        player.playPrepared({
          prepared,
          phraseGain: 0,
          onPhraseStarted: () => {
            ensureSelfPacedDrumLoop().start();
            syncSelfPacedMeasureAndHints();
          },
          onEnded: () => {
            replaySelfPacedPhraseClockRef.current();
          },
        });
      } catch {
        setStatusText(copy.audioFailed);
      }
    })();
  }, [copy.audioFailed, ensurePhrasePlayer, ensureSelfPacedDrumLoop, phrases, syncSelfPacedMeasureAndHints]);

  useEffect(() => {
    replaySelfPacedPhraseClockRef.current = replaySelfPacedPhraseClock;
  }, [replaySelfPacedPhraseClock]);

  const startPhrase = useCallback((nextPhraseIndex: number) => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver(copy.noPhrases);
      return;
    }

    clearScheduledTimers();
    phraseEndingRef.current = false;
    stopPhraseAudio();

    phraseRunIdRef.current += 1;
    const runId = phraseRunIdRef.current;
    setPhraseIndex(nextPhraseIndex);
    phraseIndexRef.current = nextPhraseIndex;
    setPhraseRunId(runId);
    setPhraseIntroSeq(current => current + 1);
    setLastRank(null);
    if (osmdSelfPaced) {
      setStatusText(copy.phraseLabel(nextPhraseIndex + 1));
      gameStateRef.current = 'idle';
      setGameState('idle');
    } else {
      setStatusText(copy.countIn);
      gameStateRef.current = 'countIn';
      setGameState('countIn');
    }

    resetPhraseRuntime([]);
    setScoreTimelineArmed(false);

    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    const player = ensurePhrasePlayer();
    player.setVolume(settings.musicVolume * settings.masterVolume);
    player.setPitchShiftSemitones(
      practiceTransposeEnabled && practiceModeRef.current
        ? practiceTransposeOffsetRef.current
        : 0,
    );
    player.setPlaybackSpeedPercent(
      practiceModeRef.current ? practiceSpeedPercentRef.current : 100,
    );

    void (async () => {
      const xmlText = await loadMusicXml(phrase, runId);
      if (phraseRunIdRef.current !== runId) {
        return;
      }

      const attacks = xmlText ? collectChordOsmdMusicXmlAttacks(xmlText) : null;
      const transposeOffset = practiceTransposeEnabled && practiceModeRef.current
        ? practiceTransposeOffsetRef.current
        : 0;
      const phraseTargets = buildChordOsmdRhythmTargets(
        phrase,
        stage.bpm,
        stage.beats_per_measure,
        attacks,
        earTrainingOsmdUsesScoreTargets(stage),
        transposeOffset,
      );
      if (phraseTargets.length === 0) {
        finishGameOver(isEnglishCopy ? 'No chord timings are registered.' : '判定用コードタイミングが登録されていません');
        return;
      }

      resetPhraseRuntime(phraseTargets);
      const initialMeasureNumber = Math.max(1, phraseTargets[0]?.measureNumber ?? 1);

      if (osmdSelfPacedRef.current) {
        const phraseClockUrl = resolveChordVoicingSelfPacedPhraseClockUrl(phrase.audio_url);
        let preparedSelfPaced;
        try {
          preparedSelfPaced = await player.prepare(toCdnProxyUrl(phraseClockUrl));
        } catch {
          if (phraseRunIdRef.current === runId) {
            setStatusText(copy.audioFailed);
          }
          return;
        }
        if (phraseRunIdRef.current !== runId) {
          return;
        }
        const phraseCtx = player.getAudioContext();
        if (phraseCtx) {
          try {
            const drum = ensureSelfPacedDrumLoop();
            await drum.prepare(CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL, phraseCtx);
            drum.setVolume(settings.musicVolume * settings.masterVolume);
          } catch {
            // ドラム取得失敗時はフレーズ時計のみ
          }
        }
        setScoreTimelineArmed(true);
        setActiveMeasureNumber(initialMeasureNumber);
        player.playPrepared({
          prepared: preparedSelfPaced,
          phraseGain: 0,
          onPhraseStarted: () => {
            if (phraseRunIdRef.current !== runId) {
              return;
            }
            gameStateRef.current = 'playingPhrase';
            setGameState('playingPhrase');
            ensureSelfPacedDrumLoop().start();
            syncSelfPacedMeasureAndHints();
          },
          onEnded: () => {
            replaySelfPacedPhraseClockRef.current();
          },
        });
        return;
      }

      let prepared;
      try {
        prepared = await player.prepare(toCdnProxyUrl(phrase.audio_url));
      } catch {
        if (phraseRunIdRef.current === runId) {
          setStatusText(copy.audioFailed);
        }
        return;
      }
      if (phraseRunIdRef.current !== runId) {
        return;
      }

      setScoreTimelineArmed(true);
      setActiveMeasureNumber(initialMeasureNumber);

      const loopDurationSec = Number(phrase.loop_duration_sec);
      const measureDurationSec = (60 / Math.max(1, stage.bpm)) * Math.max(1, stage.beats_per_measure);
      const safeLoopDurationSec = Number.isFinite(loopDurationSec) && loopDurationSec > 0
        ? loopDurationSec
        : measureDurationSec * Math.max(1, stage.loop_measures);
      phraseLoopDurationSecRef.current = practiceModeRef.current
        ? scalePracticePhraseLoopEndSec(safeLoopDurationSec, practiceSpeedPercentRef.current)
        : safeLoopDurationSec;
      phraseLoopEndSecRef.current = scalePracticePhraseLoopEndSec(
        computeChordOsmdPhraseLoopEndSec(safeLoopDurationSec, phraseTargets)
          + timingAdjustmentMsRef.current / 1000,
        practiceModeRef.current ? practiceSpeedPercentRef.current : 100,
      );
      const phraseLyrics = xmlText
        ? collectChordOsmdMusicXmlLyrics(xmlText, stage.bpm, stage.beats_per_measure)
        : [];
      phraseLyricsRef.current = phraseLyrics;
      if (tutorial) {
        tutorialDialogueHandleRef.current?.cancel();
        tutorialDialogueHandleRef.current = scheduleOsmdTimedLinesForLoop({
          bpm: resolveEffectivePracticeBpm(),
          beatsPerMeasure: stage.beats_per_measure,
          countInBeats: stage.count_in_beats,
          loopMeasures: stage.loop_measures,
          phraseLoopDurationSec: safeLoopDurationSec,
          timedLines: tutorial.scene.timedLines,
          isEnglishCopy,
          onLine: (text) => {
            phaserGameRef.current?.setPlayerQuote(text);
          },
          loopIndex: tutorialOsmdLoopRef.current,
          skipCountInForLoop: loopIdx => loopIdx > 0,
        });
      }
      const onPhraseStarted = (): void => {
        if (phraseRunIdRef.current !== runId) {
          return;
        }
        gameStateRef.current = 'playingPhrase';
        setGameState('playingPhrase');
        setStatusText(copy.phraseLabel(nextPhraseIndex + 1));
        const drumUrl = tutorialOsmdDrumLoopPrepareUrl;
        if (drumUrl && shouldStartTutorialOsmdDrumLoop(phrase.audio_url, drumUrl)) {
          void (async () => {
            try {
              const ctx = player.getAudioContext();
              if (!ctx || phraseRunIdRef.current !== runId) {
                return;
              }
              const loop = tutorialDrumLoopRef.current ?? new EarTrainingChordVoicingDrumLoop();
              tutorialDrumLoopRef.current = loop;
              await loop.prepare(drumUrl, ctx);
              loop.setVolume(settings.musicVolume * settings.masterVolume * 0.35);
              if (phraseRunIdRef.current !== runId) {
                return;
              }
              loop.start();
            } catch {
              // tutorial BGM は補助のみ
            }
          })();
        }
      };
      const onEnded = (): void => {
        finishCurrentPhrase(runId);
      };

      if (beats <= 0) {
        player.playPrepared({
          prepared,
          onPhraseStarted,
          onEnded,
        });
        return;
      }
      player.schedulePreparedPhraseWithCountIn({
        prepared,
        countInBeats: beats,
        bpm: resolveEffectivePracticeBpm(),
        beatGain: settings.masterVolume * settings.musicVolume,
        inputWindowLeadSec: resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC),
        onPhraseStarted,
        onEnded,
      });
    })();
  }, [
    clearScheduledTimers,
    copy,
    ensurePhrasePlayer,
    ensureSelfPacedDrumLoop,
    finishCurrentPhrase,
    finishGameOver,
    isEnglishCopy,
    loadMusicXml,
    osmdSelfPaced,
    phrases,
    resetPhraseRuntime,
    settings.masterVolume,
    settings.musicVolume,
    resolveEffectivePracticeBpm,
    resolveEffectiveTimingWindowSec,
    stage.beats_per_measure,
    stage.count_in_beats,
    stage.loop_measures,
    practiceSpeedPercent,
    stopPhraseAudio,
    syncSelfPacedMeasureAndHints,
    tutorial,
    tutorialOsmdDrumLoopPrepareUrl,
  ]);

  useEffect(() => {
    finishCurrentPhraseRef.current = finishCurrentPhrase;
  }, [finishCurrentPhrase]);

  useEffect(() => {
    startPhraseRef.current = startPhrase;
  }, [startPhrase]);

  const ensureBattleAudioReady = useCallback(async (): Promise<void> => {
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
    await import('@/utils/ensureBattlePianoAudio').then(({ ensureBattlePianoAudio }) =>
      ensureBattlePianoAudio({
        midiVolume: settings.midiVolume,
        soundEffectVolume: settings.soundEffectVolume,
        rootSoundVolume: settings.rootSoundVolume,
      }),
    );
    await controller.initialize();
    if (settings.selectedMidiDevice) {
      const connected = await controller.connectDevice(settings.selectedMidiDevice);
      setIsMidiConnected(Boolean(connected));
    }
  }, [
    settings.midiVolume,
    settings.rootSoundVolume,
    settings.selectedMidiDevice,
    settings.soundEffectVolume,
  ]);

  const startBattle = useCallback(() => {
    if (phrases.length === 0) {
      finishGameOver(copy.noPhrases);
      return;
    }
    pendingImpactHandlersRef.current.clear();
    markAudioUserInteraction();
    void ensureBattleAudioReady()
      .then(() => {
        if (typeof performance !== 'undefined' && performance.mark) {
          performance.mark('ear-training:start-ready');
        }
      })
      .catch(() => setIsMidiConnected(false));
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    lastInputAtByNoteRef.current.clear();
    totalCompletedTargetsRef.current = 0;
    totalJudgedTargetsRef.current = 0;
    lastRankRef.current = null;
    setEnemyHp(stage.enemy_hp);
    setPlayerHp(stage.player_hp);
    enemyHpRef.current = stage.enemy_hp;
    playerHpRef.current = stage.player_hp;
    battleEffectIdRef.current = 0;
    startPhrase(0);
  }, [copy.noPhrases, ensureBattleAudioReady, finishGameOver, phrases.length, stage.enemy_hp, stage.player_hp, startPhrase]);

  const applyPracticePlaybackAndRestart = useCallback((params: {
    speedPercent: number;
    transposeOffset: number;
  }) => {
    const clampedSpeed = clampPracticeSpeedPercent(params.speedPercent);
    practiceSpeedPercentRef.current = clampedSpeed;
    setPracticeSpeedPercent(clampedSpeed);
    const clampedOffset = practiceTransposeEnabled
      ? clampPracticeTransposeOffset(params.transposeOffset)
      : 0;
    practiceTransposeOffsetRef.current = clampedOffset;
    setPracticeTransposeOffset(clampedOffset);
    const player = ensurePhrasePlayer();
    player.setPitchShiftSemitones(clampedOffset);
    player.setPlaybackSpeedPercent(clampedSpeed);
    stopPhraseAudio();
    clearScheduledTimers();
    if (baseMusicXmlText) {
      setMusicXmlText(applyPracticeTransposeToMusicXml(baseMusicXmlText, clampedOffset));
    }
    setIsSettingsOpen(false);
    startBattle();
  }, [baseMusicXmlText, clearScheduledTimers, ensurePhrasePlayer, practiceTransposeEnabled, startBattle, stopPhraseAudio]);

  const originalKeyFifths = useMemo(
    () => (baseMusicXmlText ? readKeyFifthsFromMusicXml(baseMusicXmlText) : 0),
    [baseMusicXmlText],
  );
  const originalKeyName = useMemo(
    () => (baseMusicXmlText ? fifthsToPreferredKeyName(originalKeyFifths) : '—'),
    [baseMusicXmlText, originalKeyFifths],
  );

  const practiceTransposeConfig = useMemo(
    () => (
      practiceTransposeEnabled
        ? {
            enabled: true,
            practiceMode,
            originalKeyFifths,
            originalKeyName,
            appliedOffset: practiceTransposeOffset,
          }
        : undefined
    ),
    [
      originalKeyFifths,
      originalKeyName,
      practiceMode,
      practiceTransposeEnabled,
      practiceTransposeOffset,
    ],
  );

  const practiceSpeedConfig = useMemo(
    () => ({
      practiceMode,
      appliedSpeedPercent: practiceSpeedPercent,
      onApplyAndRestart: applyPracticePlaybackAndRestart,
    }),
    [applyPracticePlaybackAndRestart, practiceMode, practiceSpeedPercent],
  );

  const handleTimingAdjustmentChange = useCallback((nextMs: number) => {
    const clamped = clampEarTrainingOsmdTimingAdjustmentMs(nextMs);
    timingAdjustmentMsRef.current = clamped;
    setTimingAdjustmentMs(clamped);
    saveEarTrainingOsmdTimingAdjustmentMs(clamped);
  }, []);

  const osmdTimingAdjustmentConfig = useMemo(
    () => ({
      appliedOffsetMs: timingAdjustmentMs,
      onChange: handleTimingAdjustmentChange,
    }),
    [handleTimingAdjustmentChange, timingAdjustmentMs],
  );

  const completeTarget = useCallback((
    target: ChordOsmdRhythmTarget,
    state: RuntimeTargetState,
  ) => {
    state.completed = true;
    syncPracticeVoicingHints();
    if (state.hammerEffectId !== undefined) {
      pendingImpactHandlersRef.current.delete(state.hammerEffectId);
    }
    const statusNow = performance.now();
    if (statusNow - lastStatusUpdateAtRef.current >= STATUS_TEXT_THROTTLE_MS) {
      lastStatusUpdateAtRef.current = statusNow;
      setStatusText(copy.chordCompleted(target.label));
    }
    const damage = activeDamageConfig.perCorrectNote;
    const effectId = triggerBattleEffect('osmdHammerReflect', {
      label: target.label,
      damage,
      relatedEffectId: state.hammerEffectId,
      precise: OSMD_PARRY_PRECISE_RING_ON_SUCCESS,
    });
    registerBattleEffectImpact(effectId, () => {
      applyEnemyDamage(damage, lastRankRef.current);
    });
  }, [
    activeDamageConfig.perCorrectNote,
    applyEnemyDamage,
    copy,
    registerBattleEffectImpact,
    syncPracticeVoicingHints,
    triggerBattleEffect,
  ]);

  const handleNoteInput = useCallback((note: number) => {
    const now = performance.now();
    const midiNote = Math.round(note);
    const lastInputAt = lastInputAtByNoteRef.current.get(midiNote) ?? 0;
    if (now - lastInputAt < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtByNoteRef.current.set(midiNote, now);
    if (gameStateRef.current !== 'playingPhrase' && gameStateRef.current !== 'countIn') {
      return;
    }

    if (osmdSelfPacedRef.current) {
      if (gameStateRef.current !== 'playingPhrase') {
        return;
      }
      const firstTarget = findFirstIncompleteChordOsmdTarget(
        targetsRef.current,
        isTargetIncomplete,
      );
      if (!firstTarget) {
        return;
      }
      const state = runtimeByTargetIdRef.current.get(firstTarget.id);
      if (!state || state.completed || state.failed) {
        return;
      }
      const nextRemaining = consumeChordOsmdMidi(state.remainingCounts, midiNote);
      if (!nextRemaining) {
        return;
      }
      state.remainingCounts = nextRemaining;
      syncSelfPacedMeasureAndHints();
      if (chordOsmdTargetIsComplete(nextRemaining)) {
        completeTarget(firstTarget, state);
        if (areAllChordOsmdTargetsCompleted(targetsRef.current, isTargetCompleted)) {
          finishCurrentPhraseRef.current(phraseRunIdRef.current);
        }
      }
      return;
    }

    const phraseT = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseT == null || !Number.isFinite(phraseT)) {
      return;
    }
    const earlyW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC);
    const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
    for (const target of targetsRef.current) {
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        continue;
      }
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      if (!isPhraseTimeInChordOsmdJudgmentWindow(phraseT, judged, earlyW, lateW)) {
        continue;
      }
      const nextRemaining = consumeChordOsmdMidi(state.remainingCounts, midiNote);
      if (!nextRemaining) {
        continue;
      }
      state.remainingCounts = nextRemaining;
      if (practiceModeRef.current) {
        syncPracticeVoicingHints();
      }
      if (chordOsmdTargetIsComplete(nextRemaining)) {
        completeTarget(target, state);
      }
      return;
    }
  }, [completeTarget, isTargetCompleted, isTargetIncomplete, resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec, syncPracticeVoicingHints, syncSelfPacedMeasureAndHints]);

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
    return () => {
      void controller.destroy();
      midiControllerRef.current = null;
    };
  }, []);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
    if (!deviceId) {
      midiControllerRef.current?.disconnect();
      setIsMidiConnected(false);
      return;
    }
    void ensureBattleAudioReady()
      .then(() => midiControllerRef.current?.connectDevice(deviceId))
      .then(connected => {
        setIsMidiConnected(Boolean(connected));
      })
      .catch(() => setIsMidiConnected(false));
  }, [ensureBattleAudioReady, updateSettings]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  useEffect(() => {
    return () => {
      tutorialDrumLoopRef.current?.stop();
      selfPacedDrumLoopRef.current?.dispose();
      selfPacedDrumLoopRef.current = null;
      pendingImpactHandlersRef.current.clear();
      clearScheduledTimers();
      stopPhraseAudio();
      phrasePlayerRef.current?.dispose();
      phrasePlayerRef.current = null;
    };
  }, [clearScheduledTimers, stopPhraseAudio]);

  const enemyName = enemy?.name ?? 'Random Rival';
  const enemyBattleKey = buildEarTrainingEnemyBattleSourceKey(stage.id, enemy ?? { id: 'enemy', name: null });
  const { url: enemyAvatar, flipX: enemyAvatarFlipX } =
    resolveEarTrainingEnemyAvatarFromBattleSourceKey(enemyBattleKey);
  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear' || gameState === 'gameOver';
  const showLobbyControls = canChangePracticeMode;
  const startButtonLabel = gameState === 'idle' ? 'START' : 'RETRY';
  const stageStatusText = statusText;
  const resultState = gameState === 'stageClear'
    ? 'win'
    : gameState === 'gameOver'
      ? 'lose'
      : null;
  const lessonProgressText = lessonContext && gameState === 'stageClear'
    ? progressSaved ? copy.lessonSaved : copy.lessonSaving
    : null;
  const phraseIntroLine = '';
  const resultRankLine = null;
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);
  const timeLabel = practiceMode
    ? '∞'
    : `${Math.min(phraseIndex + 1, Math.max(1, phrases.length))}/${Math.max(1, phrases.length)}`;

  useEffect(() => {
    if (!tutorial?.bindings.ui.hideLobby) {
      return undefined;
    }
    if (gameStateRef.current !== 'idle') {
      return undefined;
    }
    tutorialOsmdLoopRef.current = 0;
    const timer = setTimeout(() => startBattle(), 120);
    return () => clearTimeout(timer);
  }, [startBattle, tutorial?.bindings.ui.hideLobby]);

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => applyTutorialBattleSnapshot({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    hudLabels,
    phraseIntroLine,
    phraseIntroEmphasis: false,
    resultRankLine,
    timeLabel,
    timeLabelHidden: true,
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
    maxLoops: 1,
    demoLoopActive: false,
    enemyAttackGaugePercent: 0,
    attackGaugeHidden: true,
    chordHudHidden: true,
    chords: [],
    phraseSlotsHidden: true,
    phraseSlots: [],
    revealedNotes: [],
    currentNoteIndex: Math.min(completedTargetCount, Math.max(0, targets.length - 1)),
    slotKind: 'circle',
    chordCompleted: [],
    countInValue: 0,
    lastRank,
    showLobbyControls,
    canChangePracticeMode,
    startButtonLabel,
    lessonProgressText,
    fixedCharacterPositions: true,
    quizRulesLine: tutorial ? undefined : clearConditionLine,
    staffBand: EAR_TRAINING_OSMD_STAFF_BAND,
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
    canChangePracticeMode,
    clearConditionLine,
    completedTargetCount,
    enemyAvatar,
    enemyAvatarFlipX,
    enemyHp,
    enemyName,
    gameState,
    hudLabels,
    isMidiConnected,
    lastRank,
    lessonProgressText,
    phraseIndex,
    phraseIntroLine,
    phraseIntroSeq,
    phraseRunId,
    phrases.length,
    playerHp,
    practiceMode,
    resultRankLine,
    resultState,
    showLobbyControls,
    stage.enemy_hp,
    stage.player_hp,
    stage.title,
    stageStatusText,
    startButtonLabel,
    targets.length,
    timeLabel,
  ]);

  const practiceRunModeConfig = useMemo(
    () => (
      onPracticeModeRestartFromSettings
        ? {
            practiceMode,
            onApplyPracticeModeAndRestart: onPracticeModeRestartFromSettings,
          }
        : undefined
    ),
    [onPracticeModeRestartFromSettings, practiceMode],
  );

  const scoreScrollActive = scoreTimelineArmed
    && (gameState === 'countIn' || gameState === 'playingPhrase');

  const battleCallbacks = useMemo(() => ({
    onStart: startBattle,
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
    startBattle,
  ]);

  return (
    <div className={cn(
      'relative h-[100dvh] w-full overflow-hidden bg-slate-950 text-white',
      feedback === 'miss' && 'bg-red-950',
      feedback === 'clear' && 'bg-white text-slate-950',
    )}>
      <div className={cn('relative h-full w-full', showLobbyControls ? 'z-30' : 'z-0')}>
        <EarTrainingBattleRenderer
          ref={phaserGameRef}
          snapshot={battleSnapshot}
          effectCommand={null}
          callbacks={battleCallbacks}
          className="h-full w-full"
          disableCorrectSe
        />
      </div>

      {musicXmlText ? (
        <EarTrainingChordOSMDScore
          musicXmlText={musicXmlText}
          scoreErrorText={scoreErrorText}
          activeMeasureNumber={activeMeasureNumber}
          measureDurationSec={measureDurationSec}
          scrollActive={scoreScrollActive}
          renderKeyValue={phraseRunId}
          isEnglishCopy={isEnglishCopy}
          hidden={showLobbyControls}
          scoreZClassName={showLobbyControls ? 'z-0' : 'z-10'}
        />
      ) : null}

      <EarTrainingPianoOverlay
        ref={pianoOverlayRef}
        onPianoKeyDown={handlePianoKeyDown}
        onPianoKeyUp={handlePianoKeyUp}
      />

      <EarTrainingSettingsModal
        isOpen={isSettingsOpen}
        isEnglishCopy={isEnglishCopy}
        scope={tutorial ? 'tutorial' : 'battle'}
        onClose={() => setIsSettingsOpen(false)}
        onRestartFromBeginning={tutorial ? () => {
          setIsSettingsOpen(false);
          startBattle();
        } : undefined}
        midiDeviceId={settings.selectedMidiDevice}
        onMidiDeviceChange={handleMidiDeviceChange}
        isMidiConnected={isMidiConnected}
        practiceRunMode={tutorial ? undefined : practiceRunModeConfig}
        practiceTranspose={tutorial ? undefined : practiceTransposeConfig}
        practiceSpeed={tutorial ? undefined : practiceSpeedConfig}
        osmdTimingAdjustment={osmdTimingAdjustmentConfig}
      />
    </div>
  );
};

export default EarTrainingChordOSMDScreen;
