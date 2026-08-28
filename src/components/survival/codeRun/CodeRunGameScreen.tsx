import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { playNote, stopNote } from '@/utils/MidiController';
import type { SurvivalMidiBindings } from '@/hooks/useSurvivalMidiSession';
import type { ChordDefinition } from '@/components/fantasy/FantasyGameEngine';
import { progressionBassRootName } from '@/utils/chord-utils';
import FantasySoundManager from '@/utils/FantasySoundManager';
import { buildProgressionChordDefinitions } from '@/utils/survivalProgressionChords';
import type { CodeRunActiveChord } from './codeRunRandomChords';
import {
  isCodeRunRandomStage,
  pickCodeRunRandomChord,
} from './codeRunRandomChords';
import { applySurvivalVoicingHintsWithOpacity, computeKeyboardHintOpacity } from '@/utils/survivalStaffHintOpacity';
import type { ProductionHintMode } from '@/types';
import { fetchSurvivalRunMap } from '@/platform/supabaseSurvival';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { computeSurvivalSessionMidiMidis } from '@/utils/webKeyboardDisplayRange';
import { PIXINotesRenderer, type PIXINotesRendererInstance } from '@/components/piano/PIXINotesRenderer';
import type { DifficultyConfig, PlayerStats, SpecialSkills, AcquiredMagics, SurvivalCharacter, SurvivalDifficulty, SurvivalGameResult } from '../SurvivalTypes';
import type { StageDefinition } from '../SurvivalStageDefinitions';
import SurvivalGameOver from '../SurvivalGameOver';
import SurvivalSettingsModal, { loadSurvivalDisplaySettings, type SurvivalDisplaySettings } from '../SurvivalSettingsModal';
import { EmbedMidiSettingsModal } from '@/embed/EmbedMidiSettingsModal';
import { SurvivalMapAudio } from '@/utils/SurvivalMapAudio';
import { duckBgmForVoiceInput } from '@/utils/voiceInputBgmDuck';
import CodeRunCanvas from './CodeRunCanvas';
import CodeRunVirtualStick from './CodeRunVirtualStick';
import { createCodeRunMapById, createCodeRunMapFromDb, resolveCodeRunMapId } from './defaultCodeRunMap';
import {
  CODE_RUN_MAX_HP,
  createInitialCodeRunState,
  tickCodeRun,
  triggerCodeRunJump,
} from './CodeRunEngine';
import type { CodeRunInputState, CodeRunMapSpec, CodeRunState } from './CodeRunTypes';
import {
  CODE_RUN_MOBILE_SCALE_FACTOR,
  computeCodeRunKeyboardHeight,
  isCodeRunMobileViewport,
} from '@/utils/codeRunLayout';
import OrientationLandscapePrompt from '@/components/ui/OrientationLandscapePrompt';
import {
  canUseElementFullscreen,
  exitAppFullscreen,
  isAppFullscreenActive,
  requestAppFullscreen,
} from '@/utils/fullscreenSupport';

export type CodeRunDemoFinishOutcome = 'clear' | 'timeout' | 'failed';

interface CodeRunDemoMode {
  readonly timeLimitSec: number;
  readonly onFinish: (outcome: CodeRunDemoFinishOutcome) => void;
}

interface CodeRunGameScreenProps {
  difficulty: SurvivalDifficulty;
  config: DifficultyConfig;
  onBackToSelect: () => void;
  onBackToMenu: () => void;
  character?: SurvivalCharacter;
  stageDefinition: StageDefinition;
  onLessonStageClear?: () => void;
  onMissionStageClear?: () => void;
  isLessonMode?: boolean;
  hintMode?: boolean;
  autoRun?: boolean;
  onRetryWithHint?: () => void;
  onRetryWithoutHint?: () => void;
  onNextStage?: () => void;
  onSurvivalRunModeRestart?: (nextHintMode: boolean) => void;
  lessonRuntime?: { readonly timeLimitSec?: number | null };
  lessonRandomChordOverrides?: ReadonlyMap<string, ChordDefinition>;
  lessonProductionHintOverrides?: {
    readonly staff?: ProductionHintMode | null;
    readonly keyboard?: ProductionHintMode | null;
  };
  survivalMidi: SurvivalMidiBindings;
  demoMode?: CodeRunDemoMode;
  preferredLocale?: 'ja' | 'en';
  fullscreenRootRef?: React.RefObject<HTMLElement | null>;
  onOpenFullscreenTab?: () => void;
}

