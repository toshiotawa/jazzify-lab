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
import type { SurvivalCharacterRow } from '@/platform/supabaseSurvival';
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
import { ensureBattlePianoAudio } from '@/utils/ensureBattlePianoAudio';
import {
  getCompletionDamage,
  getNextPhraseIndex,
  mapEarTrainingRankToLessonRank,
} from '@/utils/earTrainingEngine';
import {
  getEarTrainingBattleHudLabels,
  getEarTrainingGameCopy,
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
} from '@/utils/earTrainingChordVoicingDrumLoop';
import {
  computeChordOsmdActiveMeasureNumber,
  computeChordOsmdPhraseLoopEndSec,
  shouldStartTutorialOsmdDrumLoop,
} from '@/utils/earTrainingChordOsmdTimeline';
import { toCdnProxyUrl } from '@/utils/cdnProxy';
import {
  buildChordOsmdRhythmTargets,
  collectChordOsmdMusicXmlAttacks,
  collectChordOsmdMusicXmlLyrics,
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  CHORD_OSMD_HAMMER_LEAD_SEC,
  CHORD_OSMD_JUDGMENT_OFFSET_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_SEC,
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
  enemy: SurvivalCharacterRow | null;
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
/** OSMD 正解報酬: |Δ|≤100ms で追加パリィリング */
const CHORD_OSMD_PRECISE_WINDOW_SEC = 0.1;
const BATTLE_EFFECT_CLEAR_MS = 900;
const NO_DAMAGE_CONFIG = {
  perCorrectNote: 0,
  good: 0,
  great: 0,
  perfect: 0,
  miss: 0,
  fail: 0,
};

const musicXmlCache = new Map<string, string>();

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
  const activeDamageConfig = useMemo(
    () => (practiceMode || tutorialNoCombat ? NO_DAMAGE_CONFIG : damageConfig),
    [damageConfig, practiceMode, tutorialNoCombat],
  );

  const [statusText, setStatusText] = useState(
    isEnglishCopy ? 'Press START to begin OSMD rhythm battle.' : 'STARTでOSMDリズムバトルを開始します',
  );
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');

  useQuestCompleteJingleOnStageClear(gameState);
  useGameOverJingleOnGameOver(gameState);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [activeMeasureNumber, setActiveMeasureNumber] = useState(1);
  const [musicXmlText, setMusicXmlText] = useState<string | null>(null);
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
  const [battleEffectCommand, setBattleEffectCommand] = useState<EarTrainingBattleEffectCommand | null>(null);
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
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
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

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { phraseIndexRef.current = phraseIndex; }, [phraseIndex]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);
  useEffect(() => { showKeyboardHintsInBattleRef.current = showKeyboardHintsInBattle; }, [showKeyboardHintsInBattle]);

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

  const clearBattleEffectTimers = useCallback(() => {
    if (battleEffectClearTimerRef.current) {
      clearTimeout(battleEffectClearTimerRef.current);
      battleEffectClearTimerRef.current = null;
    }
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
    const w = CHORD_OSMD_JUDGMENT_WINDOW_SEC;
    const tierByMidi = new Map<number, 0 | 1 | 2>();
    for (const target of targetsRef.current) {
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        continue;
      }
      const dt = Math.abs(phraseT - target.targetTimeSec);
      if (dt > w) {
        continue;
      }
      const tier: 0 | 1 | 2 = dt <= OSMD_VOICING_HINT_STRONG_SEC
        ? 0
        : dt <= OSMD_VOICING_HINT_MEDIUM_SEC
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
  }, []);

  const stopPhraseAudio = useCallback(() => {
    phrasePlayerRef.current?.stop();
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
      precise?: boolean;
    } = {},
  ): number => {
    clearBattleEffectTimers();
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
    // React 18 の setState バッチで連続エフェクトが落ちないよう、即時に描画側へ渡す。
    phaserGameRef.current?.triggerEffect(command);
    setBattleEffectCommand(command);
    const clearDelay = Math.max(
      BATTLE_EFFECT_CLEAR_MS,
      Math.round((options.travelDurationSec ?? 0) * 1000) + 120,
    );
    battleEffectClearTimerRef.current = setTimeout(() => {
      setBattleEffectCommand(current => (current?.id === effectId ? null : current));
    }, clearDelay);
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
    clearScheduledTimers();
    clearBattleEffectTimers();
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
    clearBattleEffectTimers,
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
    clearBattleEffectTimers();
    gameStateRef.current = 'gameOver';
    stopPhraseAudio();
    setGameState('gameOver');
    setStatusText(message);
  }, [clearBattleEffectTimers, clearScheduledTimers, stopPhraseAudio]);

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
      setScoreErrorText(isEnglishCopy ? 'MusicXML is not registered.' : 'MusicXMLが登録されていません');
      return null;
    }
    const cached = musicXmlCache.get(rawUrl);
    if (cached) {
      setMusicXmlText(cached);
      setScoreErrorText(null);
      return cached;
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
        setScoreErrorText(isEnglishCopy ? 'MusicXML is empty.' : 'MusicXMLが空です');
        return null;
      }
      const normalizedText = normalizeChordOsmdMusicXml(text);
      musicXmlCache.set(rawUrl, normalizedText);
      setMusicXmlText(normalizedText);
      setScoreErrorText(null);
      return normalizedText;
    } catch {
      if (phraseRunIdRef.current === runId) {
        setMusicXmlText(null);
        setScoreErrorText(isEnglishCopy ? 'Could not load MusicXML.' : 'MusicXMLを読み込めませんでした');
      }
      return null;
    }
  }, [isEnglishCopy]);

  useEffect(() => {
    const firstPhrase = phrases[0];
    if (gameState === 'idle' && firstPhrase) {
      void loadMusicXml(firstPhrase, phraseRunIdRef.current);
      const initialTargets = buildChordOsmdRhythmTargets(
        firstPhrase,
        stage.bpm,
        stage.beats_per_measure,
        chordOsmdXmlAttacks,
        earTrainingOsmdUsesScoreTargets(stage),
      );
      targetsRef.current = initialTargets;
      setTargets(initialTargets);
      setCompletedTargetCount(0);
    }
  }, [chordOsmdXmlAttacks, gameState, loadMusicXml, phrases, stage, stage.bpm, stage.beats_per_measure]);

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
    publishTargetStates();
  }, [isEnglishCopy, publishTargetStates, syncPracticeVoicingHints, triggerFeedback]);

  const handleHammerImpact = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed) {
      return;
    }
    if (!state.failed) {
      state.failed = true;
      publishTargetStates();
    }
    if (!tutorialNoCombat) {
      applyPlayerDamage(activeDamageConfig.miss);
    }
  }, [activeDamageConfig.miss, applyPlayerDamage, publishTargetStates, tutorialNoCombat]);

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
      const throwTime = target.targetTimeSec - CHORD_OSMD_HAMMER_LEAD_SEC;
      if (phraseTimeSec + 1e-9 < throwTime) {
        break;
      }
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        nextHammerTargetIndexRef.current += 1;
        continue;
      }
      const impactTimeSec = target.targetTimeSec + CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC;
      const travelDurationSec = Math.max(0.12, impactTimeSec - phraseTimeSec);
      const effectId = triggerBattleEffect('osmdHammer', { travelDurationSec });
      state.hammerEffectId = effectId;
      const targetId = target.id;
      registerBattleEffectImpact(effectId, () => {
        handleHammerImpact(targetId);
      });
      nextHammerTargetIndexRef.current += 1;
    }
  }, [handleHammerImpact, registerBattleEffectImpact, triggerBattleEffect]);

  const failExpiredTargets = useCallback((phraseTimeSec: number) => {
    const phraseTargets = targetsRef.current;
    while (nextMissTargetIndexRef.current < phraseTargets.length) {
      const target = phraseTargets[nextMissTargetIndexRef.current];
      if (phraseTimeSec <= target.targetTimeSec + CHORD_OSMD_JUDGMENT_OFFSET_SEC + CHORD_OSMD_JUDGMENT_WINDOW_SEC) {
        break;
      }
      failTargetIfNeeded(target.id);
      nextMissTargetIndexRef.current += 1;
    }
  }, [failTargetIfNeeded]);

  const applyMusicXmlLyricQuotes = useCallback((phraseTimeSec: number) => {
    const lyrics = phraseLyricsRef.current;
    while (
      nextLyricQuoteIndexRef.current < lyrics.length
      && phraseTimeSec + 1e-9 >= lyrics[nextLyricQuoteIndexRef.current].targetTimeSec
    ) {
      phaserGameRef.current?.setPlayerQuote(lyrics[nextLyricQuoteIndexRef.current].text);
      nextLyricQuoteIndexRef.current += 1;
    }
  }, []);

  const updateActiveMeasureForPhraseTime = useCallback((phraseTimeSec: number) => {
    if (phraseTimeSec < 0) {
      return;
    }
    const nextMeasure = computeChordOsmdActiveMeasureNumber(
      phraseTimeSec,
      stage.bpm,
      stage.beats_per_measure,
      phraseLoopDurationSecRef.current,
      stage.loop_measures,
      targetsRef.current,
    );
    setActiveMeasureNumber(current => (current === nextMeasure ? current : nextMeasure));
  }, [stage.beats_per_measure, stage.bpm, stage.loop_measures]);

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
    syncPracticeVoicingHints,
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

    void (async () => {
      const xmlText = await loadMusicXml(phrase, runId);
      if (phraseRunIdRef.current !== runId) {
        return;
      }

      const attacks = xmlText ? collectChordOsmdMusicXmlAttacks(xmlText) : null;
      const phraseTargets = buildChordOsmdRhythmTargets(
        phrase,
        stage.bpm,
        stage.beats_per_measure,
        attacks,
        earTrainingOsmdUsesScoreTargets(stage),
      );
      if (phraseTargets.length === 0) {
        finishGameOver(isEnglishCopy ? 'No chord timings are registered.' : '判定用コードタイミングが登録されていません');
        return;
      }

      resetPhraseRuntime(phraseTargets);
      setActiveMeasureNumber(Math.max(1, phraseTargets[0]?.measureNumber ?? 1));

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
      phraseLoopDurationSecRef.current = safeLoopDurationSec;
      phraseLoopEndSecRef.current = computeChordOsmdPhraseLoopEndSec(safeLoopDurationSec, phraseTargets);
      const phraseLyrics = xmlText
        ? collectChordOsmdMusicXmlLyrics(xmlText, stage.bpm, stage.beats_per_measure)
        : [];
      phraseLyricsRef.current = phraseLyrics;
      if (tutorial) {
        tutorialDialogueHandleRef.current?.cancel();
        tutorialDialogueHandleRef.current = scheduleOsmdTimedLinesForLoop({
          bpm: stage.bpm,
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
        bpm: stage.bpm,
        beatGain: settings.masterVolume * settings.musicVolume,
        inputWindowLeadSec: CHORD_OSMD_JUDGMENT_WINDOW_SEC,
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
    resetPhraseRuntime,
    settings.masterVolume,
    settings.musicVolume,
    stage.beats_per_measure,
    stage.bpm,
    stage.count_in_beats,
    stage.loop_measures,
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

  const startBattle = useCallback(() => {
    if (phrases.length === 0) {
      finishGameOver(copy.noPhrases);
      return;
    }
    pendingImpactHandlersRef.current.clear();
    markAudioUserInteraction();
    void ensureBattlePianoAudio({
      midiVolume: settings.midiVolume,
      soundEffectVolume: settings.soundEffectVolume,
      rootSoundVolume: settings.rootSoundVolume,
    }).catch(() => undefined);
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
    setBattleEffectCommand(null);
    battleEffectIdRef.current = 0;
    startPhrase(0);
  }, [copy.noPhrases, finishGameOver, phrases.length, stage.enemy_hp, stage.player_hp, startPhrase]);

  const completeTarget = useCallback((
    target: ChordOsmdRhythmTarget,
    state: RuntimeTargetState,
    timingOffsetSec: number,
  ) => {
    state.completed = true;
    syncPracticeVoicingHints();
    if (state.hammerEffectId !== undefined) {
      pendingImpactHandlersRef.current.delete(state.hammerEffectId);
    }
    triggerFeedback('correct');
    setStatusText(copy.chordCompleted(target.label));
    publishTargetStates();
    const damage = activeDamageConfig.perCorrectNote;
    const effectId = triggerBattleEffect('osmdHammerReflect', {
      label: target.label,
      damage,
      relatedEffectId: state.hammerEffectId,
      precise: timingOffsetSec <= CHORD_OSMD_PRECISE_WINDOW_SEC,
    });
    registerBattleEffectImpact(effectId, () => {
      applyEnemyDamage(damage, lastRankRef.current);
    });
  }, [
    activeDamageConfig.perCorrectNote,
    applyEnemyDamage,
    copy,
    publishTargetStates,
    registerBattleEffectImpact,
    syncPracticeVoicingHints,
    triggerBattleEffect,
    triggerFeedback,
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

    const phraseT = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseT == null || !Number.isFinite(phraseT)) {
      return;
    }
    const w = CHORD_OSMD_JUDGMENT_WINDOW_SEC;
    for (const target of targetsRef.current) {
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        continue;
      }
      const judged = target.targetTimeSec + CHORD_OSMD_JUDGMENT_OFFSET_SEC;
      if (Math.abs(phraseT - judged) > w) {
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
        completeTarget(target, state, Math.abs(phraseT - judged));
      }
      return;
    }
  }, [completeTarget, syncPracticeVoicingHints]);

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
    void ensureBattlePianoAudio({
      midiVolume: settings.midiVolume,
      soundEffectVolume: settings.soundEffectVolume,
      rootSoundVolume: settings.rootSoundVolume,
    }).then(() => controller.initialize()).then(async () => {
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
    void playNote(midiNote, 100);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  useEffect(() => {
    return () => {
      tutorialDrumLoopRef.current?.stop();
      pendingImpactHandlersRef.current.clear();
      clearScheduledTimers();
      clearBattleEffectTimers();
      stopPhraseAudio();
      phrasePlayerRef.current?.dispose();
      phrasePlayerRef.current = null;
    };
  }, [clearBattleEffectTimers, clearScheduledTimers, stopPhraseAudio]);

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

  const scoreScrollActive = gameState === 'countIn' || gameState === 'playingPhrase';

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
          effectCommand={battleEffectCommand}
          callbacks={battleCallbacks}
          className="h-full w-full"
          disableCorrectSe
        />
      </div>

      <EarTrainingChordOSMDScore
        musicXmlText={musicXmlText}
        scoreErrorText={scoreErrorText}
        activeMeasureNumber={activeMeasureNumber}
        scrollActive={scoreScrollActive}
        renderKeyValue={phraseRunId}
        isEnglishCopy={isEnglishCopy}
        hidden={showLobbyControls}
        scoreZClassName={showLobbyControls ? 'z-0' : 'z-10'}
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
        isMidiConnected={isMidiConnected}
        practiceRunMode={practiceRunModeConfig}
      />
    </div>
  );
};

export default EarTrainingChordOSMDScreen;
