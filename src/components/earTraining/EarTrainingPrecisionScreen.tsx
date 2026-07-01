import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuestCompleteJingleOnStageClear } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingChordOSMDScore, {
  type EarTrainingChordOSMDScoreHandle,
} from './EarTrainingChordOSMDScore';
import PrecisionNotesRenderer, {
  type PrecisionNotesRendererInstance,
} from '@/components/piano/PrecisionNotesRenderer';
import type {
  ClearConditions,
  EarTrainingGameState,
  EarTrainingPhrase,
  EarTrainingStage,
  PrecisionLessonRank,
} from '@/types';
import { useGameStore } from '@/stores/gameStore';
import { useAuthStore } from '@/stores/authStore';
import { useGeoStore } from '@/stores/geoStore';
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
  fetchEarTrainingMidi,
  getCachedEarTrainingMusicXml,
  getCachedEarTrainingMidi,
  prefetchEarTrainingLobbyAssetsFromStage,
  storeEarTrainingMusicXml,
  storeEarTrainingMidi,
} from '@/utils/prefetchEarTrainingLobbyAssets';
import {
  preloadBattleCountInClick,
  preloadBattleGmPiano,
  ensureBattlePianoAudio,
} from '@/utils/ensureBattlePianoAudio';
import { getEarTrainingGameCopy } from '@/utils/earTrainingUiCopy';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { getEarTrainingLessonClearConditionText } from '@/utils/earTrainingLessonClearCondition';
import { EarTrainingChordVoicingPhrasePlayer } from '@/utils/earTrainingChordVoicingPhrasePlayer';
import {
  computeChordOsmdScoreMaxMeasure,
  computeOsmdActiveMeasureFromTimeline,
} from '@/utils/earTrainingChordOsmdTimeline';
import {
  collectChordOsmdMusicXmlLyrics,
  normalizeChordOsmdMusicXml,
  type ChordOsmdLyricEvent,
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
import { isIOSWebView } from '@/utils/iosbridge';
import {
  buildPrecisionNotesFromMusicXml,
  calibratePrecisionNotes,
  resolvePrecisionDisplayKeyboardRange,
  type PrecisionKeyboardRange,
  type PrecisionNote,
} from '@/utils/earTrainingPrecisionNotes';
import { buildPrecisionNotesFromMidi } from '@/utils/earTrainingPrecisionMidi';
import {
  createPrecisionRuntimeStates,
  findPrecisionNoteForInput,
  isPrecisionClearRank,
  mapPrecisionRankToLessonRank,
  markExpiredPrecisionNotesAsMiss,
  PRECISION_JUDGMENT_WINDOW_SEC,
  precisionGoodRate,
  precisionRankForGoodRate,
  resetPrecisionRuntimeStatesFromTime,
  type PrecisionNoteRuntimeState,
} from '@/utils/earTrainingPrecisionJudge';

interface EarTrainingLessonContext {
  lessonId: string;
  lessonSongId: string;
  clearConditions: ClearConditions;
}

interface EarTrainingPrecisionScreenProps {
  stage: EarTrainingStage;
  lessonContext: EarTrainingLessonContext | null;
  initialPracticeMode: boolean;
  onLessonStageClear: (lessonRank: 'S' | 'A' | 'B' | 'C') => Promise<void>;
  onBack: () => void;
  onPracticeModeRestartFromSettings?: (nextPracticeMode: boolean) => void;
}

const INPUT_COOLDOWN_MS = 20;
const SCORE_BAND_HEIGHT = 128;
const PIANO_HEIGHT = 96;
const TRANSPORT_HEIGHT = 72;
const SEEK_SLIDER_UI_UPDATE_INTERVAL_MS = 200;

const EarTrainingPrecisionScreen: React.FC<EarTrainingPrecisionScreenProps> = ({
  stage,
  lessonContext,
  initialPracticeMode,
  onLessonStageClear,
  onBack,
  onPracticeModeRestartFromSettings,
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

  const phrases = useMemo(
    () => (stage.phrases ?? []).slice().sort((a, b) => a.order_index - b.order_index),
    [stage.phrases],
  );
  const phrase = phrases[0] ?? null;

  const [practiceMode, setPracticeMode] = useState(initialPracticeMode);
  const practiceModeRef = useRef(initialPracticeMode);
  const [gameState, setGameState] = useState<EarTrainingGameState | 'paused'>('idle');
  const [musicXmlText, setMusicXmlText] = useState<string | null>(null);
  const [baseMusicXmlText, setBaseMusicXmlText] = useState<string | null>(null);
  const [scoreErrorText, setScoreErrorText] = useState<string | null>(null);
  const [practiceTransposeOffset, setPracticeTransposeOffset] = useState(0);
  const [practiceSpeedPercent, setPracticeSpeedPercent] = useState(100);
  const [timingAdjustmentMs, setTimingAdjustmentMs] = useState(
    () => loadEarTrainingOsmdTimingAdjustmentMs(),
  );
  const [precisionNotes, setPrecisionNotes] = useState<PrecisionNote[]>([]);
  const [keyboardRange, setKeyboardRange] = useState<PrecisionKeyboardRange>({ minMidi: 60, maxMidi: 83 });
  const [activeMeasureNumber, setActiveMeasureNumber] = useState(1);
  const [scoreTimelineArmed, setScoreTimelineArmed] = useState(false);
  const [phraseRunId, setPhraseRunId] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const [lastRank, setLastRank] = useState<PrecisionLessonRank | null>(null);
  const [lastGoodRate, setLastGoodRate] = useState<number | null>(null);
  const [activeLyricText, setActiveLyricText] = useState('');
  const [seekSliderSec, setSeekSliderSec] = useState(0);
  const [seekPreviewSec, setSeekPreviewSec] = useState(0);
  const [isSeekDragging, setIsSeekDragging] = useState(false);
  const [phraseDurationSec, setPhraseDurationSec] = useState(1);
  const notesViewportRef = useRef<HTMLDivElement | null>(null);
  const osmdScoreRef = useRef<EarTrainingChordOSMDScoreHandle | null>(null);
  const maxOsmdMeasureRef = useRef(1);
  const [notesViewportSize, setNotesViewportSize] = useState({ width: 390, height: 400 });

  const phrasePlayerRef = useRef<EarTrainingChordVoicingPhrasePlayer | null>(null);
  const preparedRef = useRef<Awaited<ReturnType<EarTrainingChordVoicingPhrasePlayer['prepare']>> | null>(null);
  const notesRendererRef = useRef<PrecisionNotesRendererInstance | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const gameStateRef = useRef<EarTrainingGameState | 'paused'>('idle');
  const phraseRunIdRef = useRef(0);
  const notesRef = useRef<PrecisionNote[]>([]);
  const runtimeStatesRef = useRef<Map<string, PrecisionNoteRuntimeState>>(new Map());
  const phraseLyricsRef = useRef<readonly ChordOsmdLyricEvent[]>([]);
  const nextLyricIndexRef = useRef(0);
  const phraseLoopDurationSecRef = useRef(0);
  const phraseLoopEndSecRef = useRef(0);
  const phraseEndingRef = useRef(false);
  const progressSaveStartedRef = useRef(false);
  const lastInputAtByNoteRef = useRef<Map<number, number>>(new Map());
  const activeGoodNotesByMidiRef = useRef<Map<number, string>>(new Map());
  const practiceTransposeOffsetRef = useRef(0);
  const practiceSpeedPercentRef = useRef(100);
  const timingAdjustmentMsRef = useRef(loadEarTrainingOsmdTimingAdjustmentMs());
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);
  const handleNoteReleaseRef = useRef<(note: number) => void>(() => undefined);
  const finishPhraseRef = useRef<() => void>(() => undefined);
  const phraseTimeSecRef = useRef(0);
  const baseMidiDataRef = useRef<Uint8Array | null>(null);
  const seekSliderSecRef = useRef(0);
  const lastSeekSliderUiUpdateMsRef = useRef(0);
  const isSeekDraggingRef = useRef(false);
  const wasPlayingBeforeSeekRef = useRef(false);
  const activeMeasureNumberRef = useRef(1);
  const practiceTransposeEnabled = stage.practice_transpose === true;

  useQuestCompleteJingleOnStageClear(
    gameState === 'paused' ? 'playingPhrase' : gameState as EarTrainingGameState,
  );

  useEffect(() => {
    notesRendererRef.current?.setPracticeKeyboardHighlight(practiceMode);
  }, [practiceMode]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { practiceModeRef.current = practiceMode; }, [practiceMode]);
  useEffect(() => { practiceTransposeOffsetRef.current = practiceTransposeOffset; }, [practiceTransposeOffset]);
  useEffect(() => { practiceSpeedPercentRef.current = practiceSpeedPercent; }, [practiceSpeedPercent]);
  useEffect(() => { timingAdjustmentMsRef.current = timingAdjustmentMs; }, [timingAdjustmentMs]);
  useEffect(() => { notesRef.current = precisionNotes; }, [precisionNotes]);

  useEffect(() => {
    updateGlobalVolume(settings.midiVolume ?? 0.8);
  }, [settings.midiVolume]);

  useEffect(() => {
    phrasePlayerRef.current?.setVolume(settings.musicVolume * settings.masterVolume);
  }, [settings.masterVolume, settings.musicVolume]);

  const measureDurationSec = useMemo(
    () => (60 / Math.max(1, effectivePracticeBpm(stage.bpm, practiceMode ? practiceSpeedPercent : 100)))
      * Math.max(1, stage.beats_per_measure),
    [practiceMode, practiceSpeedPercent, stage.beats_per_measure, stage.bpm],
  );


  useEffect(() => {
    const element = notesViewportRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      if (width <= 0 || height <= 0) {
        return;
      }
      setNotesViewportSize(current => (
        current.width === width && current.height === height
          ? current
          : { width, height }
      ));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    void prefetchEarTrainingLobbyAssetsFromStage(stage);
    void preloadBattleGmPiano();
    void preloadBattleCountInClick();
  }, [stage]);

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

  const resolveEffectivePracticeBpm = useCallback((): number => (
    effectivePracticeBpm(stage.bpm, practiceModeRef.current ? practiceSpeedPercentRef.current : 100)
  ), [stage.bpm]);

  const refreshMaxOsmdMeasure = useCallback((): void => {
    maxOsmdMeasureRef.current = computeChordOsmdScoreMaxMeasure(
      phraseLoopDurationSecRef.current,
      resolveEffectivePracticeBpm(),
      stage.beats_per_measure,
      stage.loop_measures,
      notesRef.current,
    );
  }, [resolveEffectivePracticeBpm, stage.beats_per_measure, stage.loop_measures]);

  const syncPlayheadForTimeline = useCallback((phraseTimeSec: number, animating?: boolean): void => {
    const measureNumber = computeOsmdActiveMeasureFromTimeline(
      phraseTimeSec,
      measureDurationSec,
      maxOsmdMeasureRef.current,
    );
    const isAnimating = animating ?? (
      gameStateRef.current === 'countIn' || gameStateRef.current === 'playingPhrase'
    );
    if (measureNumber !== activeMeasureNumberRef.current) {
      activeMeasureNumberRef.current = measureNumber;
      setActiveMeasureNumber(measureNumber);
    }
    osmdScoreRef.current?.syncPlayhead({
      phraseTimelineSec: phraseTimeSec,
      activeMeasureNumber: measureNumber,
      animating: isAnimating,
    });
  }, [measureDurationSec]);

  const ensurePhrasePlayer = useCallback((): EarTrainingChordVoicingPhrasePlayer => {
    if (!phrasePlayerRef.current) {
      phrasePlayerRef.current = new EarTrainingChordVoicingPhrasePlayer();
    }
    return phrasePlayerRef.current;
  }, []);

  const stopPhraseAudio = useCallback((): void => {
    phrasePlayerRef.current?.stop();
  }, []);

  const syncRendererTime = useCallback((phraseTimeSec: number): void => {
    phraseTimeSecRef.current = phraseTimeSec;
    notesRendererRef.current?.setPhraseTimeSec(phraseTimeSec);
  }, []);

  const syncRendererStates = useCallback((): void => {
    notesRendererRef.current?.setRuntimeStates(runtimeStatesRef.current);
  }, []);

  const syncRenderer = useCallback((phraseTimeSec: number): void => {
    syncRendererTime(phraseTimeSec);
    syncRendererStates();
  }, [syncRendererStates, syncRendererTime]);

  const updateSeekSliderUi = useCallback((phraseTimeSec: number, force = false): void => {
    seekSliderSecRef.current = phraseTimeSec;
    const now = performance.now();
    if (!force && now - lastSeekSliderUiUpdateMsRef.current < SEEK_SLIDER_UI_UPDATE_INTERVAL_MS) {
      return;
    }
    lastSeekSliderUiUpdateMsRef.current = now;
    setSeekSliderSec(phraseTimeSec);
  }, []);

  const rebuildPrecisionNotes = useCallback((xmlText: string | null): void => {
    const classificationBpm = resolveEffectivePracticeBpm();
    const transposeOffset = practiceTransposeEnabled && practiceModeRef.current
      ? practiceTransposeOffsetRef.current
      : 0;
    const midiUrl = phrase?.midi_url?.trim() ?? '';
    let builtNotes: PrecisionNote[] = [];
    if (midiUrl.length > 0 && baseMidiDataRef.current) {
      builtNotes = buildPrecisionNotesFromMidi(
        baseMidiDataRef.current,
        stage.bpm,
        transposeOffset,
      ).notes;
    } else if (xmlText) {
      builtNotes = buildPrecisionNotesFromMusicXml(
        xmlText,
        stage.bpm,
        stage.beats_per_measure,
      ).notes;
    }
    const calibratedNotes = calibratePrecisionNotes(builtNotes, {
      resolveCalibratedStartSec: resolveCalibratedTargetTimeSec,
      practiceMode: practiceModeRef.current,
      practiceSpeedPercent: practiceSpeedPercentRef.current,
      classificationBpm,
    });
    const displayRange = resolvePrecisionDisplayKeyboardRange(
      calibratedNotes.map(note => note.midi),
      !isIOSWebView(),
    );
    setPrecisionNotes(calibratedNotes);
    setKeyboardRange(displayRange);
    runtimeStatesRef.current = createPrecisionRuntimeStates(calibratedNotes);
    refreshMaxOsmdMeasure();
    notesRendererRef.current?.setNotes(calibratedNotes);
    notesRendererRef.current?.setKeyboardRange(displayRange.minMidi, displayRange.maxMidi);
    syncRenderer(phrasePlayerRef.current?.getPhraseTimelineSec() ?? 0);
  }, [
    phrase?.midi_url,
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
    refreshMaxOsmdMeasure,
    stage.beats_per_measure,
    stage.bpm,
    syncRenderer,
    practiceTransposeEnabled,
  ]);

  const loadPrecisionMidi = useCallback(async (
    targetPhrase: EarTrainingPhrase,
    runId: number,
  ): Promise<Uint8Array | null> => {
    const rawUrl = targetPhrase.midi_url?.trim();
    if (!rawUrl) {
      baseMidiDataRef.current = null;
      return null;
    }
    const cached = getCachedEarTrainingMidi(rawUrl);
    if (cached) {
      baseMidiDataRef.current = cached;
      return cached;
    }
    try {
      const data = await fetchEarTrainingMidi(rawUrl);
      if (phraseRunIdRef.current !== runId) {
        return null;
      }
      if (!data) {
        baseMidiDataRef.current = null;
        return null;
      }
      storeEarTrainingMidi(rawUrl, data);
      baseMidiDataRef.current = data;
      return data;
    } catch {
      baseMidiDataRef.current = null;
      return null;
    }
  }, []);

  const loadMusicXml = useCallback(async (targetPhrase: EarTrainingPhrase, runId: number): Promise<string | null> => {
    const rawUrl = targetPhrase.music_xml_url?.trim();
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
      const normalizedText = normalizeChordOsmdMusicXml(text);
      storeEarTrainingMusicXml(rawUrl, normalizedText);
      setBaseMusicXmlText(normalizedText);
      const displayXml = resolveDisplayXml(normalizedText);
      setMusicXmlText(displayXml);
      setScoreErrorText(null);
      return displayXml;
    } catch {
      if (phraseRunIdRef.current === runId) {
        setScoreErrorText(isEnglishCopy ? 'Could not load MusicXML.' : 'MusicXMLを読み込めませんでした');
      }
      return null;
    }
  }, [isEnglishCopy, practiceTransposeEnabled]);

  const finishStageClear = useCallback(async (rank: PrecisionLessonRank, goodRate: number) => {
    setLastRank(rank);
    setLastGoodRate(goodRate);
    setGameState('stageClear');
    if (practiceMode || !lessonContext || progressSaveStartedRef.current || !isPrecisionClearRank(rank)) {
      return;
    }
    progressSaveStartedRef.current = true;
    await onLessonStageClear(mapPrecisionRankToLessonRank(rank));
    setProgressSaved(true);
  }, [lessonContext, onLessonStageClear, practiceMode]);

  const finishPhrase = useCallback(() => {
    if (phraseEndingRef.current) {
      return;
    }
    phraseEndingRef.current = true;
    stopPhraseAudio();
    const rate = precisionGoodRate(notesRef.current, runtimeStatesRef.current);
    const rank = precisionRankForGoodRate(rate);
    if (practiceModeRef.current) {
      const endSec = phraseLoopEndSecRef.current;
      updateSeekSliderUi(endSec, true);
      syncRenderer(endSec);
      syncPlayheadForTimeline(endSec, false);
      gameStateRef.current = 'paused';
      setGameState('paused');
      phraseEndingRef.current = false;
      return;
    }
    void finishStageClear(rank, rate);
  }, [finishStageClear, stopPhraseAudio, syncPlayheadForTimeline, syncRenderer, updateSeekSliderUi]);

  useEffect(() => {
    finishPhraseRef.current = finishPhrase;
  }, [finishPhrase]);

  const resetRuntimeStatesForSeekTime = useCallback((clamped: number): void => {
    resetPrecisionRuntimeStatesFromTime(
      notesRef.current,
      runtimeStatesRef.current,
      clamped,
      resolveEffectiveTimingWindowSec(PRECISION_JUDGMENT_WINDOW_SEC),
    );
    nextLyricIndexRef.current = 0;
    for (let i = 0; i < phraseLyricsRef.current.length; i += 1) {
      const lyric = phraseLyricsRef.current[i];
      if (lyric && resolveCalibratedTargetTimeSec(lyric.targetTimeSec) <= clamped) {
        nextLyricIndexRef.current = i + 1;
        setActiveLyricText(lyric.text);
      }
    }
  }, [resolveCalibratedTargetTimeSec, resolveEffectiveTimingWindowSec]);

  const beginSeekInteraction = useCallback((): void => {
    if (isSeekDraggingRef.current) {
      return;
    }
    isSeekDraggingRef.current = true;
    setIsSeekDragging(true);
    wasPlayingBeforeSeekRef.current = gameStateRef.current === 'playingPhrase'
      || gameStateRef.current === 'countIn';
    if (wasPlayingBeforeSeekRef.current) {
      const player = phrasePlayerRef.current;
      if (player && preparedRef.current) {
        const pausedAt = player.pause();
        gameStateRef.current = 'paused';
        setGameState('paused');
        updateSeekSliderUi(pausedAt, true);
        syncRenderer(pausedAt);
        syncPlayheadForTimeline(pausedAt, false);
        setSeekPreviewSec(pausedAt);
      }
    } else {
      setSeekPreviewSec(seekSliderSecRef.current);
    }
  }, [syncPlayheadForTimeline, syncRenderer, updateSeekSliderUi]);

  const updateSeekPreview = useCallback((targetSec: number): void => {
    if (!isSeekDraggingRef.current) {
      return;
    }
    const clamped = Math.max(0, Math.min(phraseLoopEndSecRef.current, targetSec));
    seekSliderSecRef.current = clamped;
    setSeekPreviewSec(clamped);
  }, []);

  const commitSeekPosition = useCallback((targetSec: number, resumePlayback: boolean): void => {
    isSeekDraggingRef.current = false;
    setIsSeekDragging(false);
    const clamped = Math.max(0, Math.min(phraseLoopEndSecRef.current, targetSec));
    const player = phrasePlayerRef.current;
    const prepared = preparedRef.current;
    if (!player || !prepared) {
      phraseTimeSecRef.current = clamped;
      updateSeekSliderUi(clamped, true);
      return;
    }
    resetRuntimeStatesForSeekTime(clamped);
    player.stop();
    updateSeekSliderUi(clamped, true);
    syncRenderer(clamped);
    syncPlayheadForTimeline(clamped, resumePlayback);

    if (resumePlayback) {
      player.playPrepared({
        prepared,
        phraseGain: settings.musicVolume * settings.masterVolume,
        startOffsetSec: clamped,
        onPhraseStarted: () => {
          gameStateRef.current = 'playingPhrase';
          setGameState('playingPhrase');
        },
        onEnded: () => finishPhraseRef.current(),
      });
    } else {
      gameStateRef.current = 'paused';
      setGameState('paused');
    }
  }, [
    resetRuntimeStatesForSeekTime,
    settings.masterVolume,
    settings.musicVolume,
    syncPlayheadForTimeline,
    syncRenderer,
    updateSeekSliderUi,
  ]);

  const endSeekInteraction = useCallback((targetSec: number): void => {
    commitSeekPosition(targetSec, wasPlayingBeforeSeekRef.current);
  }, [commitSeekPosition]);

  const seekBySeconds = useCallback((deltaSec: number): void => {
    const base = gameStateRef.current === 'playingPhrase' || gameStateRef.current === 'countIn'
      ? (phrasePlayerRef.current?.getPhraseTimelineSec() ?? seekSliderSecRef.current)
      : seekSliderSecRef.current;
    const resume = gameStateRef.current === 'playingPhrase' || gameStateRef.current === 'countIn';
    commitSeekPosition(base + deltaSec, resume);
  }, [commitSeekPosition]);

  const handlePhraseTimelineTick = useCallback(() => {
    const state = gameStateRef.current;
    if (state !== 'countIn' && state !== 'playingPhrase') {
      return;
    }
    const phraseTimeSec = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseTimeSec == null || !Number.isFinite(phraseTimeSec)) {
      return;
    }
    if (phraseTimeSec >= 0) {
      const nextMeasure = computeOsmdActiveMeasureFromTimeline(
        phraseTimeSec,
        measureDurationSec,
        maxOsmdMeasureRef.current,
      );
      if (nextMeasure !== activeMeasureNumberRef.current) {
        activeMeasureNumberRef.current = nextMeasure;
        setActiveMeasureNumber(nextMeasure);
        osmdScoreRef.current?.syncPlayhead({
          phraseTimelineSec: phraseTimeSec,
          activeMeasureNumber: nextMeasure,
          animating: true,
        });
      }
    }
    const newlyMissed = markExpiredPrecisionNotesAsMiss(
      notesRef.current,
      runtimeStatesRef.current,
      phraseTimeSec,
      resolveEffectiveTimingWindowSec(PRECISION_JUDGMENT_WINDOW_SEC),
    );
    if (newlyMissed > 0) {
      syncRendererStates();
    }
    while (
      nextLyricIndexRef.current < phraseLyricsRef.current.length
      && phraseTimeSec + 1e-9 >= resolveCalibratedTargetTimeSec(
        phraseLyricsRef.current[nextLyricIndexRef.current]?.targetTimeSec ?? 0,
      )
    ) {
      const lyric = phraseLyricsRef.current[nextLyricIndexRef.current];
      if (lyric) {
        setActiveLyricText(lyric.text);
      }
      nextLyricIndexRef.current += 1;
    }
    updateSeekSliderUi(phraseTimeSec);
    syncRendererTime(phraseTimeSec);
    if (state === 'playingPhrase' && phraseTimeSec >= phraseLoopEndSecRef.current) {
      finishPhraseRef.current();
    }
  }, [
    measureDurationSec,
    resolveCalibratedTargetTimeSec,
    resolveEffectiveTimingWindowSec,
    syncRendererStates,
    syncRendererTime,
    updateSeekSliderUi,
  ]);

  useEffect(() => {
    if (gameState !== 'countIn' && gameState !== 'playingPhrase') {
      return undefined;
    }
    let rafId = 0;
    const tick = (): void => {
      handlePhraseTimelineTick();
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [gameState, handlePhraseTimelineTick]);

  const startBattle = useCallback(() => {
    if (!phrase) {
      return;
    }
    markAudioUserInteraction();
    void ensureBattlePianoAudio({
      midiVolume: settings.midiVolume,
      soundEffectVolume: settings.soundEffectVolume,
      rootSoundVolume: settings.rootSoundVolume,
    });
    updateGlobalVolume(settings.midiVolume ?? 0.8);

    const runId = phraseRunIdRef.current + 1;
    phraseRunIdRef.current = runId;
    setPhraseRunId(runId);
    phraseEndingRef.current = false;
    progressSaveStartedRef.current = false;
    setProgressSaved(false);
    setLastRank(null);
    setLastGoodRate(null);
    setActiveLyricText('');
    nextLyricIndexRef.current = 0;
    activeGoodNotesByMidiRef.current.clear();
    setGameState('countIn');

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
      if (phrase.midi_url?.trim()) {
        await loadPrecisionMidi(phrase, runId);
      }
      if (phraseRunIdRef.current !== runId) {
        return;
      }
      if (!xmlText) {
        setGameState('idle');
        return;
      }
      rebuildPrecisionNotes(xmlText);
      if (notesRef.current.length === 0) {
        setGameState('idle');
        return;
      }
      phraseLyricsRef.current = collectChordOsmdMusicXmlLyrics(
        xmlText,
        resolveEffectivePracticeBpm(),
        stage.beats_per_measure,
      ).map(event => ({
        ...event,
        targetTimeSec: resolveCalibratedTargetTimeSec(event.targetTimeSec),
      }));

      let prepared;
      try {
        prepared = await player.prepare(toCdnProxyUrl(phrase.audio_url));
      } catch {
        setGameState('idle');
        return;
      }
      if (phraseRunIdRef.current !== runId) {
        return;
      }
      preparedRef.current = prepared;

      const loopDurationSec = Number(phrase.loop_duration_sec);
      const measureDuration = (60 / Math.max(1, stage.bpm)) * Math.max(1, stage.beats_per_measure);
      const safeLoopDurationSec = Number.isFinite(loopDurationSec) && loopDurationSec > 0
        ? loopDurationSec
        : measureDuration * Math.max(1, stage.loop_measures);
      phraseLoopDurationSecRef.current = practiceModeRef.current
        ? scalePracticePhraseLoopEndSec(safeLoopDurationSec, practiceSpeedPercentRef.current)
        : safeLoopDurationSec;
      const lastNoteEnd = notesRef.current.reduce(
        (max, note) => Math.max(max, note.startSec + note.durationSec),
        0,
      );
      phraseLoopEndSecRef.current = Math.max(
        scalePracticePhraseLoopEndSec(safeLoopDurationSec, practiceModeRef.current ? practiceSpeedPercentRef.current : 100),
        lastNoteEnd + 0.25,
      );
      setPhraseDurationSec(phraseLoopEndSecRef.current);
      refreshMaxOsmdMeasure();

      setScoreTimelineArmed(true);
      const initialMeasure = Math.max(1, notesRef.current[0]?.measureNumber ?? 1);
      activeMeasureNumberRef.current = initialMeasure;
      setActiveMeasureNumber(initialMeasure);
      phraseTimeSecRef.current = 0;
      updateSeekSliderUi(0, true);
      syncPlayheadForTimeline(0, true);

      player.schedulePreparedPhraseWithCountIn({
        prepared,
        countInBeats: stage.count_in_beats,
        bpm: resolveEffectivePracticeBpm(),
        beatGain: settings.musicVolume * settings.masterVolume,
        onPhraseStarted: () => {
          if (phraseRunIdRef.current !== runId) {
            return;
          }
          gameStateRef.current = 'playingPhrase';
          setGameState('playingPhrase');
        },
        onEnded: () => finishPhraseRef.current(),
      });
    })();
  }, [
    ensurePhrasePlayer,
    loadMusicXml,
    loadPrecisionMidi,
    phrase,
    rebuildPrecisionNotes,
    refreshMaxOsmdMeasure,
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
    syncPlayheadForTimeline,
    settings.masterVolume,
    settings.musicVolume,
    stage.beats_per_measure,
    stage.bpm,
    stage.count_in_beats,
    stage.loop_measures,
    practiceTransposeEnabled,
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
    const phraseTime = phrasePlayerRef.current?.getPhraseTimelineSec();
    if (phraseTime == null || !Number.isFinite(phraseTime)) {
      return;
    }
    const windowSec = resolveEffectiveTimingWindowSec(PRECISION_JUDGMENT_WINDOW_SEC);
    const matched = findPrecisionNoteForInput(
      notesRef.current,
      runtimeStatesRef.current,
      midiNote,
      phraseTime,
      windowSec,
    );
    if (!matched) {
      return;
    }
    const state = runtimeStatesRef.current.get(matched.id);
    if (!state) {
      return;
    }
    state.judgment = 'good';
    state.hitAtSec = phraseTime;
    if (matched.isShortNote) {
      state.hiddenFromLane = true;
    }
    activeGoodNotesByMidiRef.current.set(midiNote, matched.id);
    notesRendererRef.current?.highlightKey(midiNote, true);
    syncRendererStates();
  }, [resolveEffectiveTimingWindowSec, syncRendererStates]);

  const handleNoteRelease = useCallback((note: number) => {
    const midiNote = Math.round(note);
    notesRendererRef.current?.highlightKey(midiNote, false);
    const noteId = activeGoodNotesByMidiRef.current.get(midiNote);
    if (!noteId) {
      return;
    }
    activeGoodNotesByMidiRef.current.delete(midiNote);
    const state = runtimeStatesRef.current.get(noteId);
    const matched = notesRef.current.find(item => item.id === noteId);
    if (!state || !matched) {
      return;
    }
    const phraseTime = phrasePlayerRef.current?.getPhraseTimelineSec() ?? 0;
    if (phraseTime < matched.startSec + matched.durationSec - 0.01) {
      state.hiddenFromLane = true;
      syncRendererStates();
    }
  }, [syncRendererStates]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
    handleNoteReleaseRef.current = handleNoteRelease;
  }, [handleNoteInput, handleNoteRelease]);

  useEffect(() => {
    if (!midiControllerRef.current) {
      midiControllerRef.current = new MIDIController({
        onNoteOn: note => handleNoteInputRef.current(note),
        onNoteOff: note => handleNoteReleaseRef.current(note),
        onConnectionChange: connected => setIsMidiConnected(connected),
        playMidiSound: true,
      });
    }
    const controller = midiControllerRef.current;
    controller.setKeyHighlightCallback((note, active) => {
      notesRendererRef.current?.highlightKey(note, active);
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
      controller.destroy();
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

  useEffect(() => {
    if (gameState !== 'idle' || !phrase) {
      return undefined;
    }
    void loadMusicXml(phrase, phraseRunIdRef.current).then(async xml => {
      if (phrase.midi_url?.trim()) {
        await loadPrecisionMidi(phrase, phraseRunIdRef.current);
      }
      if (xml) {
        rebuildPrecisionNotes(xml);
      }
    });
    return undefined;
  }, [gameState, loadMusicXml, loadPrecisionMidi, phrase, rebuildPrecisionNotes]);

  useEffect(() => () => {
    stopPhraseAudio();
    phrasePlayerRef.current?.dispose();
    phrasePlayerRef.current = null;
  }, [stopPhraseAudio]);

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
    if (baseMusicXmlText) {
      setMusicXmlText(applyPracticeTransposeToMusicXml(baseMusicXmlText, clampedOffset));
    }
    setIsSettingsOpen(false);
    startBattle();
  }, [baseMusicXmlText, ensurePhrasePlayer, practiceTransposeEnabled, startBattle, stopPhraseAudio]);

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

  const togglePause = useCallback(() => {
    const player = phrasePlayerRef.current;
    if (!player || !preparedRef.current) {
      return;
    }
    if (gameStateRef.current === 'playingPhrase' || gameStateRef.current === 'countIn') {
      const pausedAt = player.pause();
      gameStateRef.current = 'paused';
      setGameState('paused');
      updateSeekSliderUi(pausedAt, true);
      syncRenderer(pausedAt);
      syncPlayheadForTimeline(pausedAt, false);
      return;
    }
    if (gameStateRef.current === 'paused') {
      const offset = seekSliderSecRef.current;
      syncPlayheadForTimeline(offset, true);
      player.playPrepared({
        prepared: preparedRef.current,
        phraseGain: settings.musicVolume * settings.masterVolume,
        startOffsetSec: offset,
        onPhraseStarted: () => {
          gameStateRef.current = 'playingPhrase';
          setGameState('playingPhrase');
        },
        onEnded: () => finishPhraseRef.current(),
      });
    }
  }, [settings.masterVolume, settings.musicVolume, syncPlayheadForTimeline, syncRenderer, updateSeekSliderUi]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
    handleNoteReleaseRef.current(midiNote);
  }, []);

  const handleRendererReady = useCallback((renderer: PrecisionNotesRendererInstance | null) => {
    notesRendererRef.current = renderer;
    if (!renderer) {
      return;
    }
    renderer.setPracticeKeyboardHighlight(practiceModeRef.current);
    renderer.setKeyCallbacks(handlePianoKeyDown, handlePianoKeyUp);
    if (notesRef.current.length > 0) {
      renderer.setNotes(notesRef.current);
      renderer.setRuntimeStates(runtimeStatesRef.current);
    }
    syncRenderer(phraseTimeSecRef.current);
  }, [handlePianoKeyDown, handlePianoKeyUp, syncRenderer]);

  useEffect(() => {
    notesRendererRef.current?.setKeyCallbacks(handlePianoKeyDown, handlePianoKeyUp);
  }, [handlePianoKeyDown, handlePianoKeyUp]);

  const canChangePracticeMode = gameState === 'idle' || gameState === 'stageClear';
  const showLobby = canChangePracticeMode;
  const scoreScrollActive = scoreTimelineArmed
    && (gameState === 'countIn' || gameState === 'playingPhrase' || gameState === 'paused');
  const clearConditionLine = getEarTrainingLessonClearConditionText(stage, isEnglishCopy);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-slate-950 text-white">
      <header className="relative z-40 flex shrink-0 items-center justify-between px-3 py-2">
        <button
          type="button"
          className="rounded-lg bg-slate-800/90 px-3 py-1.5 text-sm"
          onClick={onBack}
        >
          {isEnglishCopy ? 'Back' : '戻る'}
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold">{stage.title}</div>
          <div className="text-xs text-slate-400">{clearConditionLine}</div>
        </div>
        <button
          type="button"
          className="rounded-lg bg-slate-800/90 px-3 py-1.5 text-sm"
          onClick={() => setIsSettingsOpen(true)}
        >
          {isEnglishCopy ? 'Settings' : '設定'}
        </button>
      </header>

      <div className="relative shrink-0" style={{ height: SCORE_BAND_HEIGHT }}>
        {musicXmlText ? (
          <EarTrainingChordOSMDScore
            ref={osmdScoreRef}
            musicXmlText={musicXmlText}
            scoreErrorText={scoreErrorText}
            activeMeasureNumber={activeMeasureNumber}
            measureDurationSec={measureDurationSec}
            scrollActive={scoreScrollActive}
            renderKeyValue={phraseRunId}
            isEnglishCopy={isEnglishCopy}
            hidden={false}
            scoreZClassName="z-10"
            useImperativePlayhead
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            {scoreErrorText ?? (isEnglishCopy ? 'Loading score…' : '譜面を読み込み中…')}
          </div>
        )}
      </div>

      <div ref={notesViewportRef} className="relative min-h-0 flex-1">
        <PrecisionNotesRenderer
          width={notesViewportSize.width}
          height={notesViewportSize.height}
          minMidi={keyboardRange.minMidi}
          maxMidi={keyboardRange.maxMidi}
          pianoHeight={PIANO_HEIGHT}
          className="absolute inset-0 h-full w-full"
          onReady={handleRendererReady}
        />

        {activeLyricText ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-[calc(96px+18%)] z-20 flex justify-center px-4">
            <div className="max-w-[92%] rounded-xl bg-slate-900/45 px-4 py-2 text-center text-base leading-relaxed text-white backdrop-blur-[2px]">
              {activeLyricText}
            </div>
          </div>
        ) : null}

        {showLobby ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-slate-950/75 px-6 text-center">
            <div className="text-lg font-bold">
              {isEnglishCopy ? 'Precision Mode' : '精密モード'}
            </div>
            <div className="text-sm text-slate-300">
              {practiceMode
                ? (isEnglishCopy ? 'Practice: transpose & speed available.' : '練習モード: 移調・速度変更が可能です。')
                : (isEnglishCopy ? 'Performance: 70%+ GOOD to clear.' : '本番モード: GOOD率70%以上でクリア。')}
            </div>
            <div className="text-xs text-slate-400">{originalKeyName}</div>
            <div className="flex items-center gap-2 text-xs">
              <span
                className={cn(
                  'inline-block h-2 w-2 rounded-full',
                  isMidiConnected ? 'bg-emerald-400' : 'bg-slate-500',
                )}
                aria-hidden
              />
              <span className="text-slate-400">
                {isMidiConnected
                  ? (isEnglishCopy ? 'MIDI connected' : 'MIDI接続済み')
                  : (isEnglishCopy ? 'MIDI not connected' : 'MIDI未接続')}
              </span>
            </div>
            <button
              type="button"
              className="rounded-xl bg-emerald-500 px-8 py-3 text-lg font-bold text-slate-950"
              onClick={startBattle}
            >
              {gameState === 'idle' ? 'START' : 'RETRY'}
            </button>
            {lessonContext ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={practiceMode}
                  disabled={!canChangePracticeMode || !onPracticeModeRestartFromSettings}
                  onChange={(event) => {
                    const next = event.target.checked;
                    setPracticeMode(next);
                    onPracticeModeRestartFromSettings?.(next);
                  }}
                />
                {isEnglishCopy ? 'Practice mode' : '練習モード'}
              </label>
            ) : null}
          </div>
        ) : null}

        {gameState === 'stageClear' && lastRank ? (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-white/95 text-slate-950">
            <div className="text-6xl font-black">{lastRank}</div>
            {lastGoodRate != null ? (
              <div className="text-2xl font-semibold">
                {Math.round(lastGoodRate * 100)}%
              </div>
            ) : null}
            <div className="text-sm">
              {lessonContext
                ? (progressSaved
                  ? (isEnglishCopy ? 'Progress saved.' : '進捗を保存しました。')
                  : (isEnglishCopy ? 'Saving…' : '保存中…'))
                : null}
            </div>
            <button
              type="button"
              className="rounded-xl bg-slate-900 px-6 py-2 text-white"
              onClick={onBack}
            >
              {isEnglishCopy ? 'Close' : '閉じる'}
            </button>
          </div>
        ) : null}
      </div>

      {practiceMode ? (
        <div
          className="relative z-40 shrink-0 border-t border-slate-800 bg-slate-950/95 px-3 py-2"
          style={{ height: TRANSPORT_HEIGHT }}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white disabled:opacity-40"
              onClick={() => seekBySeconds(-1)}
              disabled={!preparedRef.current}
              aria-label={isEnglishCopy ? 'Back 1 second' : '1秒戻る'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d="M6 6h2v12H6V6zm3.5 6 8.5 6V6l-8.5 6z" />
              </svg>
            </button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white disabled:opacity-40"
              onClick={togglePause}
              disabled={gameState !== 'playingPhrase' && gameState !== 'countIn' && gameState !== 'paused'}
              aria-label={
                gameState === 'paused'
                  ? (isEnglishCopy ? 'Play' : '再生')
                  : (isEnglishCopy ? 'Pause' : '一時停止')
              }
            >
              {gameState === 'paused' ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                  <path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-800 text-white disabled:opacity-40"
              onClick={() => seekBySeconds(1)}
              disabled={!preparedRef.current}
              aria-label={isEnglishCopy ? 'Forward 1 second' : '1秒進む'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d="M16 6h2v12h-2V6zM6 18l8.5-6L6 6v12z" />
              </svg>
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, phraseDurationSec)}
              step={0.05}
              value={Math.min(isSeekDragging ? seekPreviewSec : seekSliderSec, phraseDurationSec)}
              className="min-w-0 flex-1"
              onPointerDown={() => {
                beginSeekInteraction();
              }}
              onChange={(event) => {
                updateSeekPreview(Number(event.target.value));
              }}
              onPointerUp={(event) => {
                endSeekInteraction(Number(event.currentTarget.value));
              }}
              onPointerCancel={(event) => {
                endSeekInteraction(Number(event.currentTarget.value));
              }}
              disabled={!preparedRef.current}
            />
          </div>
        </div>
      ) : null}

      <EarTrainingSettingsModal
        isOpen={isSettingsOpen}
        isEnglishCopy={isEnglishCopy}
        scope="battle"
        onClose={() => setIsSettingsOpen(false)}
        onRestartFromBeginning={() => {
          setIsSettingsOpen(false);
          startBattle();
        }}
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
        practiceTranspose={practiceTransposeConfig}
        practiceSpeed={practiceSpeedConfig}
        osmdTimingAdjustment={{
          appliedOffsetMs: timingAdjustmentMs,
          onChange: handleTimingAdjustmentChange,
        }}
      />
    </div>
  );
};

export default EarTrainingPrecisionScreen;
