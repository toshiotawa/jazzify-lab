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
import { DefensePhraseStaff } from '@/components/defense/DefensePhraseStaff';
import { DefenseResult } from '@/components/defense/DefenseResult';
import EarTrainingSettingsModal from '@/components/earTraining/EarTrainingSettingsModal';
import DeferredEarTrainingPianoOverlay, {
  type EarTrainingPianoOverlayHandle,
} from '@/components/earTraining/DeferredEarTrainingPianoOverlay';
import {
  performDefenseSlash,
  tickDefenseSimulation,
} from '@/game/defense/defenseEngine';
import {
  defenseBackingDeck,
  unlockDefenseBackingAudioContext,
} from '@/game/defense/defenseBackingDeck';
import {
  createInitialPhraseJudgeState,
  evaluateDefensePhraseNoteOn,
  getDefensePhraseKeyboardHints,
  nextPhraseIndex,
  type DefensePhraseJudgeState,
} from '@/game/defense/defensePhraseJudge';
import type {
  DefenseDifficulty,
  DefenseGameResult,
  DefenseRuntime,
  DefenseStage,
} from '@/game/defense/defenseTypes';
import { computeDefenseStageMidis } from '@/game/defense/defenseStageMidis';
import { getDefenseChordHudLabels } from '@/game/defense/defenseChordHudLabels';
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
  /** 本番モードでクリアしたときに1回だけ呼ばれる（レッスン進捗の記録用） */
  readonly onClear?: () => void;
}

interface FinalStats {
  readonly result: Exclude<DefenseGameResult, 'playing'>;
  readonly surviveSec: number;
  readonly enemiesDefeated: number;
}

/** fade_15s は 15 秒で完了するため、それ以降は秒カウンタの再レンダーを止める */
const HINT_FADE_TRACK_LIMIT_SEC = 16;
const VOICE_DEFENSE_SAME_PC_DEBOUNCE_MS = 120;