const EMPTY_STATS: PlayerStats = {
  aAtk: 0,
  bAtk: 0,
  cAtk: 0,
  speed: 0,
  reloadMagic: 0,
  hp: 1,
  maxHp: 1,
  def: 0,
  time: 0,
  aBulletCount: 0,
  luck: 0,
};

const EMPTY_SKILLS: SpecialSkills = {
  aPenetration: false,
  bKnockbackBonus: 0,
  bRangeBonus: 0,
  bDeflect: false,
  multiHitLevel: 0,
  expBonusLevel: 0,
  haisuiNoJin: false,
  zekkouchou: false,
  alwaysHaisuiNoJin: false,
  alwaysZekkouchou: false,
  autoSelect: false,
};

const EMPTY_MAGICS: AcquiredMagics = {
  thunder: 0,
  ice: 0,
  fire: 0,
  heal: 0,
  buffer: 0,
  hint: 0,
};

const pitchClass = (midi: number): number => ((midi % 12) + 12) % 12;

const makeResult = (state: CodeRunState, clear: boolean, hintMode: boolean): SurvivalGameResult => ({
  survivalTime: state.elapsedSec,
  finalLevel: 1,
  enemiesDefeated: 0,
  playerStats: EMPTY_STATS,
  skills: EMPTY_SKILLS,
  magics: EMPTY_MAGICS,
  earnedXp: 0,
  isStageClear: clear,
  isHintMode: hintMode,
});

