import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingPhaserGame from './EarTrainingPhaserGame';
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
  DEFAULT_AVATAR_URL,
  EAR_TRAINING_ENEMY_AVATAR_FLIP_X_URLS,
  EAR_TRAINING_ENEMY_AVATAR_URLS,
  EAR_TRAINING_PLAYER_AVATAR_URL,
} from '@/utils/constants';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
import {
  CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC,
  EarTrainingChordVoicingPhrasePlayer,
} from '@/utils/earTrainingChordVoicingPhrasePlayer';
import { toCdnProxyUrl } from '@/utils/cdnProxy';
import {
  buildChordOsmdRhythmTargets,
  CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC,
  CHORD_OSMD_HAMMER_LEAD_SEC,
  CHORD_OSMD_JUDGMENT_WINDOW_SEC,
  chordOsmdRankForAccuracy,
  chordOsmdTargetIsComplete,
  consumeChordOsmdMidi,
  createChordOsmdRemainingCounts,
  getChordOsmdTotalNoteCount,
  normalizeChordOsmdMusicXml,
  type ChordOsmdRhythmTarget,
} from '@/utils/earTrainingChordOsmd';

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
}

interface RuntimeTargetState {
  remainingCounts: Map<number, number>;
  completed: boolean;
  failed: boolean;
  hammerEffectId?: number;
}

type PendingImpactHandler = () => void;

