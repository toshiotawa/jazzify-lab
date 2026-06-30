import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useQuestCompleteJingleOnStageClear } from '@/hooks/useQuestCompleteJingle';
import EarTrainingSettingsModal from './EarTrainingSettingsModal';
import EarTrainingChordOSMDScore from './EarTrainingChordOSMDScore';
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
  getCachedEarTrainingMusicXml,
  prefetchEarTrainingLobbyAssetsFromStage,
  storeEarTrainingMusicXml,
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
  computeChordOsmdActiveMeasureNumber,
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
  resolvePrecisionDisplayKeyboardRange,
  type PrecisionKeyboardRange,
  type PrecisionNote,
} from '@/utils/earTrainingPrecisionNotes';
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
  const [phraseDurationSec, setPhraseDurationSec] = useState(1);
  const notesViewportRef = useRef<HTMLDivElement | null>(null);
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

  const ensurePhrasePlayer = useCallback((): EarTrainingChordVoicingPhrasePlayer => {
    if (!phrasePlayerRef.current) {
      phrasePlayerRef.current = new EarTrainingChordVoicingPhrasePlayer();
    }
    return phrasePlayerRef.current;
  }, []);

  const stopPhraseAudio = useCallback((): void => {
    phrasePlayerRef.current?.stop();
  }, []);

  const syncRenderer = useCallback((phraseTimeSec: number): void => {
    notesRendererRef.current?.setPhraseTimeSec(phraseTimeSec);
    notesRendererRef.current?.setRuntimeStates(runtimeStatesRef.current);
  }, []);

  const rebuildNotesFromXml = useCallback((xmlText: string): void => {
    const built = buildPrecisionNotesFromMusicXml(
      xmlText,
      stage.bpm,
      stage.beats_per_measure,
    );
    const calibratedNotes = built.notes.map(note => ({
      ...note,
      startSec: resolveCalibratedTargetTimeSec(note.startSec),
      durationSec: practiceModeRef.current
        ? scalePracticeTargetTimeSec(note.durationSec, practiceSpeedPercentRef.current)
        : note.durationSec,
    }));
    const displayRange = resolvePrecisionDisplayKeyboardRange(
      calibratedNotes.map(note => note.midi),
      !isIOSWebView(),
    );
    setPrecisionNotes(calibratedNotes);
    setKeyboardRange(displayRange);
    runtimeStatesRef.current = createPrecisionRuntimeStates(calibratedNotes);
    notesRendererRef.current?.setNotes(calibratedNotes);
    notesRendererRef.current?.setKeyboardRange(displayRange.minMidi, displayRange.maxMidi);
    syncRenderer(phrasePlayerRef.current?.getPhraseTimelineSec() ?? 0);
  }, [
    resolveCalibratedTargetTimeSec,
    stage.beats_per_measure,
    stage.bpm,
    syncRenderer,
  ]);

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
      setGameState('idle');
      phraseEndingRef.current = false;
      return;
    }
    void finishStageClear(rank, rate);
  }, [finishStageClear, stopPhraseAudio]);

  useEffect(() => {
    finishPhraseRef.current = finishPhrase;
  }, [finishPhrase]);

  const applySeek = useCallback((targetSec: number): void => {
    const clamped = Math.max(0, Math.min(phraseLoopEndSecRef.current, targetSec));
    const player = phrasePlayerRef.current;
    const prepared = preparedRef.current;
    if (!player || !prepared) {
      setSeekSliderSec(clamped);
      return;
    }
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
    player.stop();
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
    setSeekSliderSec(clamped);
    syncRenderer(clamped);
  }, [
    resolveCalibratedTargetTimeSec,
    resolveEffectiveTimingWindowSec,
    settings.masterVolume,
    settings.musicVolume,
    syncRenderer,
  ]);

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
      const nextMeasure = computeChordOsmdActiveMeasureNumber(
        phraseTimeSec,
        resolveEffectivePracticeBpm(),
        stage.beats_per_measure,
        phraseLoopDurationSecRef.current,
        stage.loop_measures,
        notesRef.current.map((note, orderIndex) => ({
          id: note.id,
          label: '',
          orderIndex,
          targetTimeSec: note.startSec,
          measureNumber: note.measureNumber,
          midiCounts: [{ midi: note.midi, count: 1 }],
        })),
      );
      setActiveMeasureNumber(current => (current === nextMeasure ? current : nextMeasure));
    }
    markExpiredPrecisionNotesAsMiss(
      notesRef.current,
      runtimeStatesRef.current,
      phraseTimeSec,
      resolveEffectiveTimingWindowSec(PRECISION_JUDGMENT_WINDOW_SEC),
    );
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
    setSeekSliderSec(phraseTimeSec);
    syncRenderer(phraseTimeSec);
    if (state === 'playingPhrase' && phraseTimeSec >= phraseLoopEndSecRef.current) {
      finishPhraseRef.current();
    }
  }, [
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
    resolveEffectiveTimingWindowSec,
    stage.beats_per_measure,
    stage.loop_measures,
    syncRenderer,
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
    updateGlobalVolume(settings.masterVolume);

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
      if (!xmlText) {
        setGameState('idle');
        return;
      }
      rebuildNotesFromXml(xmlText);
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

      setScoreTimelineArmed(true);
      setActiveMeasureNumber(Math.max(1, notesRef.current[0]?.measureNumber ?? 1));
      setSeekSliderSec(0);

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
    phrase,
    rebuildNotesFromXml,
    resolveCalibratedTargetTimeSec,
    resolveEffectivePracticeBpm,
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
    activeGoodNotesByMidiRef.current.set(midiNote, matched.id);
    notesRendererRef.current?.highlightKey(midiNote, true);
    syncRenderer(phraseTime);
  }, [resolveEffectiveTimingWindowSec, syncRenderer]);

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
      syncRenderer(phraseTime);
    }
  }, [syncRenderer]);

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
  }, [
    settings.midiVolume,
    settings.rootSoundVolume,
    settings.selectedMidiDevice,
    settings.soundEffectVolume,
  ]);

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
    void loadMusicXml(phrase, phraseRunIdRef.current).then(xml => {
      if (xml) {
        rebuildNotesFromXml(xml);
      }
    });
    return undefined;
  }, [gameState, loadMusicXml, phrase, rebuildNotesFromXml]);

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
    if (gameStateRef.current === 'playingPhrase') {
      const pausedAt = player.pause();
      gameStateRef.current = 'paused';
      setGameState('paused');
      setSeekSliderSec(pausedAt);
      syncRenderer(pausedAt);
      return;
    }
    if (gameStateRef.current === 'paused') {
      player.playPrepared({
        prepared: preparedRef.current,
        phraseGain: settings.musicVolume * settings.masterVolume,
        startOffsetSec: player.getPausedTimelineSec(),
        onPhraseStarted: () => {
          gameStateRef.current = 'playingPhrase';
          setGameState('playingPhrase');
        },
        onEnded: () => finishPhraseRef.current(),
      });
    }
  }, [settings.masterVolume, settings.musicVolume, syncRenderer]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteInputRef.current(midiNote);
  }, []);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
    handleNoteReleaseRef.current(midiNote);
  }, []);

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
            musicXmlText={musicXmlText}
            scoreErrorText={scoreErrorText}
            activeMeasureNumber={activeMeasureNumber}
            measureDurationSec={measureDurationSec}
            scrollActive={scoreScrollActive}
            renderKeyValue={phraseRunId}
            isEnglishCopy={isEnglishCopy}
            hidden={false}
            scoreZClassName="z-10"
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
          onReady={(renderer) => {
            notesRendererRef.current = renderer;
            renderer?.setPracticeKeyboardHighlight(practiceMode);
            renderer?.setKeyCallbacks(handlePianoKeyDown, handlePianoKeyUp);
            if (precisionNotes.length > 0) {
              renderer?.setNotes(precisionNotes);
              renderer?.setRuntimeStates(runtimeStatesRef.current);
            }
          }}
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
              className="rounded bg-slate-800 px-2 py-1 text-xs"
              onClick={() => applySeek(Math.max(0, seekSliderSec - 1))}
              disabled={!preparedRef.current}
            >
              -1s
            </button>
            <button
              type="button"
              className="rounded bg-slate-800 px-2 py-1 text-xs"
              onClick={togglePause}
              disabled={gameState !== 'playingPhrase' && gameState !== 'paused'}
            >
              {gameState === 'paused'
                ? (isEnglishCopy ? 'Play' : '再生')
                : (isEnglishCopy ? 'Pause' : '一時停止')}
            </button>
            <button
              type="button"
              className="rounded bg-slate-800 px-2 py-1 text-xs"
              onClick={() => applySeek(seekSliderSec + 1)}
              disabled={!preparedRef.current}
            >
              +1s
            </button>
            <input
              type="range"
              min={0}
              max={Math.max(1, phraseDurationSec)}
              step={0.05}
              value={Math.min(seekSliderSec, phraseDurationSec)}
              className="min-w-0 flex-1"
              onChange={(event) => applySeek(Number(event.target.value))}
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