export const DefenseGameScreen: React.FC<DefenseGameScreenProps> = ({
  stage,
  difficulty,
  practiceMode,
  onExit,
  onRetry,
  onClear,
}) => {
  const runtimeRef = useRef<DefenseRuntime>(
    createDefenseRuntime(stage.playerHp, stage.surviveSeconds, difficulty.maxEnemies),
  );
  const judgeRef = useRef<DefensePhraseJudgeState>(createInitialPhraseJudgeState(0));
  const pendingSwitchAtRef = useRef<number | null>(null);
  const scheduledNextPhraseIndexRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const elapsedIntRef = useRef(0);
  const pianoRef = useRef<EarTrainingPianoOverlayHandle | null>(null);
  const canvasRef = useRef<DefenseCanvasHandle | null>(null);
  const onClearRef = useRef(onClear);
  const hudRef = useRef<MutableDefenseSceneHud>({
    playerHp: stage.playerHp,
    playerMaxHp: stage.playerHp,
    remainSec: stage.surviveSeconds,
    enemiesDefeated: 0,
    practiceMode,
  });

  const [judgeSnapshot, setJudgeSnapshot] = useState<DefensePhraseJudgeState>(
    createInitialPhraseJudgeState(0),
  );
  const [elapsedInt, setElapsedInt] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
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
  const voiceSequential = settings.inputMethod === 'voice';
  isSettingsOpenRef.current = isSettingsOpen;

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  const trackElapsedForHints = !practiceMode && (
    stage.productionStaffHintMode === 'fade_15s'
    || stage.productionKeyboardHintMode === 'fade_15s'
  );

  const currentPhrase = stage.phrases[judgeSnapshot.phraseIndex] ?? stage.phrases[0] ?? null;
  const phraseKeyFifths = currentPhrase?.keyFifths ?? stage.keyFifths;

  const chordHudLabels = useMemo(
    () => getDefenseChordHudLabels(
      currentPhrase?.chords.map((chord) => chord.chordName) ?? [],
      judgeSnapshot.chordIndex,
    ),
    [currentPhrase, judgeSnapshot.chordIndex],
  );

  const keyboardHints = useMemo(
    () => getDefensePhraseKeyboardHints(stage.phrases, judgeSnapshot, voiceSequential),
    [stage.phrases, judgeSnapshot, voiceSequential],
  );

  const stageMidiMidis = useMemo(
    () => computeDefenseStageMidis(stage.phrases),
    [stage.phrases],
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

  const commitScheduledAudioSwitch = useCallback((phraseIndex: number): void => {
    defenseBackingDeck.commitSwitch();
    pendingSwitchAtRef.current = null;
    scheduledNextPhraseIndexRef.current = null;

    const preloadPhrase = stage.phrases[nextPhraseIndex(stage.phrases, phraseIndex)];
    if (preloadPhrase) {
      void defenseBackingDeck.preload([preloadPhrase.audioUrl]);
    }
  }, [stage.phrases]);

  const handleNoteOn = useCallback((midiNote: number, sequential = false) => {
    if (isSettingsOpenRef.current) return;
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

    const evaluation = evaluateDefensePhraseNoteOn(
      stage.phrases,
      stage.requiredCompletionCount,
      judgeRef.current,
      pitchClass,
      sequential,
    );

    if (evaluation.nextState === judgeRef.current) return;

    judgeRef.current = evaluation.nextState;
    setJudgeSnapshot(evaluation.nextState);

    if (evaluation.attack) {
      const guardPoseSec = stage.bpm > 0 ? 60 / stage.bpm : 1;
      performDefenseSlash(runtime, guardPoseSec);
    }

    if (evaluation.pendingSwitch && scheduledNextPhraseIndexRef.current === null) {
      const nextIndex = nextPhraseIndex(stage.phrases, judgeRef.current.phraseIndex);
      const nextPhrase = stage.phrases[nextIndex];
      if (!nextPhrase) return;
      scheduledNextPhraseIndexRef.current = nextIndex;
      applyImmediatePhraseSwitch(nextIndex);
      void (async () => {
        const buffer = await defenseBackingDeck.decodeForDeck(nextPhrase.audioUrl);
        if (scheduledNextPhraseIndexRef.current !== nextIndex) return;
        pendingSwitchAtRef.current = defenseBackingDeck.scheduleSwitch(buffer);
      })();
    }
  }, [stage.phrases, stage.requiredCompletionCount, stage.bpm, applyImmediatePhraseSwitch]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteOn(midiNote, false);
  }, [handleNoteOn]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  const handleMidiDeviceChange = useCallback((deviceId: string | null) => {
    updateSettings({ selectedMidiDevice: deviceId });
  }, [updateSettings]);

  const { isConnected: isMidiConnected } = useStandaloneNoteInput({
    onNoteOn: (note) => {
      handleNoteOn(note, voiceSequential);
    },
    onKeyHighlight: (note, active) => {
      pianoRef.current?.highlightKey(note, active);
    },
  });

  useEffect(() => {
    defenseBackingDeck.setVoiceInputDucking(voiceSequential);
    return () => {
      defenseBackingDeck.setVoiceInputDucking(false);
    };
  }, [voiceSequential]);

  useEffect(() => {
    let cancelled = false;
    defenseBackingDeck.setTransportConfig(stage.bpm, stage.beatsPerBar);

    void (async () => {
      unlockDefenseBackingAudioContext();
      const firstPhrase = stage.phrases[0];
      if (!firstPhrase) return;
      const secondPhrase = stage.phrases[1];
      await defenseBackingDeck.preload(
        secondPhrase ? [firstPhrase.audioUrl, secondPhrase.audioUrl] : [firstPhrase.audioUrl],
      );
      const buffer = await defenseBackingDeck.decodeForDeck(firstPhrase.audioUrl);
      if (cancelled) return;
      defenseBackingDeck.start(buffer);
      setAudioReady(true);
    })();

    return () => {
      cancelled = true;
      defenseBackingDeck.stop();
    };
  }, [stage]);

  useEffect(() => {
    if (isSettingsOpen) return undefined;
    lastFrameRef.current = null;
    // rAF ループ: シミュレーション tick と Canvas 描画のみ。React state は結果確定時と秒境界だけ更新する。
    const loop = (now: number): void => {
      if (runtimeRef.current.result !== 'playing') {
        rafRef.current = null;
        return;
      }
      const runtime = runtimeRef.current;

      const last = lastFrameRef.current ?? now;
      const dt = Math.min(0.05, (now - last) / 1000);
      lastFrameRef.current = now;

      tickDefenseSimulation(runtime, difficulty, dt);

      const pendingAt = pendingSwitchAtRef.current;
      if (pendingAt !== null && defenseBackingDeck.getCurrentTime() >= pendingAt) {
        const nextIdx = scheduledNextPhraseIndexRef.current;
        if (nextIdx !== null) {
          commitScheduledAudioSwitch(nextIdx);
        }
      }

      if (trackElapsedForHints) {
        const elapsedFloor = Math.floor(runtime.elapsedSec);
        if (elapsedFloor !== elapsedIntRef.current && elapsedFloor <= HINT_FADE_TRACK_LIMIT_SEC) {
          elapsedIntRef.current = elapsedFloor;
          setElapsedInt(elapsedFloor);
        }
      }

      const hud = hudRef.current;
      hud.playerHp = runtime.playerHp;
      hud.playerMaxHp = runtime.playerMaxHp;
      hud.remainSec = Math.max(0, Math.ceil(runtime.surviveSeconds - runtime.elapsedSec));
      hud.enemiesDefeated = runtime.enemiesDefeated;
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
  }, [difficulty, commitScheduledAudioSwitch, practiceMode, trackElapsedForHints, isSettingsOpen]);

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

  if (finalStats) {
    return (
      <DefenseResult
        result={finalStats.result}
        stageId={stage.id}
        stageTitle={stage.title}
        practiceMode={practiceMode}
        surviveSec={finalStats.surviveSec}
        enemiesDefeated={finalStats.enemiesDefeated}
        onRetry={onRetry}
        onBack={onExit}
      />
    );
  }

  return (
    <div className="defense-game-screen relative h-[100dvh] overflow-hidden bg-slate-950 text-white">
      <DefenseCanvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {currentPhrase && currentPhrase.chords.length > 0 && (
        <div
          className="code-run-chord-display pointer-events-none absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-0.5 text-center"
          style={{ top: DEFENSE_HUD_HEIGHT_PX + 4 }}
        >
          <div
            className="min-w-40 max-w-60 px-3 py-1 text-[34px] leading-none text-[#ffe04d] sm:text-[40px]"
            style={{
              textShadow: '0 3px 8px rgba(230,56,87,0.9), 0 1px 2px rgba(0,0,0,0.85)',
            }}
          >
            {chordHudLabels.current}
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
              {chordHudLabels.next}
            </div>
          </div>
        </div>
      )}

      {currentPhrase && currentPhrase.chords.length > 0 && (
        <div className="pointer-events-none absolute left-1/2 top-[44%] z-20 w-[min(720px,82vw)] -translate-x-1/2 -translate-y-1/2">
          <DefensePhraseStaff
            chords={currentPhrase.chords}
            chordIndex={judgeSnapshot.chordIndex}
            keyFifths={phraseKeyFifths}
            staffLayout={stage.staffLayout}
            correctNoteIndices={judgeSnapshot.correctNoteIndices}
            revealedNoteIndices={judgeSnapshot.revealedNoteIndices}
            targetStepIndex={judgeSnapshot.targetStepIndex}
            showTargetHints={showTargetHints}
            unpressedNoteOpacity={staffHintOpacity}
          />
        </div>
      )}

      {!audioReady && (
        <p className="pointer-events-none absolute bottom-[96px] left-1/2 z-30 -translate-x-1/2 text-xs text-slate-400">
          伴奏を読み込み中…
        </p>
      )}

      <div className="absolute right-3 top-[56px] z-40 flex gap-2">
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