const INPUT_COOLDOWN_MS = 20;
const BATTLE_EFFECT_CLEAR_MS = 900;
const PHRASE_END_PADDING_SEC = 0.08;
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
  const phrases = useMemo(
    () => (stage.phrases ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [stage.phrases],
  );
  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const practiceModeRef = useRef(initialPracticeMode);
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

  const [statusText, setStatusText] = useState(
    isEnglishCopy ? 'Press START to begin OSMD rhythm battle.' : 'STARTでOSMDリズムバトルを開始します',
  );
  const [gameState, setGameState] = useState<EarTrainingGameState>('idle');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [phraseIntroSeq, setPhraseIntroSeq] = useState(0);
  const [enemyHp, setEnemyHp] = useState(stage.enemy_hp);
  const [playerHp, setPlayerHp] = useState(stage.player_hp);
  const [activeMeasureNumber, setActiveMeasureNumber] = useState(1);
  const [musicXmlText, setMusicXmlText] = useState<string | null>(null);
  const [scoreErrorText, setScoreErrorText] = useState<string | null>(null);
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
  const activeTargetIdsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const battleEffectClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingImpactHandlersRef = useRef<Map<number, PendingImpactHandler>>(new Map());
  const lastInputAtRef = useRef(0);
  const battleEffectIdRef = useRef(0);
  const progressSaveStartedRef = useRef(false);
  const phraseEndingRef = useRef(false);
  const totalCompletedTargetsRef = useRef(0);
  const totalJudgedTargetsRef = useRef(0);
  const lastRankRef = useRef<EarTrainingRank | null>(null);
  const practiceHintTargetIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { phraseIndexRef.current = phraseIndex; }, [phraseIndex]);
  useEffect(() => { enemyHpRef.current = enemyHp; }, [enemyHp]);
  useEffect(() => { playerHpRef.current = playerHp; }, [playerHp]);
  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);

  useEffect(() => {
    if (!practiceMode) {
      practiceHintTargetIdsRef.current.clear();
      pianoOverlayRef.current?.clearVoicingHints();
    }
  }, [practiceMode]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.midiVolume]);

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
    if (!practiceModeRef.current) {
      practiceHintTargetIdsRef.current.clear();
      pianoOverlayRef.current?.clearVoicingHints();
      return;
    }
    const union = new Set<number>();
    practiceHintTargetIdsRef.current.forEach(targetId => {
      const state = runtimeByTargetIdRef.current.get(targetId);
      if (!state || state.completed || state.failed) {
        return;
      }
      state.remainingCounts.forEach((count, midi) => {
        if (count > 0) {
          union.add(midi);
        }
      });
    });
    if (union.size === 0) {
      pianoOverlayRef.current?.clearVoicingHints();
    } else {
      pianoOverlayRef.current?.setVoicingHints([...union], []);
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
    } = {},
  ): number => {
    clearBattleEffectTimers();
    battleEffectIdRef.current += 1;
    const effectId = battleEffectIdRef.current;
    setBattleEffectCommand({
      id: effectId,
      kind,
      label: options.label,
      damage: options.damage,
      phraseNoteCount: options.phraseNoteCount,
      relatedEffectId: options.relatedEffectId,
      travelDurationSec: options.travelDurationSec,
    });
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
    if (damage <= 0 || practiceMode) {
      return;
    }
    const nextPlayerHp = Math.max(0, playerHpRef.current - damage);
    playerHpRef.current = nextPlayerHp;
    setPlayerHp(nextPlayerHp);
    if (nextPlayerHp <= 0) {
      finishGameOver(copy.gameOver);
    }
  }, [copy.gameOver, finishGameOver, practiceMode]);

  const loadMusicXml = useCallback(async (phrase: EarTrainingPhrase, runId: number) => {
    const rawUrl = phrase.music_xml_url?.trim();
    if (!rawUrl) {
      setMusicXmlText(null);
      setScoreErrorText(isEnglishCopy ? 'MusicXML is not registered.' : 'MusicXMLが登録されていません');
      return;
    }
    const cached = musicXmlCache.get(rawUrl);
    if (cached) {
      setMusicXmlText(cached);
      setScoreErrorText(null);
      return;
    }
    try {
      const response = await fetch(toCdnProxyUrl(rawUrl));
      if (!response.ok) {
        throw new Error(String(response.status));
      }
      const text = await response.text();
      if (phraseRunIdRef.current !== runId) {
        return;
      }
      if (!text.trim()) {
        setMusicXmlText(null);
        setScoreErrorText(isEnglishCopy ? 'MusicXML is empty.' : 'MusicXMLが空です');
        return;
      }
      const normalizedText = normalizeChordOsmdMusicXml(text);
      musicXmlCache.set(rawUrl, normalizedText);
      setMusicXmlText(normalizedText);
      setScoreErrorText(null);
    } catch {
      if (phraseRunIdRef.current === runId) {
        setMusicXmlText(null);
        setScoreErrorText(isEnglishCopy ? 'Could not load MusicXML.' : 'MusicXMLを読み込めませんでした');
      }
    }
  }, [isEnglishCopy]);

  useEffect(() => {
    const firstPhrase = phrases[0];
    if (gameState === 'idle' && firstPhrase) {
      void loadMusicXml(firstPhrase, phraseRunIdRef.current);
      const initialTargets = buildChordOsmdRhythmTargets(firstPhrase, stage.bpm, stage.beats_per_measure);
      targetsRef.current = initialTargets;
      setTargets(initialTargets);
      setCompletedTargetCount(0);
    }
  }, [gameState, loadMusicXml, phrases, stage.bpm, stage.beats_per_measure]);

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
    activeTargetIdsRef.current = new Set();
    practiceHintTargetIdsRef.current.clear();
    pianoOverlayRef.current?.clearVoicingHints();
    setTargets([...nextTargets]);
    setCompletedTargetCount(0);
  }, []);

  const failTargetIfNeeded = useCallback((targetId: string) => {
    const state = runtimeByTargetIdRef.current.get(targetId);
    if (!state || state.completed || state.failed) {
      return;
    }
    state.failed = true;
    activeTargetIdsRef.current.delete(targetId);
    practiceHintTargetIdsRef.current.delete(targetId);
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
    applyPlayerDamage(activeDamageConfig.miss);
  }, [activeDamageConfig.miss, applyPlayerDamage, publishTargetStates]);

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
    activeTargetIdsRef.current.clear();
    practiceHintTargetIdsRef.current.clear();
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
      });
    }

    if (playerFailDamage > 0) {
      const effectId = triggerBattleEffect('fail', {
        label: 'Fail',
        damage: playerFailDamage,
      });
      registerBattleEffectImpact(effectId, () => {
        applyPlayerDamage(playerFailDamage);
      });
    }

    if (!practiceMode && enemyHpRef.current - completionDamage <= 0) {
      return;
    }
    if (!practiceMode && playerHpRef.current - playerFailDamage <= 0) {
      return;
    }

    const nextIndex = getNextPhraseIndex(phraseIndexRef.current, phrases.length);
    startPhraseRef.current(nextIndex);
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

  const schedulePhraseEvents = useCallback((
    phrase: EarTrainingPhrase,
    phraseTargets: readonly ChordOsmdRhythmTarget[],
    runId: number,
    countInDurationSec: number,
  ) => {
    const beatDurationSec = 60 / Math.max(1, stage.bpm);
    const measureDurationSec = beatDurationSec * Math.max(1, stage.beats_per_measure);
    const loopDurationSec = Number(phrase.loop_duration_sec);
    const safeLoopDurationSec = Number.isFinite(loopDurationSec) && loopDurationSec > 0
      ? loopDurationSec
      : measureDurationSec * Math.max(1, stage.loop_measures);

    const tickerMeasureCount =
      Number.isFinite(safeLoopDurationSec) && safeLoopDurationSec > 0 && measureDurationSec > 0
        ? Math.min(512, Math.max(1, Math.ceil(safeLoopDurationSec / measureDurationSec)))
        : Math.max(1, stage.loop_measures);

    for (let measureIndex = 0; measureIndex < tickerMeasureCount; measureIndex += 1) {
      scheduleTimer(() => {
        if (phraseRunIdRef.current === runId) {
          setActiveMeasureNumber(measureIndex + 1);
        }
      }, (countInDurationSec + measureIndex * measureDurationSec) * 1000);
    }

    for (const target of phraseTargets) {
      const openDelayMs = (countInDurationSec + target.targetTimeSec - CHORD_OSMD_JUDGMENT_WINDOW_SEC) * 1000;
      scheduleTimer(() => {
        if (phraseRunIdRef.current !== runId) {
          return;
        }
        const state = runtimeByTargetIdRef.current.get(target.id);
        if (!state || state.completed || state.failed) {
          return;
        }
        activeTargetIdsRef.current.add(target.id);
        if (practiceModeRef.current) {
          practiceHintTargetIdsRef.current.add(target.id);
          syncPracticeVoicingHints();
        }
        setActiveMeasureNumber(target.measureNumber);
        publishTargetStates();
      }, openDelayMs);

      const hammerDelaySec = Math.max(0, countInDurationSec + target.targetTimeSec - CHORD_OSMD_HAMMER_LEAD_SEC);
      const impactTimeSec = countInDurationSec + target.targetTimeSec + CHORD_OSMD_HAMMER_IMPACT_OFFSET_SEC;
      scheduleTimer(() => {
        if (phraseRunIdRef.current !== runId) {
          return;
        }
        const state = runtimeByTargetIdRef.current.get(target.id);
        if (!state || state.completed || state.failed) {
          return;
        }
        const effectId = triggerBattleEffect('osmdHammer', {
          travelDurationSec: Math.max(0.12, impactTimeSec - hammerDelaySec),
        });
        state.hammerEffectId = effectId;
        registerBattleEffectImpact(effectId, () => {
          handleHammerImpact(target.id);
        });
      }, hammerDelaySec * 1000);

      scheduleTimer(() => {
        if (phraseRunIdRef.current === runId) {
          failTargetIfNeeded(target.id);
        }
      }, (countInDurationSec + target.targetTimeSec + CHORD_OSMD_JUDGMENT_WINDOW_SEC) * 1000);
    }

    scheduleTimer(() => {
      finishCurrentPhrase(runId);
    }, (countInDurationSec + safeLoopDurationSec + PHRASE_END_PADDING_SEC) * 1000);
  }, [
    failTargetIfNeeded,
    finishCurrentPhrase,
    handleHammerImpact,
    publishTargetStates,
    registerBattleEffectImpact,
    scheduleTimer,
    stage.beats_per_measure,
    stage.bpm,
    stage.loop_measures,
    syncPracticeVoicingHints,
    triggerBattleEffect,
  ]);

  const startPhrase = useCallback((nextPhraseIndex: number) => {
    const phrase = phrases[nextPhraseIndex];
    if (!phrase) {
      finishGameOver(copy.noPhrases);
      return;
    }

    clearScheduledTimers();
    phraseEndingRef.current = false;
    stopPhraseAudio();

    const phraseTargets = buildChordOsmdRhythmTargets(phrase, stage.bpm, stage.beats_per_measure);
    if (phraseTargets.length === 0) {
      finishGameOver(isEnglishCopy ? 'No chord timings are registered.' : '判定用コードタイミングが登録されていません');
      return;
    }

    phraseRunIdRef.current += 1;
    const runId = phraseRunIdRef.current;
    setPhraseIndex(nextPhraseIndex);
    phraseIndexRef.current = nextPhraseIndex;
    setPhraseRunId(runId);
    setPhraseIntroSeq(current => current + 1);
    resetPhraseRuntime(phraseTargets);
    setActiveMeasureNumber(Math.max(1, phraseTargets[0]?.measureNumber ?? 1));
    setLastRank(null);
    setStatusText(copy.countIn);
    gameStateRef.current = 'countIn';
    setGameState('countIn');

    const beats = Math.max(0, Math.min(32, stage.count_in_beats));
    void loadMusicXml(phrase, runId);

    const player = ensurePhrasePlayer();
    player.setVolume(settings.musicVolume * settings.masterVolume);
    void (async () => {
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

      const spb = 60 / Math.max(1, stage.bpm);
      const countInDurationSec = CHORD_VOICING_PHRASE_PLAYER_LEAD_IN_SEC + beats * spb;
      schedulePhraseEvents(phrase, phraseTargets, runId, countInDurationSec);
      const onPhraseStarted = (): void => {
        if (phraseRunIdRef.current !== runId) {
          return;
        }
        gameStateRef.current = 'playingPhrase';
        setGameState('playingPhrase');
        setStatusText(copy.phraseLabel(nextPhraseIndex + 1));
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
    schedulePhraseEvents,
    settings.masterVolume,
    settings.musicVolume,
    stage.beats_per_measure,
    stage.bpm,
    stage.count_in_beats,
    stopPhraseAudio,
  ]);

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
    void initializeAudioSystem().catch(() => undefined);
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
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

  const completeTarget = useCallback((target: ChordOsmdRhythmTarget, state: RuntimeTargetState) => {
    state.completed = true;
    activeTargetIdsRef.current.delete(target.id);
    practiceHintTargetIdsRef.current.delete(target.id);
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
    if (now - lastInputAtRef.current < INPUT_COOLDOWN_MS) {
      return;
    }
    lastInputAtRef.current = now;
    if (gameStateRef.current !== 'playingPhrase' && gameStateRef.current !== 'countIn') {
      return;
    }

    for (const target of targetsRef.current) {
      if (!activeTargetIdsRef.current.has(target.id)) {
        continue;
      }
      const state = runtimeByTargetIdRef.current.get(target.id);
      if (!state || state.completed || state.failed) {
        continue;
      }
      const nextRemaining = consumeChordOsmdMidi(state.remainingCounts, note);
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
      clearScheduledTimers();
      clearBattleEffectTimers();
      stopPhraseAudio();
      phrasePlayerRef.current?.dispose();
      phrasePlayerRef.current = null;
    };
  }, [clearBattleEffectTimers, clearScheduledTimers, stopPhraseAudio]);

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
  const resultRankLine = gameState === 'stageClear' && lastRank
    ? `${hudLabels.clearGradePrefix} ${mapEarTrainingRankToLessonRank(lastRank)}`
    : null;
  const timeLabel = practiceMode
    ? '∞'
    : `${Math.min(phraseIndex + 1, Math.max(1, phrases.length))}/${Math.max(1, phrases.length)}`;

  const battleSnapshot: EarTrainingBattleSnapshot = useMemo(() => ({
    gameState,
    resultState,
    stageTitle: stage.title,
    statusText: stageStatusText,
    hudLabels,
    phraseIntroLine,
    phraseIntroEmphasis: false,
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
  }), [
    canChangePracticeMode,
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
      <EarTrainingPhaserGame
        ref={phaserGameRef}
        snapshot={battleSnapshot}
        effectCommand={battleEffectCommand}
        callbacks={battleCallbacks}
        className="h-full w-full"
        disableCorrectSe
      />

      <EarTrainingChordOSMDScore
        musicXmlText={musicXmlText}
        scoreErrorText={scoreErrorText}
        activeMeasureNumber={activeMeasureNumber}
        renderKeyValue={phraseRunId}
        isEnglishCopy={isEnglishCopy}
        hidden={showLobbyControls}
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
      />
    </div>
  );
};

export default EarTrainingChordOSMDScreen;
