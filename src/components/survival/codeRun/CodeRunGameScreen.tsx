import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/authStore';
import { useGameStore } from '@/stores/gameStore';
import { useGeoStore } from '@/stores/geoStore';
import { shouldUseEnglishCopy } from '@/utils/globalAudience';
import { MIDIController, initializeAudioSystem, playNote, stopNote, updateGlobalVolume } from '@/utils/MidiController';
import FantasySoundManager from '@/utils/FantasySoundManager';
import { buildProgressionChordDefinitions } from '@/utils/survivalProgressionChords';
import { applySurvivalVoicingHintsWithOpacity, computeKeyboardHintOpacity } from '@/utils/survivalStaffHintOpacity';
import type { ProductionHintMode } from '@/types';
import { fetchSurvivalRunMap } from '@/platform/supabaseSurvival';
import { PIXINotesRenderer, type PIXINotesRendererInstance } from '../../game/PIXINotesRenderer';
import type { DifficultyConfig, PlayerStats, SpecialSkills, AcquiredMagics, SurvivalCharacter, SurvivalDifficulty, SurvivalGameResult } from '../SurvivalTypes';
import { STAGE_TIME_LIMIT_SECONDS, type StageDefinition } from '../SurvivalStageDefinitions';
import SurvivalGameOver from '../SurvivalGameOver';
import SurvivalSettingsModal, { loadSurvivalDisplaySettings, type SurvivalDisplaySettings } from '../SurvivalSettingsModal';
import CodeRunCanvas from './CodeRunCanvas';
import { createCodeRunMapFromDb, createDefaultCodeRunMap } from './defaultCodeRunMap';
import { createInitialCodeRunState, tickCodeRun, triggerCodeRunJump } from './CodeRunEngine';
import type { CodeRunInputState, CodeRunMapSpec, CodeRunState } from './CodeRunTypes';

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
  onRetryWithHint?: () => void;
  onRetryWithoutHint?: () => void;
  onNextStage?: () => void;
  onSurvivalRunModeRestart?: (nextHintMode: boolean) => void;
  lessonRuntime?: { readonly timeLimitSec?: number | null };
  lessonProductionHintOverrides?: {
    readonly staff?: ProductionHintMode | null;
    readonly keyboard?: ProductionHintMode | null;
  };
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

