import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuestCompleteJingleOnStageClear, useGameOverJingleOnGameOver } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingBattleRenderer from './EarTrainingBattleRenderer';
import DeferredEarTrainingPianoOverlay, { type EarTrainingPianoOverlayHandle } from './DeferredEarTrainingPianoOverlay';
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
import { resolveOsuApproachCirclePhraseTiming } from '@/game/earTraining/canvas/earTrainingBattleOsuCircleTiming';
import { resolveOsuCircleColorIndex } from '@/game/earTraining/canvas/earTrainingBattleOsuCircleColors';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { collectMidisFromMusicXmlText, computeEarTrainingStageMidiMidis } from '@/utils/webKeyboardDisplayRange';
import { cn } from '@/utils/cn';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import {
  markAudioUserInteraction,
  playNote,
  stopNote,
  updateGlobalVolume,
} from '@/utils/MidiController';
import { toCdnProxyUrl } from '@/utils/cdnProxy';
import { preloadEarTrainingPianoOverlay } from '@/utils/preloadEarTrainingPianoOverlay';
import {
  getCachedEarTrainingMusicXml,
  prefetchEarTrainingLobbyAssetsFromStage,
  prefetchEarTrainingMusicXml,
  storeEarTrainingMusicXml,
} from '@/utils/prefetchEarTrainingLobbyAssets';
import {
  preloadBattleCountInClick,
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
import { buildEarTrainingTimingAdjustmentHash } from '@/utils/earTrainingTimingAdjustmentLaunch';
import { useNavigateAppHash } from '@/hooks/useNavigateAppHash';
import {
  buildEarTrainingEnemyBattleSourceKey,
  EAR_TRAINING_PLAYER_AVATAR_URL,
  resolveEarTrainingEnemyAvatarFromBattleSourceKey,
} from '@/utils/earTrainingBattleAvatar';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import {
  EarTrainingChordVoicingPhrasePlayer,
} from '@/utils/earTrainingChordVoicingPhrasePlayer';
import {
  CHORD_VOICING_SELF_PACED_DRUM_LOOP_URL,
  EarTrainingChordVoicingDrumLoop,
} from '@/utils/earTrainingChordVoicingDrumLoop';
import {
  computeChordOsmdCalibratedPhraseLoopEndSec,
  shouldFinishOsmdPhraseOnAudioEnded,
  shouldStartTutorialOsmdDrumLoop,
} from '@/utils/earTrainingChordOsmdTimeline';
import {
  CHORD_OSMD_HAMMER_LEAD_MEASURES_DEFAULT,
  resolveChordOsmdParrySpanState,
  type ChordOsmdParrySpanAnchor,
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  chordOsmdApproachLeadSec,
  chordOsmdHammerLeadSec,
  CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC,
  hasChordOsmdJudgmentWindowExpired,
  VOICE_JUDGMENT_ARRIVAL_GRACE_SEC,
  pickNearestChordOsmdTargetIndex,
  normalizeChordOsmdMusicXml,
  type ChordOsmdRhythmTarget,
} from '@/utils/earTrainingChordOsmd';
import {
  adlibCallResponseHitRatio,
  adlibCallResponseRankForAccuracy,
  buildAdlibCallResponseChordSlots,
  buildAdlibCallResponseHintGroups,
  buildAdlibCallResponseTargets,
  collectAdlibCallResponseAttacks,
  getAdlibCallResponseTargetCount,
  matchesAdlibCallResponseTarget,
  resolveAdlibCallResponseActiveChordSlotIndex,
  resolveAdlibCallResponseActiveHintGuideMidis,
  type AdlibCallResponseChordSlot,
  type AdlibCallResponseHintGroup,
  type AdlibCallResponseTarget,
} from '@/utils/earTrainingAdlibCallResponse';
import {
  applyPracticeTransposeToMusicXml,
  clampPracticeTransposeOffset,
  fifthsToPreferredKeyName,
  readKeyFifthsFromMusicXml,
} from '@/utils/earTrainingPracticeTranspose';
import { ensureMusicXmlDeclaration } from '@/utils/musicXmlMapper';
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
import { resolveEarTrainingInputPhraseTimeSec } from '@/utils/earTrainingInputTimingTelemetry';
import { applyTutorialBattleSnapshot } from '@/components/earTraining/tutorial/applyTutorialBattleSnapshot';
import {
  clampTutorialPlayerHp,
  isEarTrainingTutorialNoCombat,
  shouldTutorialBlockGameOver,
} from '@/components/earTraining/tutorial/earTrainingTutorialBindings';
import type { EarTrainingTutorialOsmdSceneResult } from '@/components/earTraining/tutorial/earTrainingTutorialScriptTypes';
import type { EarTrainingTutorialAdlibCallResponseConfig } from '@/components/earTraining/tutorial/earTrainingTutorialSceneConfig';
import {
  scheduleOsmdTimedLinesForLoop,
  type DialogueScheduleHandle,
} from '@/components/earTraining/tutorial/scheduleTimedDialogueLines';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingAdlibCallResponseScreenProps {
  stage: EarTrainingStage;
  enemy: EarTrainingBattleEnemy | null;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
  tutorial?: EarTrainingTutorialAdlibCallResponseConfig & {
    drumLoopUrl?: string;
    onSceneComplete: (result?: EarTrainingTutorialOsmdSceneResult) => void;
  };
}

interface RuntimeTargetState {
  completed: boolean;
  failed: boolean;
  hammerEffectId?: number;
  osuCircleEffectId?: number;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
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

const findFirstIncompleteAdlibTarget = (
  targets: readonly AdlibCallResponseTarget[],
  isIncomplete: (targetId: string) => boolean,
): AdlibCallResponseTarget | null => {
  for (const target of targets) {
    if (isIncomplete(target.id)) {
      return target;
    }
  }
  return null;
};

/** resolveChordOsmdParrySpanState は id/measureNumber/targetTimeSec/orderIndex のみ参照するため、最小シムで再利用する。 */
const toAdlibParrySpanShim = (target: AdlibCallResponseTarget): ChordOsmdRhythmTarget => ({
  id: target.id,
  label: '',
  orderIndex: target.orderIndex,
  targetTimeSec: target.targetTimeSec,
  measureNumber: target.measureNumber,
  midiCounts: [],
});

const resolveAdlibParrySpanState = (
  targets: readonly AdlibCallResponseTarget[],
  target: AdlibCallResponseTarget,
  chainAnchor: ChordOsmdParrySpanAnchor | null,
  spanMeasures: number,
  bpm: number,
  beatsPerMeasure: number,
  isSwing: boolean,
) => resolveChordOsmdParrySpanState(
  targets.map(toAdlibParrySpanShim),
  toAdlibParrySpanShim(target),
  chainAnchor,
  spanMeasures,
  bpm,
  beatsPerMeasure,
  isSwing,
);

const EarTrainingAdlibCallResponseScreen: React.FC<EarTrainingAdlibCallResponseScreenProps> = ({
  stage,
  enemy,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
  onPracticeModeRestartFromSettings,
  tutorial,
}) => {
  const navigateAppHash = useNavigateAppHash();
  const tutorialUi = tutorial?.bindings.ui;
  const tutorialNoCombat = isEarTrainingTutorialNoCombat(tutorialUi);
  const tutorialOsmdLoopRef = useRef(0);
  const tutorialDialogueHandleRef = useRef<DialogueScheduleHandle | null>(null);
  const tutorialDrumLoopRef = useRef<EarTrainingChordVoicingDrumLoop | null>(null);
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
  const activeDamageConfig = useMemo(() => {
    if (practiceMode) {
      return NO_DAMAGE_CONFIG;
    }
    if (tutorialNoCombat) {
      return {
        ...damageConfig,
        miss: 0,
        fail: 0,
      };
    }
    return damageConfig;
  }, [damageConfig, practiceMode, tutorialNoCombat]);

  const [statusText, setStatusText] = useState(
    () => getEarTrainingRhythmBattleStartCopy(isEnglishCopy, false),
  );
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  useEffect(() => {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark('ear-training:osmd-screen-mounted');
    }
    preloadEarTrainingPianoOverlay();
  }, []);

  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [musicXmlText, setMusicXmlText] = useState<string | null>(null);
  const [baseMusicXmlText, setBaseMusicXmlText] = useState<string | null>(null);
  const [practiceTransposeOffset, setPracticeTransposeOffset] = useState(0);
  const [practiceSpeedPercent, setPracticeSpeedPercent] = useState(100);
  const [timingAdjustmentMs, setTimingAdjustmentMs] = useState(
    () => loadEarTrainingOsmdTimingAdjustmentMs(),
  );
  const adlibXmlAttacks = useMemo(
    () => (musicXmlText ? collectAdlibCallResponseAttacks(musicXmlText) : null),
    [musicXmlText],
  );
  const chordSlots = useMemo(
    () => (musicXmlText
      ? buildAdlibCallResponseChordSlots(musicXmlText, {
        bpm: stage.bpm,
        beatsPerMeasure: stage.beats_per_measure,
        isSwing: stage.is_swing === true,
      })
      : []),
    [musicXmlText, stage.bpm, stage.beats_per_measure, stage.is_swing],
  );
  const [targets, setTargets] = useState<AdlibCallResponseTarget[]>([]);
  const [completedTargetCount, setCompletedTargetCount] = useState(0);
  const [activeChordSlotIndex, setActiveChordSlotIndex] = useState(0);
  const [lastRank, setLastRank] = useState<EarTrainingRank | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'miss' | 'clear' | null>(null);
  const [progressSaved, setProgressSaved] = useState(false);

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const phaserGameRef = useRef<EarTrainingBattleSceneHandle | null>(null);
  const pianoOverlayRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const handleNoteInputRef = useRef<(note: number, domTimeStampMs?: number) => void>(() => undefined);
  const battlePianoAudioPromiseRef = useRef<Promise<void> | null>(null);
  const startPhraseRef = useRef<(nextPhraseIndex: number) => void>(() => undefined);
  const gameStateRef = useRef<EarTrainingGameState>('idle');
  const phraseIndexRef = useRef(0);
  const phraseRunIdRef = useRef(0);
  const enemyHpRef = useRef(stage.enemy_hp);
  const playerHpRef = useRef(stage.player_hp);
  const targetsRef = useRef<AdlibCallResponseTarget[]>([]);
  const hintGroupsRef = useRef<AdlibCallResponseHintGroup[]>([]);
  const runtimeByTargetIdRef = useRef<Map<string, RuntimeTargetState>>(new Map());
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastStatusUpdateAtRef = useRef(0);
  const lastInputAtByNoteRef = useRef<Map<number, number>>(new Map());
  const battleEffectIdRef = useRef(0);
  const parryChainAnchorRef = useRef<ChordOsmdParrySpanAnchor | null>(null);
  const progressSaveStartedRef = useRef(false);
  const phraseEndingRef = useRef(false);
  const totalCompletedTargetsRef = useRef(0);
  const totalJudgedTargetsRef = useRef(0);
  const lastRankRef = useRef<EarTrainingRank | null>(null);
  const phraseLoopDurationSecRef = useRef(0);
  const phraseLoopEndSecRef = useRef(0);
  const nextHammerTargetIndexRef = useRef(0);
  const nextApproachTargetIndexRef = useRef(0);
  const nextMissTargetIndexRef = useRef(0);
  const chordSlotsRef = useRef<readonly AdlibCallResponseChordSlot[]>([]);
  const activeChordSlotIndexRef = useRef(0);
  const finishCurrentPhraseRef = useRef<(runId: number) => void>(() => undefined);
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
  useEffect(() => { chordSlotsRef.current = chordSlots; }, [chordSlots]);

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

  const resolveHammerLeadMeasures = useCallback(
    (): number => Math.max(1, stage.hammer_lead_measures ?? CHORD_OSMD_HAMMER_LEAD_MEASURES_DEFAULT),
    [stage.hammer_lead_measures],
  );

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

  const syncPracticeVoicingHints = useCallback(() => {
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
    const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
    const hammerLeadSec = chordOsmdHammerLeadSec(
      resolveEffectivePracticeBpm(),
      stage.beats_per_measure,
      resolveHammerLeadMeasures(),
    );
    const guideMidis = resolveAdlibCallResponseActiveHintGuideMidis(
      targetsRef.current,
      hintGroupsRef.current,
      {
        phraseTimeSec: phraseT,
        hammerLeadSec,
        lateWindowSec: lateW,
        resolveJudgedTargetTimeSec: resolveCalibratedTargetTimeSec,
        isLastTargetSettled: (targetId) => {
          const state = runtimeByTargetIdRef.current.get(targetId);
          return Boolean(state && (state.completed || state.failed));
        },
      },
    );
    if (!guideMidis || guideMidis.length === 0) {
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    // 音群区間中は一定強度で点灯（射出〜末尾窓終了まで）
    pianoOverlayRef.current?.setVoicingHintsByIntensity([...guideMidis], [], [], []);
  }, [
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
    resolveEffectiveTimingWindowSec,
    resolveHammerLeadMeasures,
    stage.beats_per_measure,
  ]);

  const stopPhraseAudio = useCallback(() => {
    phrasePlayerRef.current?.stop();
    tutorialDrumLoopRef.current?.stop();
  }, []);

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
      approachStartPhraseSec?: number;
      judgedPhraseSec?: number;
      parryFinishOnly?: boolean;
      hitPhraseTimeSec?: number;
      effectiveBpm?: number;
      isSwing?: boolean;
      nextTargetPhraseTimeSec?: number;
      extendParryVisualSlow?: boolean;
      clearParryVisualSlow?: boolean;
      visualSlowSustainMs?: number;
      justParryEffectDurationMs?: number;
      osuCircleLayoutIndex?: number;
      osuCircleNoteLabels?: readonly string[];
      osuCircleColorIndex?: number;
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
      approachStartPhraseSec: options.approachStartPhraseSec,
      judgedPhraseSec: options.judgedPhraseSec,
      parryFinishOnly: options.parryFinishOnly,
      hitPhraseTimeSec: options.hitPhraseTimeSec,
      effectiveBpm: options.effectiveBpm,
      isSwing: options.isSwing,
      nextTargetPhraseTimeSec: options.nextTargetPhraseTimeSec,
      extendParryVisualSlow: options.extendParryVisualSlow,
      clearParryVisualSlow: options.clearParryVisualSlow,
      visualSlowSustainMs: options.visualSlowSustainMs,
      justParryEffectDurationMs: options.justParryEffectDurationMs,
      osuCircleLayoutIndex: options.osuCircleLayoutIndex,
      osuCircleNoteLabels: options.osuCircleNoteLabels,
      osuCircleColorIndex: options.osuCircleColorIndex,
    };
    phaserGameRef.current?.triggerEffect(command);
    return effectId;
  }, []);

  const clearParryVisualSlow = useCallback(() => {
    triggerBattleEffect('clearParryVisualSlow');
  }, [triggerBattleEffect]);

  const dismissOsuCircleForState = useCallback((state: RuntimeTargetState) => {
    if (state.osuCircleEffectId === undefined) {
      return;
    }
    triggerBattleEffect('osmdApproachCircleDismiss', {
      relatedEffectId: state.osuCircleEffectId,
    });
    state.osuCircleEffectId = undefined;
  }, [triggerBattleEffect]);

  const failTargetIfNeeded = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed) {
      return;
    }
    dismissOsuCircleForState(state);
    if (state.failed) {
      return;
    }
    state.failed = true;
    parryChainAnchorRef.current = null;
    clearParryVisualSlow();
    syncPracticeVoicingHints();
    triggerFeedback('miss');
    setStatusText(isEnglishCopy ? 'Miss' : 'ミス');
  }, [clearParryVisualSlow, dismissOsuCircleForState, isEnglishCopy, syncPracticeVoicingHints, triggerFeedback]);

  const syncActiveOsuApproachCircleTimings = useCallback(() => {
    const approachLeadSec = chordOsmdApproachLeadSec(resolveEffectivePracticeBpm());
    const updates: {
      commandId: number;
      approachStartPhraseSec: number;
      judgedPhraseSec: number;
    }[] = [];
    targetsRef.current.forEach(target => {
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed || state.osuCircleEffectId === undefined) {
        return;
      }
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      const timing = resolveOsuApproachCirclePhraseTiming(judged, approachLeadSec);
      updates.push({
        commandId: state.osuCircleEffectId,
        approachStartPhraseSec: timing.approachStartPhraseSec,
        judgedPhraseSec: timing.judgedPhraseSec,
      });
    });
    if (updates.length > 0) {
      phaserGameRef.current?.resyncOsuApproachCircles(updates);
    }
  }, [resolveCalibratedTargetTimeSec, resolveEffectivePracticeBpm]);

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
        return null;
      }
      const normalizedText = ensureMusicXmlDeclaration(normalizeChordOsmdMusicXml(text));
      storeEarTrainingMusicXml(rawUrl, normalizedText);
      setBaseMusicXmlText(normalizedText);
      const displayXml = resolveDisplayXml(normalizedText);
      setMusicXmlText(displayXml);
      return displayXml;
    } catch {
      if (phraseRunIdRef.current === runId) {
        setMusicXmlText(null);
        setBaseMusicXmlText(null);
      }
      return null;
    }
  }, [practiceTransposeEnabled]);

  useEffect(() => {
    if (gameState !== 'idle' || phrases.length === 0) {
      return undefined;
    }
    const runId = phraseRunIdRef.current;
    void loadMusicXml(phrases[0], runId);
    return undefined;
  }, [gameState, loadMusicXml, phrases]);

  useEffect(() => {
    const firstPhrase = phrases[0];
    if (gameState === 'idle' && firstPhrase) {
      const initialTargets = adlibXmlAttacks
        ? buildAdlibCallResponseTargets(adlibXmlAttacks, {
            bpm: stage.bpm,
            beatsPerMeasure: stage.beats_per_measure,
            isSwing: stage.is_swing === true,
          })
        : [];
      targetsRef.current = initialTargets;
      hintGroupsRef.current = buildAdlibCallResponseHintGroups(initialTargets);
      setTargets(initialTargets);
      setCompletedTargetCount(0);
    }
  }, [adlibXmlAttacks, gameState, phrases, stage.beats_per_measure, stage.bpm, stage.is_swing]);

  const resetPhraseTimelineIndices = useCallback(() => {
    nextHammerTargetIndexRef.current = 0;
    nextApproachTargetIndexRef.current = 0;
    nextMissTargetIndexRef.current = 0;
    parryChainAnchorRef.current = null;
  }, []);

  const resetPhraseRuntime = useCallback((nextTargets: readonly AdlibCallResponseTarget[]) => {
    const runtime = new Map<string, RuntimeTargetState>();
    nextTargets.forEach(target => {
      runtime.set(target.id, {
        completed: false,
        failed: false,
      });
    });
    targetsRef.current = [...nextTargets];
    hintGroupsRef.current = buildAdlibCallResponseHintGroups(nextTargets);
    runtimeByTargetIdRef.current = runtime;
    resetPhraseTimelineIndices();
    activeChordSlotIndexRef.current = 0;
    setActiveChordSlotIndex(0);
    pianoOverlayRef.current?.clearVoicingHints();
    setTargets([...nextTargets]);
    setCompletedTargetCount(0);
  }, [resetPhraseTimelineIndices]);

  const handleHammerImpact = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed) {
      return;
    }
    dismissOsuCircleForState(state);
    if (!state.failed) {
      state.failed = true;
    }
    parryChainAnchorRef.current = null;
    clearParryVisualSlow();
    if (!tutorialNoCombat) {
      applyPlayerDamage(activeDamageConfig.miss);
    }
  }, [activeDamageConfig.miss, applyPlayerDamage, clearParryVisualSlow, dismissOsuCircleForState, tutorialNoCombat]);

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
    clearParryVisualSlow();

    let completed = 0;
    runtimeByTargetIdRef.current.forEach(state => {
      if (state.completed) {
        completed += 1;
      } else {
        if (!state.failed) {
          state.failed = true;
        }
        dismissOsuCircleForState(state);
      }
    });
    pianoOverlayRef.current?.clearVoicingHints();
    publishTargetStates();

    const phraseTargets = targetsRef.current;
    const accuracy = adlibCallResponseHitRatio(phraseTargets, completed);
    totalCompletedTargetsRef.current += completed;
    totalJudgedTargetsRef.current += getAdlibCallResponseTargetCount(phraseTargets);
    const rank = adlibCallResponseRankForAccuracy(accuracy);
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
          tutorial.onSceneComplete({
            noteHitPercent: Math.round(accuracy * 100),
          });
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
          phraseNoteCount: getAdlibCallResponseTargetCount(phraseTargets),
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
    clearParryVisualSlow,
    stopPhraseAudio,
    triggerBattleEffect,
    dismissOsuCircleForState,
    tutorial,
  ]);

  const throwDueHammers = useCallback((phraseTimeSec: number) => {
    const hammerLeadSec = chordOsmdHammerLeadSec(
      resolveEffectivePracticeBpm(),
      stage.beats_per_measure,
      resolveHammerLeadMeasures(),
    );
    const phraseTargets = targetsRef.current;
    while (nextHammerTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextHammerTargetIndexRef.current];
      const throwTime = resolveCalibratedTargetTimeSec(target.targetTimeSec) - hammerLeadSec;
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
  }, [handleHammerImpact, registerBattleEffectImpact, resolveCalibratedTargetTimeSec, resolveEffectivePracticeBpm, resolveHammerLeadMeasures, stage.beats_per_measure, triggerBattleEffect]);

  const spawnDueApproachCircles = useCallback((phraseTimeSec: number) => {
    const approachLeadSec = chordOsmdApproachLeadSec(resolveEffectivePracticeBpm());
    const phraseTargets = targetsRef.current;
    while (nextApproachTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextApproachTargetIndexRef.current];
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      const spawnTime = judged - approachLeadSec;
      if (phraseTimeSec + 1e-9 < spawnTime) {
        break;
      }
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        nextApproachTargetIndexRef.current += 1;
        continue;
      }
      const timing = resolveOsuApproachCirclePhraseTiming(judged, approachLeadSec);
      const effectId = triggerBattleEffect('osmdApproachCircle', {
        approachStartPhraseSec: timing.approachStartPhraseSec,
        judgedPhraseSec: timing.judgedPhraseSec,
        osuCircleLayoutIndex: nextApproachTargetIndexRef.current,
        osuCircleNoteLabels: [],
        osuCircleColorIndex: resolveOsuCircleColorIndex(
          target.measureNumber,
          stage.loop_measures,
        ),
      });
      state.osuCircleEffectId = effectId;
      nextApproachTargetIndexRef.current += 1;
    }
  }, [resolveCalibratedTargetTimeSec, resolveEffectivePracticeBpm, stage.loop_measures, triggerBattleEffect]);

  const failExpiredTargets = useCallback((phraseTimeSec: number) => {
    const phraseTargets = targetsRef.current;
    const arrivalGraceSec = settings.inputMethod === 'voice' ? VOICE_JUDGMENT_ARRIVAL_GRACE_SEC : 0;
    while (nextMissTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextMissTargetIndexRef.current];
      const judged = resolveCalibratedTargetTimeSec(target.targetTimeSec);
      const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
      if (!hasChordOsmdJudgmentWindowExpired(phraseTimeSec, judged, lateW, arrivalGraceSec)) {
        break;
      }
      failTargetIfNeeded(target.id);
      nextMissTargetIndexRef.current += 1;
    }
  }, [failTargetIfNeeded, resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec, settings.inputMethod]);

  const syncActiveChordSlotIndex = useCallback((phraseTimeSec: number) => {
    const slots = chordSlotsRef.current;
    if (slots.length === 0) {
      return;
    }
    const activeIdx = resolveAdlibCallResponseActiveChordSlotIndex(
      slots,
      phraseTimeSec,
      activeChordSlotIndexRef.current,
      resolveEffectiveTargetTimeSec,
    );
    if (activeIdx !== activeChordSlotIndexRef.current) {
      activeChordSlotIndexRef.current = activeIdx;
      setActiveChordSlotIndex(activeIdx);
    }
  }, [resolveEffectiveTargetTimeSec]);

  const handlePhraseTimelineTick = useCallback(() => {
    if (phraseEndingRef.current) {
      return;
    }
    const state = gameStateRef.current;
    if (state !== 'countIn' && state !== 'playingPhrase') {
      return;
    }

    const phraseTimeSec = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseTimeSec == null || !Number.isFinite(phraseTimeSec)) {
      return;
    }

    throwDueHammers(phraseTimeSec);
    spawnDueApproachCircles(phraseTimeSec);
    failExpiredTargets(phraseTimeSec);
    syncPracticeVoicingHints();
    syncActiveChordSlotIndex(phraseTimeSec);

    if (state !== 'playingPhrase') {
      return;
    }
    if (phraseTimeSec >= phraseLoopEndSecRef.current) {
      finishCurrentPhraseRef.current(phraseRunIdRef.current);
    }
  }, [
    failExpiredTargets,
    syncActiveChordSlotIndex,
    syncPracticeVoicingHints,
    spawnDueApproachCircles,
    throwDueHammers,
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
    setStatusText(copy.countIn);
    gameStateRef.current = 'countIn';
    setGameState('countIn');

    resetPhraseRuntime([]);

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

      const attacks = xmlText ? collectAdlibCallResponseAttacks(xmlText) : [];
      const phraseTargets = buildAdlibCallResponseTargets(attacks, {
        bpm: stage.bpm,
        beatsPerMeasure: stage.beats_per_measure,
        isSwing: stage.is_swing === true,
      });
      if (phraseTargets.length === 0) {
        finishGameOver(isEnglishCopy ? 'No chord timings are registered.' : '判定用コードタイミングが登録されていません');
        return;
      }

      resetPhraseRuntime(phraseTargets);

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

      const loopDurationSec = Number(phrase.loop_duration_sec);
      const measureDurationSec = (60 / Math.max(1, stage.bpm)) * Math.max(1, stage.beats_per_measure);
      const safeLoopDurationSec = Number.isFinite(loopDurationSec) && loopDurationSec > 0
        ? loopDurationSec
        : measureDurationSec * Math.max(1, stage.loop_measures);
      phraseLoopDurationSecRef.current = practiceModeRef.current
        ? scalePracticePhraseLoopEndSec(safeLoopDurationSec, practiceSpeedPercentRef.current)
        : safeLoopDurationSec;
      phraseLoopEndSecRef.current = scalePracticePhraseLoopEndSec(
        computeChordOsmdCalibratedPhraseLoopEndSec(
          safeLoopDurationSec,
          phraseTargets,
          timingAdjustmentMsRef.current,
        ),
        practiceModeRef.current ? practiceSpeedPercentRef.current : 100,
      );
      if (tutorial) {
        tutorialDialogueHandleRef.current?.cancel();
        tutorialDialogueHandleRef.current = scheduleOsmdTimedLinesForLoop({
          bpm: resolveEffectivePracticeBpm(),
          beatsPerMeasure: stage.beats_per_measure,
          countInBeats: stage.count_in_beats,
          loopMeasures: stage.loop_measures,
          phraseLoopDurationSec: safeLoopDurationSec,
          timedLines: tutorial.scene.timedLines ?? [],
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
        const phraseTimeSec = phrasePlayerRef.current?.getPhraseTimelineSec() ?? null;
        if (shouldFinishOsmdPhraseOnAudioEnded(phraseTimeSec, phraseLoopEndSecRef.current)) {
          finishCurrentPhrase(runId);
        }
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
    finishCurrentPhrase,
    finishGameOver,
    isEnglishCopy,
    loadMusicXml,
    phrases,
    practiceTransposeEnabled,
    resetPhraseRuntime,
    settings.masterVolume,
    settings.musicVolume,
    resolveEffectivePracticeBpm,
    resolveEffectiveTimingWindowSec,
    stage.beats_per_measure,
    stage.bpm,
    stage.count_in_beats,
    stage.is_swing,
    stage.loop_measures,
    practiceSpeedPercent,
    stopPhraseAudio,
    tutorial,
    tutorialOsmdDrumLoopPrepareUrl,
  ]);

  useEffect(() => {
    finishCurrentPhraseRef.current = finishCurrentPhrase;
  }, [finishCurrentPhrase]);

  useEffect(() => {
    startPhraseRef.current = startPhrase;
  }, [startPhrase]);

  const ensureBattlePianoAudioLazy = useCallback((): void => {
    if (battlePianoAudioPromiseRef.current) {
      return;
    }
    battlePianoAudioPromiseRef.current = import('@/utils/ensureBattlePianoAudio')
      .then(({ ensureBattlePianoAudio }) =>
        ensureBattlePianoAudio({
          midiVolume: settings.midiVolume,
          soundEffectVolume: settings.soundEffectVolume,
          rootSoundVolume: settings.rootSoundVolume,
        }),
      )
      .catch(() => undefined);
  }, [
    settings.midiVolume,
    settings.rootSoundVolume,
    settings.soundEffectVolume,
  ]);

  const handleMidiNoteOn = useCallback((note: number, domTimeStampMs?: number) => {
    ensureBattlePianoAudioLazy();
    handleNoteInputRef.current(note, domTimeStampMs);
  }, [ensureBattlePianoAudioLazy]);

  const ensureBattleAudioReady = useCallback(async (): Promise<void> => {
    ensureBattlePianoAudioLazy();
    if (battlePianoAudioPromiseRef.current) {
      await battlePianoAudioPromiseRef.current;
    }
  }, [ensureBattlePianoAudioLazy]);

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
  const stageMidiMidis = useMemo(() => {
    const midis = computeEarTrainingStageMidiMidis(stage);
    if (!baseMusicXmlText) {
      return midis;
    }
    return [...midis, ...collectMidisFromMusicXmlText(baseMusicXmlText)];
  }, [baseMusicXmlText, stage]);
  const keyboardRange = useResolvedWebKeyboardRange(stageMidiMidis);
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
    syncActiveOsuApproachCircleTimings();
  }, [syncActiveOsuApproachCircleTimings]);

  const handleLaunchTimingAdjustment = useCallback(() => {
    const tutorialReturn = tutorial?.timingReturnContext;
    const hash = buildEarTrainingTimingAdjustmentHash({
      entry: 'settings',
      returnContext: tutorialReturn
        ? {
            tutorialScriptId: tutorialReturn.scriptId,
            tutorialSceneIndex: tutorialReturn.sceneIndex,
            lessonId: tutorialReturn.lessonId,
            lessonSongId: tutorialReturn.lessonSongId,
            clearConditions: tutorialReturn.clearConditions,
          }
        : {
            stageId: stage.id,
            lessonId: lessonContext?.lessonId,
            lessonSongId: lessonContext?.lessonSongId,
            practiceMode,
            clearConditions: lessonContext
              ? JSON.stringify(lessonContext.clearConditions)
              : undefined,
          },
    });
    navigateAppHash(hash);
  }, [lessonContext, navigateAppHash, practiceMode, stage.id, tutorial?.timingReturnContext]);

  const osmdTimingAdjustmentConfig = useMemo(
    () => ({
      appliedOffsetMs: timingAdjustmentMs,
      onChange: handleTimingAdjustmentChange,
    }),
    [handleTimingAdjustmentChange, timingAdjustmentMs],
  );

  const completeTarget = useCallback((
    target: AdlibCallResponseTarget,
    state: RuntimeTargetState,
    hitPhraseTimeSec: number,
  ) => {
    state.completed = true;
    syncPracticeVoicingHints();
    if (state.hammerEffectId !== undefined) {
      pendingImpactHandlersRef.current.delete(state.hammerEffectId);
    }
    const statusNow = performance.now();
    if (statusNow - lastStatusUpdateAtRef.current >= STATUS_TEXT_THROTTLE_MS) {
      lastStatusUpdateAtRef.current = statusNow;
      setStatusText(copy.chordCompleted(`M${target.measureNumber}`));
    }
    const damage = activeDamageConfig.perCorrectNote;
    if (state.osuCircleEffectId !== undefined) {
      triggerBattleEffect('osmdApproachCircleBurst', {
        relatedEffectId: state.osuCircleEffectId,
      });
      state.osuCircleEffectId = undefined;
    }
    for (const midi of target.guideMidis) {
      phaserGameRef.current?.highlightKey(midi, true);
      scheduleTimer(() => {
        phaserGameRef.current?.highlightKey(midi, false);
      }, 180);
    }
    const nextTarget = findFirstIncompleteAdlibTarget(
      targetsRef.current,
      isTargetIncomplete,
    );
    const leadMeasures = resolveHammerLeadMeasures();
    const spanState = resolveAdlibParrySpanState(
      targetsRef.current,
      target,
      parryChainAnchorRef.current,
      leadMeasures,
      resolveEffectivePracticeBpm(),
      stage.beats_per_measure,
      stage.is_swing === true,
    );
    parryChainAnchorRef.current = spanState.anchor;
    const { isFinish } = spanState;
    let justParryEffectDurationMs: number | undefined;
    if (isFinish) {
      const bpm = resolveEffectivePracticeBpm();
      justParryEffectDurationMs = Math.max(1, Math.round(60_000 / Math.max(1, bpm)));
    }
    const effectId = triggerBattleEffect('osmdHammerReflect', {
      label: `M${target.measureNumber}`,
      damage,
      relatedEffectId: state.hammerEffectId,
      parryFinishOnly: isFinish,
      clearParryVisualSlow: false,
      justParryEffectDurationMs,
      hitPhraseTimeSec,
      effectiveBpm: resolveEffectivePracticeBpm(),
      isSwing: stage.is_swing === true,
      nextTargetPhraseTimeSec: nextTarget
        ? resolveCalibratedTargetTimeSec(nextTarget.targetTimeSec)
        : undefined,
    });
    if (isFinish) {
      parryChainAnchorRef.current = null;
    }
    registerBattleEffectImpact(effectId, () => {
      applyEnemyDamage(damage, lastRankRef.current);
    });
  }, [
    activeDamageConfig.perCorrectNote,
    applyEnemyDamage,
    copy,
    isTargetIncomplete,
    registerBattleEffectImpact,
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
    resolveHammerLeadMeasures,
    scheduleTimer,
    stage.beats_per_measure,
    stage.is_swing,
    syncPracticeVoicingHints,
    triggerBattleEffect,
  ]);

  const handleNoteInput = useCallback((note: number, domTimeStampMs?: number) => {
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

    const phraseT = resolveEarTrainingInputPhraseTimeSec(phrasePlayerRef.current, domTimeStampMs);
    if (phraseT == null || !Number.isFinite(phraseT)) {
      return;
    }
    const earlyW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_EARLY_SEC);
    const lateW = resolveEffectiveTimingWindowSec(CHORD_OSMD_JUDGMENT_WINDOW_LATE_SEC);
    const phraseTargets = targetsRef.current;
    const matchedIndex = pickNearestChordOsmdTargetIndex(
      phraseTargets.length,
      phraseT,
      (index) => resolveCalibratedTargetTimeSec(phraseTargets[index].targetTimeSec),
      (index) => {
        const target = phraseTargets[index];
        const state = runtimeByTargetIdRef.current.get(target.id);
        if (!state || state.completed || state.failed) {
          return false;
        }
        return matchesAdlibCallResponseTarget(target, midiNote);
      },
      earlyW,
      lateW,
    );
    if (matchedIndex === null) {
      return;
    }
    const target = phraseTargets[matchedIndex];
    const state = runtimeByTargetIdRef.current.get(target.id);
    if (!state) {
      return;
    }
    completeTarget(target, state, phraseT);
  }, [completeTarget, resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  const { isConnected: isStandaloneInputConnected } = useStandaloneNoteInput({
    onNoteOn: (note, domTimeStampMs) => handleMidiNoteOn(note, domTimeStampMs),
    onKeyHighlight: (note, active) => pianoOverlayRef.current?.highlightKey(note, active),
  });

  useEffect(() => {
    setIsMidiConnected(isStandaloneInputConnected);
  }, [isStandaloneInputConnected]);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
  }, [updateSettings]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    ensureBattlePianoAudioLazy();
    void playNote(midiNote, 100);
    handleNoteInputRef.current(midiNote);
  }, [ensureBattlePianoAudioLazy]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  useEffect(() => {
    return () => {
      tutorialDrumLoopRef.current?.stop();
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

  const battleChords = useMemo(
    () => chordSlots.map((slot, index) => ({
      id: slot.id,
      name: slot.name,
      active: index === activeChordSlotIndex,
    })),
    [activeChordSlotIndex, chordSlots],
  );

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
    chordHudHidden: chordSlots.length === 0,
    chords: battleChords,
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
    battleChords,
    canChangePracticeMode,
    chordSlots.length,
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
    tutorial,
    tutorialUi,
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

  const getPhraseTimelineSec = useCallback(
    () => phrasePlayerRef.current?.getPhraseTimelineSec() ?? null,
    [],
  );

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
          battleMode="chord_osmd"
          getPhraseTimelineSec={getPhraseTimelineSec}
        />
      </div>

      <DeferredEarTrainingPianoOverlay
        ref={pianoOverlayRef}
        minMidi={keyboardRange.minMidi}
        maxMidi={keyboardRange.maxMidi}
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
        onLaunchTimingAdjustment={handleLaunchTimingAdjustment}
      />
    </div>
  );
};

export default EarTrainingAdlibCallResponseScreen;
