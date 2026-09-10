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
  getDefensePhraseTargetMidis,
  nextPhraseIndex,
  type DefensePhraseJudgeState,
} from '@/game/defense/defensePhraseJudge';
import type {
  DefenseDifficulty,
  DefenseGameResult,
  DefenseRuntime,
  DefenseStage,
} from '@/game/defense/defenseTypes';
import { createDefenseRuntime } from '@/game/defense/defenseTypes';
import { useResolvedWebKeyboardRange } from '@/hooks/useResolvedWebKeyboardRange';
import { useStandaloneNoteInput } from '@/hooks/useStandaloneNoteInput';
import { useGameStore } from '@/stores/gameStore';
import { markAudioUserInteraction, playNote, stopNote } from '@/utils/MidiController';
import { normalizePitchClass } from '@/utils/phraseStreamMatching';
import {
  applySequentialSurvivalVoicingHints,
  applySurvivalVoicingHintsWithOpacity,
  computeKeyboardHintOpacity,
  computeUnpressedNoteOpacity,
} from '@/utils/survivalStaffHintOpacity';
import { cn } from '@/utils/cn';

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

  const [judgeSnapshot, setJudgeSnapshot] = useState<DefensePhraseJudgeState>(
    createInitialPhraseJudgeState(0),
  );
  const [elapsedInt, setElapsedInt] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [finalStats, setFinalStats] = useState<FinalStats | null>(null);
  const inputMethod = useGameStore((state) => state.settings.inputMethod);
  const voiceSequential = inputMethod === 'voice';

  useEffect(() => {
    onClearRef.current = onClear;
  }, [onClear]);

  const trackElapsedForHints = !practiceMode && (
    stage.productionStaffHintMode === 'fade_15s'
    || stage.productionKeyboardHintMode === 'fade_15s'
  );

  const currentPhrase = stage.phrases[judgeSnapshot.phraseIndex] ?? stage.phrases[0] ?? null;
  const phraseKeyFifths = currentPhrase?.keyFifths ?? stage.keyFifths;

  const keyboardHints = useMemo(
    () => getDefensePhraseKeyboardHints(stage.phrases, judgeSnapshot, voiceSequential),
    [stage.phrases, judgeSnapshot, voiceSequential],
  );

  const targetMidis = useMemo(
    () => getDefensePhraseTargetMidis(stage.phrases, judgeSnapshot),
    [stage.phrases, judgeSnapshot],
  );

  const keyboardRangeMidis = useMemo(() => {
    const midis = [...keyboardHints.pendingMidis, ...keyboardHints.completedMidis];
    if (keyboardHints.nextMidi !== null) {
      midis.push(keyboardHints.nextMidi);
    }
    return midis.length > 0 ? midis : targetMidis;
  }, [keyboardHints, targetMidis]);

  const keyboardRange = useResolvedWebKeyboardRange(keyboardRangeMidis);

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

  const applyPhraseSwitch = useCallback((phraseIndex: number): void => {
    const nextPhrase = stage.phrases[phraseIndex];
    if (!nextPhrase) return;

    judgeRef.current = createInitialPhraseJudgeState(phraseIndex);
    setJudgeSnapshot(judgeRef.current);
    defenseBackingDeck.commitSwitch();
    pendingSwitchAtRef.current = null;
    scheduledNextPhraseIndexRef.current = null;

    const preloadPhrase = stage.phrases[nextPhraseIndex(stage.phrases, phraseIndex)];
    if (preloadPhrase) {
      void defenseBackingDeck.preload([preloadPhrase.audioUrl]);
    }
  }, [stage.phrases]);

  const handleNoteOn = useCallback((midiNote: number, sequential = false) => {
    const runtime = runtimeRef.current;
    if (runtime.result !== 'playing') return;

    const evaluation = evaluateDefensePhraseNoteOn(
      stage.phrases,
      stage.requiredCompletionCount,
      judgeRef.current,
      normalizePitchClass(midiNote % 12),
      sequential,
    );

    if (evaluation.nextState === judgeRef.current) return;

    judgeRef.current = evaluation.nextState;
    setJudgeSnapshot(evaluation.nextState);

    if (evaluation.attack) {
      performDefenseSlash(runtime);
    }

    if (evaluation.pendingSwitch && scheduledNextPhraseIndexRef.current === null) {
      const nextIndex = nextPhraseIndex(stage.phrases, judgeRef.current.phraseIndex);
      const nextPhrase = stage.phrases[nextIndex];
      if (!nextPhrase) return;
      scheduledNextPhraseIndexRef.current = nextIndex;
      void (async () => {
        const buffer = await defenseBackingDeck.decodeForDeck(nextPhrase.audioUrl);
        if (scheduledNextPhraseIndexRef.current !== nextIndex) return;
        pendingSwitchAtRef.current = defenseBackingDeck.scheduleSwitch(buffer);
      })();
    }
  }, [stage.phrases, stage.requiredCompletionCount]);

  const handlePianoKeyDown = useCallback((midiNote: number) => {
    markAudioUserInteraction();
    void playNote(midiNote, 100);
    handleNoteOn(midiNote, false);
  }, [handleNoteOn]);

  const handlePianoKeyUp = useCallback((midiNote: number) => {
    void stopNote(midiNote);
  }, []);

  useStandaloneNoteInput({
    onNoteOn: (note) => {
      handleNoteOn(note, voiceSequential);
    },
    onKeyHighlight: (note, active) => {
      pianoRef.current?.highlightKey(note, active);
    },
  });

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
          applyPhraseSwitch(nextIdx);
        }
      }

      if (trackElapsedForHints) {
        const elapsedFloor = Math.floor(runtime.elapsedSec);
        if (elapsedFloor !== elapsedIntRef.current && elapsedFloor <= HINT_FADE_TRACK_LIMIT_SEC) {
          elapsedIntRef.current = elapsedFloor;
          setElapsedInt(elapsedFloor);
        }
      }

      canvasRef.current?.draw(runtime);

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
  }, [difficulty, applyPhraseSwitch, practiceMode, trackElapsedForHints]);

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
    <div className="relative flex h-[100dvh] flex-col bg-slate-950 text-white">
      <div className="absolute left-2 top-2 z-40">
        <button
          type="button"
          className="rounded bg-black/50 px-3 py-1 text-sm"
          onClick={onExit}
        >
          戻る
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <DefenseCanvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="relative z-30 flex shrink-0 flex-col items-center gap-1 px-2 pb-1 pt-2">
        {currentPhrase && currentPhrase.chords.length > 0 && (
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
        )}
        {!audioReady && (
          <p className="text-xs text-slate-400">伴奏を読み込み中…</p>
        )}
      </div>

      <div className={cn('relative z-30 shrink-0', keyboardHintOpacity <= 0 && 'opacity-40')}>
        <DeferredEarTrainingPianoOverlay
          ref={pianoRef}
          minMidi={keyboardRange.minMidi}
          maxMidi={keyboardRange.maxMidi}
          onPianoKeyDown={handlePianoKeyDown}
          onPianoKeyUp={handlePianoKeyUp}
        />
      </div>
    </div>
  );
};