const formatClock = (seconds: number): string => {
  const safe = Math.max(0, Math.ceil(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
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

interface CodeRunVirtualStickProps {
  onAnalogChange: (value: number) => void;
}

const CodeRunVirtualStick: React.FC<CodeRunVirtualStickProps> = ({ onAnalogChange }) => {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [knobX, setKnobX] = useState(0);

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = padRef.current?.getBoundingClientRect();
    if (!rect) return;
    const center = rect.left + rect.width / 2;
    const radius = rect.width * 0.36;
    const dx = Math.max(-radius, Math.min(radius, clientX - center));
    setKnobX(dx);
    onAnalogChange(dx / radius);
  }, [onAnalogChange]);

  const release = useCallback(() => {
    setKnobX(0);
    onAnalogChange(0);
  }, [onAnalogChange]);

  return (
    <div
      ref={padRef}
      className="absolute bottom-5 left-5 h-28 w-28 rounded-full border border-white/20 bg-black/35 shadow-2xl backdrop-blur-sm md:hidden"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX);
      }}
      onPointerMove={(event) => updateFromPointer(event.clientX)}
      onPointerUp={release}
      onPointerCancel={release}
    >
      <div className="absolute left-1/2 top-1/2 h-2 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15" />
      <div
        className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 bg-cyan-300/80 shadow-lg shadow-cyan-400/30"
        style={{ transform: `translate(calc(-50% + ${knobX}px), -50%)` }}
      />
    </div>
  );
};

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
  onRetryWithHint,
  onRetryWithoutHint,
  onNextStage,
  onSurvivalRunModeRestart,
  lessonRuntime,
  lessonProductionHintOverrides,
}) => {
  const settings = useGameStore(state => state.settings);
  const { profile } = useAuthStore();
  const geoCountry = useGeoStore(state => state.country);
  const isEnglishCopy = shouldUseEnglishCopy({ rank: profile?.rank, country: profile?.country ?? geoCountry, preferredLocale: profile?.preferred_locale });
  const timeLimitSec = lessonRuntime?.timeLimitSec ?? stageDefinition.runTimeLimitSec ?? STAGE_TIME_LIMIT_SECONDS;
  const [mapSpec, setMapSpec] = useState<CodeRunMapSpec>(() => createDefaultCodeRunMap(timeLimitSec));
  const mapSpecRef = useRef(mapSpec);
  const [runState, setRunState] = useState<CodeRunState>(() => createInitialCodeRunState(mapSpec));
  const stateRef = useRef(runState);
  const inputRef = useRef<CodeRunInputState>({ left: false, right: false, analogX: 0 });
  const resultRef = useRef<SurvivalGameResult | null>(null);
  const [result, setResult] = useState<SurvivalGameResult | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMidiConnected, setIsMidiConnected] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<SurvivalDisplaySettings>(() => loadSurvivalDisplaySettings());
  const [bgmVolume, setBgmVolume] = useState(0.3);
  const bgmVolumeRef = useRef(0.3);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmUrlRef = useRef<string | null>(null);
  const midiControllerRef = useRef<MIDIController | null>(null);
  const pixiRendererRef = useRef<PIXINotesRendererInstance | null>(null);
  const pianoHostRef = useRef<HTMLDivElement | null>(null);
  const [pianoSize, setPianoSize] = useState({ width: typeof window === 'undefined' ? 960 : window.innerWidth, height: 150 });

  const progressionChords = useMemo(
    () => buildProgressionChordDefinitions(stageDefinition.chordProgression ?? []),
    [stageDefinition.chordProgression],
  );
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const currentChordIndexRef = useRef(0);
  const [completedPitchClasses, setCompletedPitchClasses] = useState<Set<number>>(() => new Set());
  const completedPitchClassesRef = useRef<Set<number>>(new Set());
  const handleNoteInputRef = useRef<(note: number) => void>(() => undefined);

  const currentChord = progressionChords.length > 0
    ? progressionChords[currentChordIndex % progressionChords.length]
    : null;
  const nextChord = progressionChords.length > 0
    ? progressionChords[(currentChordIndex + 1) % progressionChords.length]
    : null;
  const chordLocked = runState.player.chordLockedUntilLanding;
  const remainingSec = Math.max(0, mapSpec.timeLimitSec - runState.elapsedSec);
  const keyboardProductionMode = lessonProductionHintOverrides?.keyboard
    ?? stageDefinition.productionKeyboardHintMode
    ?? 'fade_15s';

  useEffect(() => {
    mapSpecRef.current = mapSpec;
  }, [mapSpec]);

  const resetRun = useCallback((nextMap?: CodeRunMapSpec) => {
    const targetMap = nextMap ?? mapSpecRef.current;
    const initial = createInitialCodeRunState(targetMap);
    stateRef.current = initial;
    inputRef.current = { left: false, right: false, analogX: 0 };
    resultRef.current = null;
    setRunState(initial);
    setResult(null);
    setIsPaused(false);
    currentChordIndexRef.current = 0;
    setCurrentChordIndex(0);
    completedPitchClassesRef.current = new Set();
    setCompletedPitchClasses(new Set());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const mapId = stageDefinition.runMapId ?? 'night_city_run_01';
    const fallback = createDefaultCodeRunMap(timeLimitSec);
    setMapSpec(fallback);
    resetRun(fallback);
    fetchSurvivalRunMap(mapId)
      .then((row) => {
        if (cancelled || !row) return;
        const nextMap = createCodeRunMapFromDb(row.id, row.mapData, timeLimitSec);
        setMapSpec(nextMap);
        resetRun(nextMap);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [resetRun, stageDefinition.runMapId, timeLimitSec]);

  useEffect(() => {
    const host = pianoHostRef.current;
    if (!host) return;
    const update = () => {
      const rect = host.getBoundingClientRect();
      setPianoSize({ width: Math.max(1, Math.floor(rect.width)), height: Math.max(120, Math.floor(rect.height)) });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

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
    audio.volume = bgmVolumeRef.current;
    stopBgm();
    bgmAudioRef.current = audio;
    currentBgmUrlRef.current = config.bgmUrl;
    audio.play().catch(() => undefined);
  }, [config.bgmUrl, isPaused, result, stopBgm]);

  useEffect(() => () => stopBgm(), [stopBgm]);

  useEffect(() => {
    if (!result) return;
    stopBgm();
    try {
      if (result.isStageClear) {
        FantasySoundManager.playStageClear();
      } else {
        FantasySoundManager.playGameOverJingle();
      }
    } catch { /* noop */ }
  }, [result, stopBgm]);

  const finishRun = useCallback((nextState: CodeRunState) => {
    if (resultRef.current) return;
    const clear = nextState.status === 'clear';
    const nextResult = makeResult(nextState, clear, hintMode);
    resultRef.current = nextResult;
    setResult(nextResult);
    if (clear && !hintMode) {
      onLessonStageClear?.();
      onMissionStageClear?.();
    }
  }, [hintMode, onLessonStageClear, onMissionStageClear]);

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
        if (next.status !== 'playing') finishRun(next);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [finishRun, isPaused]);

  const handleNoteInput = useCallback((note: number) => {
    const latestState = stateRef.current;
    if (latestState.player.chordLockedUntilLanding || resultRef.current) return;
    const chord = progressionChords[currentChordIndexRef.current % Math.max(1, progressionChords.length)];
    if (!chord) return;
    const targetPitchClasses = new Set(chord.notes.map(pitchClass));
    const pc = pitchClass(note);
    if (!targetPitchClasses.has(pc)) return;
    const nextCompleted = new Set(completedPitchClassesRef.current);
    nextCompleted.add(pc);
    completedPitchClassesRef.current = nextCompleted;
    setCompletedPitchClasses(new Set(nextCompleted));
    if (nextCompleted.size < targetPitchClasses.size) return;

    FantasySoundManager.playRootNote(chord.root).catch(() => undefined);
    const jumped = triggerCodeRunJump(stateRef.current);
    stateRef.current = jumped;
    setRunState(jumped);
    const nextIndex = progressionChords.length > 0
      ? (currentChordIndexRef.current + 1) % progressionChords.length
      : 0;
    currentChordIndexRef.current = nextIndex;
    setCurrentChordIndex(nextIndex);
    completedPitchClassesRef.current = new Set();
    setCompletedPitchClasses(new Set());
    if (jumped.player.chordLockedUntilLanding) {
      pixiRendererRef.current?.clearVoicingHints();
    }
  }, [progressionChords]);

  useEffect(() => {
    handleNoteInputRef.current = handleNoteInput;
  }, [handleNoteInput]);

  useEffect(() => {
    if (!midiControllerRef.current) {
      const controller = new MIDIController({
        onNoteOn: (note: number) => handleNoteInputRef.current(note),
        onNoteOff: () => undefined,
        playMidiSound: true,
      });
      controller.setConnectionChangeCallback((connected) => setIsMidiConnected(connected));
      midiControllerRef.current = controller;
      (async () => {
        try {
          await Promise.all([
            initializeAudioSystem().then(() => updateGlobalVolume(settings.midiVolume ?? 0.8)),
            FantasySoundManager.init(settings.soundEffectVolume ?? 0.8, settings.rootSoundVolume ?? 0.7, true).then(() => {
              FantasySoundManager.enableRootSound(true);
            }),
          ]);
          await controller.initialize();
          controller.setKeyHighlightCallback((note, active) => {
            pixiRendererRef.current?.highlightKey(note, active);
          });
        } catch {
          /* Touch input remains available even if MIDI/audio init fails. */
        }
      })();
    }
    return () => {
      midiControllerRef.current?.destroy().catch(() => undefined);
      midiControllerRef.current = null;
    };
  }, [settings.midiVolume, settings.rootSoundVolume, settings.soundEffectVolume]);

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
    midiControllerRef.current?.setKeyHighlightCallback((note, active) => renderer.highlightKey(note, active));
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
  }, []);

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

  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-black text-white">
      <div className="relative min-h-0 flex-1 bg-[#071026]">
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative h-full max-h-full w-full max-w-full" style={{ aspectRatio: `${mapSpec.viewWidth}/${mapSpec.viewHeight}` }}>
            <CodeRunCanvas state={runState} className="h-full w-full" />
          </div>
        </div>

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onBackToSelect}
            className="rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            {isEnglishCopy ? 'BACK' : '戻る'}
          </button>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="rounded-md border border-white/15 bg-black/45 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            {isEnglishCopy ? 'SETTINGS' : '設定'}
          </button>
        </div>

        <div className="absolute right-3 top-3 rounded-md border border-white/15 bg-black/50 px-3 py-2 text-right text-sm font-bold tabular-nums backdrop-blur">
          <div className={cn('text-lg', remainingSec <= 15 ? 'text-red-300' : 'text-white')}>{formatClock(remainingSec)}</div>
          <div className="text-[10px] font-medium text-white/60">{hintMode ? 'HINT' : 'RUN'}</div>
        </div>

        <div className="absolute left-1/2 top-[12%] flex -translate-x-1/2 items-center gap-2 text-center">
          <div className="min-w-28 rounded-md border border-cyan-300/35 bg-black/45 px-3 py-2 backdrop-blur">
            <div className="text-[10px] uppercase tracking-wide text-cyan-100/70">{isEnglishCopy ? 'Current' : '現在'}</div>
            <div className="text-sm font-bold text-cyan-100">{currentLabel}</div>
          </div>
          <div className="min-w-24 rounded-md border border-white/20 bg-black/35 px-3 py-2 backdrop-blur">
            <div className="text-[10px] uppercase tracking-wide text-white/55">next</div>
            <div className="text-xs font-semibold text-white/80">{nextLabel}</div>
          </div>
        </div>

        {dialogueText && (
          <div
            className={cn(
              'absolute max-w-[min(520px,80vw)] rounded-xl border px-4 py-3 text-sm font-semibold leading-relaxed shadow-2xl backdrop-blur',
              activeDialogue?.speaker === 'jajii'
                ? 'left-[58%] top-[24%] border-amber-200/40 bg-amber-950/65 text-amber-50'
                : 'left-[16%] top-[22%] border-sky-200/40 bg-sky-950/65 text-sky-50',
            )}
          >
            {dialogueText}
          </div>
        )}

        {isPaused && !result && (
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

        <CodeRunVirtualStick onAnalogChange={(value) => { inputRef.current = { ...inputRef.current, analogX: value }; }} />
      </div>

      <div ref={pianoHostRef} className="h-[150px] shrink-0 bg-black sm:h-[160px]">
        <PIXINotesRenderer width={pianoSize.width} height={pianoSize.height} onReady={handlePixiReady} className="h-full w-full" />
      </div>

      {result && (
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

      <SurvivalSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isMidiConnected={isMidiConnected}
        displaySettings={displaySettings}
        onDisplaySettingsChange={setDisplaySettings}
        bgmVolume={bgmVolume}
        onBgmVolumeChange={(volume) => {
          setBgmVolume(volume);
          bgmVolumeRef.current = volume;
          if (bgmAudioRef.current) bgmAudioRef.current.volume = volume;
        }}
        stageRunMode={onSurvivalRunModeRestart ? {
          hintMode,
          onApplyHintModeAndRestart: onSurvivalRunModeRestart,
        } : undefined}
      />
    </div>
  );
};

export default CodeRunGameScreen;