const CodeRunGameScreen: React.FC<CodeRunGameScreenProps> = ({
  difficulty,
  config,
  onBackToSelect,
  onBackToMenu,
  character,
  stageDefinition,
  onLessonStageClear,
  onMissionStageClear,
  isLessonMode = false,
  hintMode = false,
  autoRun = false,
  onRetryWithHint,
  onRetryWithoutHint,
  onNextStage,
  onSurvivalRunModeRestart,
  lessonProductionHintOverrides,
  lessonRandomChordOverrides,
  survivalMidi,
  demoMode,
  preferredLocale,
  fullscreenRootRef,
  onOpenFullscreenTab,
}) => {
  const settings = useGameStore(state => state.settings);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({
    rank: profile?.rank,
    country: profile?.country ?? geoCountry,
    preferredLocale: preferredLocale ?? profile?.preferred_locale,
  });
  const runMapId = resolveCodeRunMapId(stageDefinition, autoRun);
  const [mapSpec, setMapSpec] = useState<CodeRunMapSpec>(() => createCodeRunMapById(runMapId));
  const mapSpecRef = useRef(mapSpec);
  const [runState, setRunState] = useState<CodeRunState>(() => createInitialCodeRunState(mapSpec));
  const stateRef = useRef(runState);
  const inputRef = useRef<CodeRunInputState>({ left: false, right: false, analogX: 0 });
  const resultRef = useRef<SurvivalGameResult | null>(null);
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<SurvivalDisplaySettings>(() => loadSurvivalDisplaySettings());
  const [bgmVolume, setBgmVolume] = useState(() => SurvivalMapAudio.getBgmVolume());
  const bgmVolumeRef = useRef(SurvivalMapAudio.getBgmVolume());
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmUrlRef = useRef<string | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const pianoHostRef = useRef<HTMLDivElement | null>(null);
  const focusRef = useRef<HTMLDivElement | null>(null);
  const localRootRef = useRef<HTMLDivElement | null>(null);
  const [needsFocusHint, setNeedsFocusHint] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(() =>
    typeof window === 'undefined' ? 88 : computeCodeRunKeyboardHeight(window.innerHeight),
  );
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window === 'undefined' ? false : isCodeRunMobileViewport(),
  );
  const [pianoSize, setPianoSize] = useState({
    width: typeof window === 'undefined' ? 960 : window.innerWidth,
    height: 88,
  });

  const randomAllowedChords = (
    stageDefinition.allowedChords.length > 0
      ? stageDefinition.allowedChords
      : config.allowedChords
  );
  const isRandomStage = useMemo(
    () => isCodeRunRandomStage(stageDefinition.stageType, randomAllowedChords),
    [stageDefinition.stageType, randomAllowedChords],
  );

  const progressionChords = useMemo(
    () => (isRandomStage
      ? []
      : buildProgressionChordDefinitions(stageDefinition.chordProgression ?? [])),
    [isRandomStage, stageDefinition.chordProgression],
  );
  const sessionMidiMidis = useMemo(
    () => (isRandomStage
      ? computeSurvivalSessionMidiMidis({
        kind: 'random',
        allowedChordIds: randomAllowedChords,
        overrides: lessonRandomChordOverrides,
      })
      : computeSurvivalSessionMidiMidis({ kind: 'progression', chords: progressionChords })),
    [isRandomStage, lessonRandomChordOverrides, progressionChords, randomAllowedChords],
  );
  const keyboardRange = useResolvedWebKeyboardRange(sessionMidiMidis);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const currentChordIndexRef = useRef(0);
  const [randomCurrentChord, setRandomCurrentChord] = useState<CodeRunActiveChord | null>(null);
  const [randomNextChord, setRandomNextChord] = useState<CodeRunActiveChord | null>(null);
  const randomCurrentChordRef = useRef<CodeRunActiveChord | null>(null);
  const randomNextChordRef = useRef<CodeRunActiveChord | null>(null);
  const [completedPitchClasses, setCompletedPitchClasses] = useState<Set<number>>(() => new Set());
  const completedPitchClassesRef = useRef<Set<number>>(new Set());
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);

  const syncRandomChordRefs = useCallback((current: CodeRunActiveChord | null, next: CodeRunActiveChord | null) => {
    randomCurrentChordRef.current = current;
    randomNextChordRef.current = next;
    setRandomCurrentChord(current);
    setRandomNextChord(next);
  }, []);

  const drawRandomChords = useCallback((excludeId?: string) => {
    const current = pickCodeRunRandomChord(randomAllowedChords, excludeId, lessonRandomChordOverrides);
    const next = current
      ? pickCodeRunRandomChord(randomAllowedChords, current.id, lessonRandomChordOverrides)
      : null;
    syncRandomChordRefs(current, next);
  }, [lessonRandomChordOverrides, randomAllowedChords, syncRandomChordRefs]);

  const progressionCurrentChord = progressionChords.length > 0
    ? progressionChords[currentChordIndex % progressionChords.length]
    : null;
  const progressionNextChord = progressionChords.length > 0
    ? progressionChords[(currentChordIndex + 1) % progressionChords.length]
    : null;

  const currentChord = isRandomStage ? randomCurrentChord : progressionCurrentChord;
  const nextChord = isRandomStage ? randomNextChord : progressionNextChord;
  const chordLocked = runState.player.chordLockedUntilLanding;
  const keyboardProductionMode = lessonProductionHintOverrides?.keyboard
    ?? stageDefinition.productionKeyboardHintMode
    ?? 'fade_15s';
  const timeRemainingSec = demoMode
    ? Math.max(0, Math.ceil(demoMode.timeLimitSec - runState.elapsedSec))
    : null;

  const restoreFocus = useCallback(() => {
    focusRef.current?.focus({ preventScroll: true });
    setNeedsFocusHint(false);
  }, []);

  useEffect(() => {
    mapSpecRef.current = mapSpec;
  }, [mapSpec]);

  useEffect(() => {
    restoreFocus();
  }, [restoreFocus]);

  useEffect(() => {
    const updateLayout = (): void => {
      setKeyboardHeight(computeCodeRunKeyboardHeight(window.innerHeight));
      setIsMobileViewport(isCodeRunMobileViewport());
    };
    updateLayout();
    window.addEventListener('resize', updateLayout, { passive: true });
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  useEffect(() => {
    const onFullscreenChange = (): void => {
      setIsFullscreen(isAppFullscreenActive());
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const applyAutoRunInput = useCallback((): void => {
    if (autoRun) {
      inputRef.current = { left: false, right: true, analogX: 0 };
      return;
    }
    inputRef.current = { left: false, right: false, analogX: 0 };
  }, [autoRun]);

  const resetRun = useCallback((nextMap?: CodeRunMapSpec) => {
    const targetMap = nextMap ?? mapSpecRef.current;
    const initial = createInitialCodeRunState(targetMap);
    stateRef.current = initial;
    applyAutoRunInput();
    resultRef.current = null;
    setRunState(initial);
    setResult(null);
    setIsPaused(false);
    currentChordIndexRef.current = 0;
    setCurrentChordIndex(0);
    completedPitchClassesRef.current = new Set();
    setCompletedPitchClasses(new Set());
    if (isRandomStage) {
      drawRandomChords();
    } else {
      syncRandomChordRefs(null, null);
    }
    restoreFocus();
  }, [applyAutoRunInput, drawRandomChords, isRandomStage, restoreFocus, syncRandomChordRefs]);

  useEffect(() => {
    if (isRandomStage) {
      drawRandomChords();
    }
  }, [drawRandomChords, isRandomStage, stageDefinition.stageNumber, stageDefinition.mapCategory]);

  useEffect(() => {
    let cancelled = false;
    const mapId = resolveCodeRunMapId(stageDefinition, autoRun);
    const fallback = createCodeRunMapById(mapId);
    setMapSpec(fallback);
    resetRun(fallback);
    fetchSurvivalRunMap(mapId)
      .then((row) => {
        if (cancelled || !row) return;
        const nextMap = createCodeRunMapFromDb(row.id, { ...row.mapData, name: row.name });
        setMapSpec(nextMap);
        resetRun(nextMap);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [autoRun, resetRun, stageDefinition]);

  useEffect(() => {
    const host = pianoHostRef.current;
    if (!host) return;
    const update = () => {
      const rect = host.getBoundingClientRect();
      setPianoSize({ width: Math.max(1, Math.floor(rect.width)), height: Math.max(60, Math.floor(rect.height)) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, [keyboardHeight]);

  const stopBgm = useCallback(() => {
    if (bgmAudioRef.current) {
      bgmAudioRef.current.pause();
      bgmAudioRef.current = null;
    }
    currentBgmUrlRef.current = null;
  }, []);

  useEffect(() => {
    if (result || isPaused || !config.bgmUrl) {
      if (bgmAudioRef.current) bgmAudioRef.current.pause();
      return;
    }
    if (currentBgmUrlRef.current === config.bgmUrl && bgmAudioRef.current && !bgmAudioRef.current.paused) return;
    const audio = new Audio(config.bgmUrl);
    audio.loop = true;
    audio.volume = duckBgmForVoiceInput(bgmVolumeRef.current, settings.inputMethod);
    stopBgm();
    bgmAudioRef.current = audio;
    currentBgmUrlRef.current = config.bgmUrl;
    audio.play().catch(() => undefined);
  }, [config.bgmUrl, isPaused, result, stopBgm, settings.inputMethod]);

  useEffect(() => () => stopBgm(), [stopBgm]);

  useEffect(() => {
    if (!result || demoMode) return;
    stopBgm();
    try {
      if (result.isStageClear) {
        FantasySoundManager.playStageClear();
      } else {
        FantasySoundManager.playGameOverJingle();
      }
    } catch { /* noop */ }
  }, [demoMode, result, stopBgm]);

  const finishRun = useCallback((
    nextState: CodeRunState,
    forcedOutcome?: CodeRunDemoFinishOutcome,
  ) => {
    if (resultRef.current) return;
    const clear = forcedOutcome === 'clear' || nextState.status === 'clear';
    const nextResult = makeResult(nextState, clear, hintMode);
    resultRef.current = nextResult;
    if (demoMode) {
      const outcome: CodeRunDemoFinishOutcome = forcedOutcome
        ?? (nextState.status === 'clear' ? 'clear' : 'failed');
      stopBgm();
      try {
        if (outcome === 'clear') {
          FantasySoundManager.playStageClear();
        } else {
          FantasySoundManager.playGameOverJingle();
        }
      } catch { /* noop */ }
      demoMode.onFinish(outcome);
      return;
    }
    setResult(nextResult);
    if (clear && !hintMode) {
      onLessonStageClear?.();
      onMissionStageClear?.();
    }
  }, [demoMode, hintMode, onLessonStageClear, onMissionStageClear, stopBgm]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(1 / 20, Math.max(0, (now - last) / 1000));
      last = now;
      if (!isPaused && !resultRef.current) {
        const next = tickCodeRun(stateRef.current, inputRef.current, dt);
        stateRef.current = next;
        setRunState(next);
        if (
          demoMode
          && next.status === 'playing'
          && next.elapsedSec >= demoMode.timeLimitSec
        ) {
          finishRun(next, 'timeout');
        } else if (next.status !== 'playing') {
          finishRun(next);
        }
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [demoMode, finishRun, isPaused]);

  const handleNoteInput = useCallback((note: number) => {
    const latestState = stateRef.current;
    if (latestState.player.chordLockedUntilLanding || resultRef.current) return;
    const chord = isRandomStage
      ? randomCurrentChordRef.current
      : progressionChords[currentChordIndexRef.current % Math.max(1, progressionChords.length)];
    if (!chord) return;
    const targetPitchClasses = new Set(chord.notes.map(pitchClass));
    const pc = pitchClass(note);
    if (!targetPitchClasses.has(pc)) return;
    const nextCompleted = new Set(completedPitchClassesRef.current);
    nextCompleted.add(pc);
    completedPitchClassesRef.current = nextCompleted;
    setCompletedPitchClasses(new Set(nextCompleted));
    if (nextCompleted.size < targetPitchClasses.size) return;

    const bassRoot =
      progressionBassRootName(chord.displayName) ?? progressionBassRootName(chord.root) ?? chord.root;
    FantasySoundManager.playCorrectRootBassNote(bassRoot).catch(() => undefined);
    const jumped = triggerCodeRunJump(stateRef.current, chord.displayName);
    stateRef.current = jumped;
    setRunState(jumped);
    if (isRandomStage) {
      const advanced = randomNextChordRef.current
        ?? pickCodeRunRandomChord(randomAllowedChords, chord.id, lessonRandomChordOverrides);
      const following = advanced
        ? pickCodeRunRandomChord(randomAllowedChords, advanced.id, lessonRandomChordOverrides)
        : null;
      syncRandomChordRefs(advanced, following);
    } else {
      const nextIndex = progressionChords.length > 0
        ? (currentChordIndexRef.current + 1) % progressionChords.length
        : 0;
      currentChordIndexRef.current = nextIndex;
      setCurrentChordIndex(nextIndex);
    }
    completedPitchClassesRef.current = new Set();
    setCompletedPitchClasses(new Set());
    if (jumped.player.chordLockedUntilLanding) {
      pixiRendererRef.current?.clearVoicingHints();
    }
  }, [
    isRandomStage,
    lessonRandomChordOverrides,
    progressionChords,
    randomAllowedChords,
    syncRandomChordRefs,
  ]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  useEffect(() => {
    void survivalMidi.prepareBattleAudio();
  }, [survivalMidi]);

  useEffect(() => {
    return survivalMidi.registerNoteHandler((note) => {
      handleNoteInputRef.current(note);
    });
  }, [survivalMidi]);

  useEffect(() => {
    return survivalMidi.registerKeyHighlightTarget(() => pixiRendererRef.current);
  }, [survivalMidi]);

  const handlePixiReady = useCallback((renderer: PIXINotesRendererInstance | null) => {
    pixiRendererRef.current = renderer;
    if (!renderer) return;
    renderer.updateSettings({
      showHitLine: false,
      noteNameStyle: settings.noteNameStyle,
      simpleDisplayMode: settings.simpleDisplayMode,
      pianoHeight: pianoSize.height,
    });
    renderer.setKeyCallbacks(
      (note: number) => {
        handleNoteInputRef.current(note);
        playNote(note, 100);
      },
      (note: number) => stopNote(note),
    );
    renderer.setTouchActionMode('pan-x');
  }, [pianoSize.height, settings.noteNameStyle, settings.simpleDisplayMode]);

  useEffect(() => {
    pixiRendererRef.current?.resize(pianoSize.width, pianoSize.height);
    pixiRendererRef.current?.updateSettings({ pianoHeight: pianoSize.height });
  }, [pianoSize]);

  useEffect(() => {
    const renderer = pixiRendererRef.current;
    if (!renderer) return;
    if (!currentChord || chordLocked || result) {
      renderer.clearVoicingHints();
      return;
    }
    const completed = currentChord.notes.filter((note) => completedPitchClasses.has(pitchClass(note)));
    const pending = currentChord.notes.filter((note) => !completedPitchClasses.has(pitchClass(note)));
    const opacity = computeKeyboardHintOpacity(runState.elapsedSec, {
      hintMode,
      hintBuffActive: false,
      productionHintMode: keyboardProductionMode,
      isStageMode: true,
      isPlaying: !isPaused && !result,
      isGameOver: !!result,
    });
    applySurvivalVoicingHintsWithOpacity(renderer, pending, completed, opacity);
  }, [chordLocked, completedPitchClasses, currentChord, hintMode, isPaused, keyboardProductionMode, result, runState.elapsedSec]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (autoRun) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        inputRef.current = { ...inputRef.current, left: true };
        event.preventDefault();
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        inputRef.current = { ...inputRef.current, right: true };
        event.preventDefault();
      } else if (event.key === 'Escape') {
        setIsPaused((v) => !v);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (autoRun) return;
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        inputRef.current = { ...inputRef.current, left: false };
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        inputRef.current = { ...inputRef.current, right: false };
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [autoRun]);

  const handleToggleFullscreen = useCallback(async () => {
    const root = fullscreenRootRef?.current ?? localRootRef.current;
    if (!root) return;
    if (isAppFullscreenActive()) {
      await exitAppFullscreen();
      return;
    }
    await requestAppFullscreen(root);
  }, [fullscreenRootRef]);

  const activeDialogue = useMemo(() => {
    const lines = stageDefinition.runDialogueScript?.lines ?? [];
    return lines.find((line) => {
      const duration = line.durationSeconds ?? 4;
      return runState.elapsedSec >= line.atSeconds && runState.elapsedSec < line.atSeconds + duration;
    });
  }, [runState.elapsedSec, stageDefinition.runDialogueScript]);

  const currentLabel = chordLocked ? '-' : (currentChord?.displayName ?? '-');
  const nextLabel = chordLocked ? '-' : (nextChord?.displayName ?? '-');
  const dialogueText = activeDialogue
    ? isEnglishCopy && activeDialogue.textEn ? activeDialogue.textEn : activeDialogue.text
    : '';
  const showNativeFullscreen = canUseElementFullscreen();
  const stickDisabled = isPaused || !!result || isSettingsOpen;
  const showVoicePreparing =
    settings.inputMethod === 'voice' && !survivalMidi.isInputConnected && !result;

  const mobilePixelScaleFactor = isMobileViewport ? CODE_RUN_MOBILE_SCALE_FACTOR : 1;

  return (
    <>
    <div
      ref={localRootRef}
      className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-black text-white"
      style={{ height: 'var(--dvh, 100dvh)', minHeight: 'var(--dvh, 100dvh)' }}
    >
      {/* iframe埋め込み時の矢印キー操作のためフォーカス可能にする */}
      <div
        ref={focusRef}
        role="application"
        aria-label={isEnglishCopy ? 'Code Run game area' : 'コードランゲームエリア'}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard focus target for iframe embed
        tabIndex={0}
        className="relative min-h-0 flex-1 bg-[#071026] outline-none"
        onBlur={() => setNeedsFocusHint(true)}
        onPointerDown={restoreFocus}
      >
        <div className="absolute inset-0 overflow-hidden">
          <CodeRunCanvas
            state={runState}
            className="h-full w-full"
            pixelScaleMode={isMobileViewport ? 'cover' : 'fit'}
            pixelScaleFactor={mobilePixelScaleFactor}
          />
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSelect}
            className="pointer-events-auto rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            {isEnglishCopy ? 'BACK' : '戻る'}
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="pointer-events-auto rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            {isEnglishCopy ? 'SETTINGS' : '設定'}
          </button>
          {showNativeFullscreen && (
            <button
              type="button"
              onClick={() => { void handleToggleFullscreen(); }}
              className="pointer-events-auto rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              {isFullscreen
                ? (isEnglishCopy ? 'EXIT FS' : '全画面解除')
                : (isEnglishCopy ? 'FULLSCREEN' : '全画面')}
            </button>
          )}
          {onOpenFullscreenTab && (
            <button
              type="button"
              onClick={onOpenFullscreenTab}
              className="pointer-events-auto rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10 md:hidden"
            >
              {isEnglishCopy ? 'OPEN TAB' : '別タブ'}
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 rounded-md border border-white/15 bg-black/50 px-3 py-1.5 backdrop-blur">
            <div className="flex gap-0.5" aria-label={isEnglishCopy ? 'HP' : 'HP'}>
              {Array.from({ length: CODE_RUN_MAX_HP }, (_, i) => (
                <span
                  key={i}
                  className={cn('text-sm leading-none', i < runState.player.hp ? 'text-rose-400' : 'text-white/25')}
                  aria-hidden
                >
                  ♥
                </span>
              ))}
            </div>
          </div>
          {timeRemainingSec !== null && (
            <div className="rounded-md border border-white/15 bg-black/50 px-3 py-1 text-right text-[10px] font-bold text-white/80 backdrop-blur">
              {isEnglishCopy ? `${timeRemainingSec}s` : `残り${timeRemainingSec}秒`}
            </div>
          )}
          {hintMode && (
            <div className="rounded-md border border-white/15 bg-black/50 px-3 py-1 text-right text-[10px] font-bold text-white/65 backdrop-blur">
              HINT
            </div>
          )}
        </div>

        <div className="code-run-chord-display pointer-events-none absolute left-1/2 top-1 z-20 flex -translate-x-1/2 flex-col items-center gap-0.5 text-center sm:top-2">
          <div
            className="min-w-40 max-w-60 px-3 py-1 text-[34px] leading-none text-[#ffe04d] sm:text-[40px]"
            style={{
              textShadow: '0 3px 8px rgba(230,56,87,0.9), 0 1px 2px rgba(0,0,0,0.85)',
            }}
          >
            {currentLabel}
          </div>
          <div className="min-w-24 max-w-32 px-1 py-0.5">
            <div
              className="text-[10px] uppercase leading-none text-white/70"
              style={{ textShadow: '0 1px 4px rgba(0,0,0,0.85)' }}
            >
              next
            </div>
            <div
              className="mt-0.5 text-xl leading-none text-white/90"
              style={{
                textShadow: '0 2px 5px rgba(230,56,87,0.55), 0 1px 2px rgba(0,0,0,0.85)',
              }}
            >
              {nextLabel}
            </div>
          </div>
        </div>

        {dialogueText && (
          <div
            className={cn(
              'pointer-events-none absolute z-20 max-w-[min(520px,80vw)] rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed shadow-2xl backdrop-blur',
              activeDialogue?.speaker === 'jajii'
                ? 'left-[58%] top-[24%] border-amber-200/40 bg-amber-950/65 text-amber-50'
                : 'left-[16%] top-[22%] border-sky-200/40 bg-sky-950/65 text-sky-50',
            )}
          >
            {dialogueText}
          </div>
        )}

        {needsFocusHint && !isMobileViewport && (
          <button
            type="button"
            onClick={restoreFocus}
            className="absolute inset-x-4 bottom-4 z-30 rounded-lg border border-cyan-300/40 bg-black/70 px-4 py-3 text-center text-sm text-cyan-100 backdrop-blur"
          >
            {isEnglishCopy
              ? 'Click here to resume keyboard controls (← →)'
              : 'クリックしてキーボード操作を再開（← →）'}
          </button>
        )}

        {isPaused && !result && !demoMode && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="w-[min(360px,88vw)] rounded-lg border border-white/15 bg-gray-900 p-4 text-center shadow-2xl">
              <div className="mb-3 text-lg font-bold">{isEnglishCopy ? 'Paused' : '一時停止'}</div>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="mb-2 w-full rounded-md bg-cyan-600 py-2 text-sm font-bold transition hover:bg-cyan-500"
              >
                {isEnglishCopy ? 'RESUME' : '再開'}
              </button>
              <button
                type="button"
                onClick={() => resetRun()}
                className="w-full rounded-md bg-gray-700 py-2 text-sm font-bold transition hover:bg-gray-600"
              >
                {isEnglishCopy ? 'RETRY' : 'リトライ'}
              </button>
            </div>
          </div>
        )}

        {showVoicePreparing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-white/15 bg-gray-900/90 px-6 py-5 text-center shadow-2xl">
              <div
                className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-cyan-400"
                aria-hidden
              />
              <p className="text-sm font-semibold text-white">
                {isEnglishCopy ? 'Preparing microphone…' : 'マイクを準備中…'}
              </p>
            </div>
          </div>
        )}

        {!autoRun ? (
          <CodeRunVirtualStick
            disabled={stickDisabled}
            onAnalogChange={(value) => { inputRef.current = { ...inputRef.current, analogX: value }; }}
          />
        ) : null}
      </div>

      <div
        ref={pianoHostRef}
        className="relative shrink-0 border-t border-amber-900/40 bg-[#120c18]"
        style={{
          height: `${keyboardHeight}px`,
          backgroundImage:
            'linear-gradient(180deg, rgba(42,28,18,0.55) 0%, rgba(12,8,18,0.95) 28%), repeating-linear-gradient(90deg, rgba(60,40,28,0.12) 0, rgba(60,40,28,0.12) 2px, transparent 2px, transparent 14px)',
        }}
      >
        <PIXINotesRenderer
          width={pianoSize.width}
          height={pianoSize.height}
          minMidi={keyboardRange.minMidi}
          maxMidi={keyboardRange.maxMidi}
          onReady={handlePixiReady}
          className="h-full w-full"
        />
      </div>

      {result && !demoMode && (
        <SurvivalGameOver
          result={result}
          difficulty={difficulty}
          characterId={character?.id ?? null}
          onRetry={() => resetRun()}
          onBackToSelect={onBackToSelect}
          onBackToMenu={onBackToMenu}
          stageDefinition={stageDefinition}
          isLessonMode={isLessonMode}
          hintMode={hintMode}
          onRetryWithHint={onRetryWithHint}
          onRetryWithoutHint={onRetryWithoutHint}
          onNextStage={onNextStage}
        />
      )}

      {demoMode ? (
        <EmbedMidiSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isMidiConnected={survivalMidi.isMidiConnected}
        />
      ) : (
        <SurvivalSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isMidiConnected={survivalMidi.isMidiConnected}
          displaySettings={displaySettings}
          onDisplaySettingsChange={setDisplaySettings}
          bgmVolume={bgmVolume}
          onBgmVolumeChange={(volume) => {
            setBgmVolume(volume);
            bgmVolumeRef.current = volume;
            if (bgmAudioRef.current) {
              bgmAudioRef.current.volume = duckBgmForVoiceInput(volume, settings.inputMethod);
            }
          }}
          stageRunMode={onSurvivalRunModeRestart ? {
            hintMode,
            onApplyHintModeAndRestart: onSurvivalRunModeRestart,
          } : undefined}
        />
      )}
    </div>
    <OrientationLandscapePrompt isEnglishCopy={isEnglishCopy} />
    </>
  );
};

export default CodeRunGameScreen;
